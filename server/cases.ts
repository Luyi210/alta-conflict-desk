import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  CaseDecision,
  CaseFile,
  CaseInput,
  CaseParty,
  CaseTask,
  CaseView,
  Entity,
  Run,
} from "../shared/types.ts";
import { HttpError } from "./connectors.ts";
import { entitySchema, ScreeningService } from "./screening.ts";
import { Store } from "./store.ts";

const partySchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/, "主体编号只能包含字母、数字、下划线或连字符"),
    name: z.string().trim().min(1).max(300),
    role: z.enum(["拟委托人", "交易对方", "担保方", "其他相关方"]),
    confirmed: z.boolean(),
    entity: entitySchema.optional(),
  })
  .refine(
    (p) => !p.confirmed || !!p.entity,
    "已确认主体必须提供有效的企业身份记录",
  );
export const caseInputSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    context: z.string().trim().max(4000),
    jurisdiction: z.string().trim().min(1).max(200),
    mode: z.enum(["rules", "ai"]),
    parties: z.array(partySchema).min(1).max(6),
  })
  .superRefine((input, ctx) => {
    if (!input.parties.some((p) => p.confirmed && p.entity))
      ctx.addIssue({
        code: "custom",
        path: ["parties"],
        message: "请至少确认一个主体身份后开始核查",
      });
    const ids = new Set<string>();
    const leis = new Set<string>();
    input.parties.forEach((p, index) => {
      if (ids.has(p.id))
        ctx.addIssue({
          code: "custom",
          path: ["parties", index, "id"],
          message: "主体编号不能重复",
        });
      ids.add(p.id);
      if (p.entity && leis.has(p.entity.lei))
        ctx.addIssue({
          code: "custom",
          path: ["parties", index, "entity"],
          message: "同一 LEI 请合并为一个主体，并在事项背景中说明兼任角色",
        });
      if (p.entity) leis.add(p.entity.lei);
    });
  });
export const resolvePartySchema = z.object({
  entity: entitySchema,
  confirmed: z.literal(true),
});
export const caseTaskSchema = z.object({
  status: z.enum(["open", "resolved"]),
  note: z.string().trim().max(4000),
  reference: z.string().trim().max(2000),
  expectedRevision: z.number().int().positive().optional(),
});
export const caseDecisionSchema = z
  .object({
    status: z.enum([
      "draft",
      "needs-information",
      "needs-partner-review",
      "review-recorded",
      "declined",
    ]),
    note: z.string().trim().max(6000),
    reviewer: z.string().trim().max(100),
    expectedRevision: z.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.status === "draft" || (v.note.length >= 2 && v.reviewer.length >= 2),
    "请填写审查人姓名和至少 2 字的审查说明",
  );

const decisionLabels: Record<CaseDecision["status"], string> = {
  draft: "草稿",
  "needs-information": "待补充材料",
  "needs-partner-review": "待进一步复核",
  "review-recorded": "审查记录完备",
  declined: "不承接，结束审查",
};

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const stableTaskId = (kind: CaseTask["kind"], key: string) =>
  `${kind}-${hash(key).slice(0, 20)}`;
const now = () => new Date().toISOString();

export class CaseService {
  private extraBlockers: (caseId: string) => string[] = () => [];
  setExtraBlockers(provider: (caseId: string) => string[]) {
    this.extraBlockers = provider;
  }
  constructor(
    private store: Store,
    private screening: ScreeningService,
  ) {}

  create(raw: CaseInput): CaseView {
    const input = caseInputSchema.parse(raw);
    const at = now();
    const file: CaseFile = {
      id: randomUUID(),
      ...input,
      createdAt: at,
      updatedAt: at,
      revision: 1,
      parties: input.parties.map((p) => ({
        ...p,
        name: p.confirmed ? p.entity!.name : p.name,
      })),
      tasks: [],
      decision: { status: "draft", note: "", reviewer: "", revision: 1 },
      activity: [],
    };
    for (const party of file.parties)
      if (party.confirmed) party.runId = this.startRun(file, party).id;
    this.event(
      file,
      "created",
      `创建案件；${file.parties.filter((p) => p.confirmed).length} 个已确认主体开始核查，${file.parties.filter((p) => !p.confirmed).length} 个主体待补充身份。`,
    );
    this.save(file);
    return this.get(file.id);
  }

  list(): CaseView[] {
    return this.store.listCases().map((file) => this.get(file.id));
  }
  materialsChanged(id: string, message: string, reopenTaskIds: string[] = []) {
    const file = this.file(this.get(id));
    for (const task of file.tasks)
      if (reopenTaskIds.includes(task.id) && !task.systemManaged)
        task.status = "open";
    this.invalidate(file, message, "material-evidence-updated");
    this.save(file);
    return this.get(id);
  }

  get(id: string): CaseView {
    const file = this.store.getCase(id);
    if (!file) throw new HttpError(404, "案件不存在");
    const runs = this.runs(file);
    const fingerprint = this.fingerprint(file, runs);
    if (this.store.caseFingerprint(id) !== fingerprint) {
      this.invalidate(
        file,
        "子核查结果、来源或律师复核发生变化，请按当前资料重新审查。",
        "evidence-updated",
      );
    }
    const tasks = this.deriveTasks(file, runs);
    if (
      JSON.stringify(tasks) !== JSON.stringify(file.tasks) ||
      this.store.caseFingerprint(id) !== fingerprint
    ) {
      file.tasks = tasks;
      file.updatedAt = now();
      this.store.saveCase(file, fingerprint);
    }
    return this.view(file, runs);
  }

  resolveParty(
    id: string,
    partyId: string,
    raw: { entity: Entity; confirmed: true },
  ): CaseView {
    const { entity } = resolvePartySchema.parse(raw);
    const view = this.get(id);
    const file = this.file(view);
    const party = this.party(file, partyId);
    this.assertNotRunning(party);
    if (
      file.parties.some((p) => p.id !== partyId && p.entity?.lei === entity.lei)
    )
      throw new HttpError(
        409,
        "该 LEI 已在本案件中，请合并主体角色，避免重复核查",
      );
    const oldRun = party.runId;
    const candidate: CaseParty = {
      ...party,
      name: entity.name,
      entity,
      confirmed: true,
    };
    const run = this.startRun(file, candidate);
    Object.assign(party, candidate, { runId: run.id });
    this.reopenPartyTasks(file, partyId);
    this.invalidate(
      file,
      `主体「${party.name}」补录身份并重新核查；旧核查 ${oldRun || "无"}，新核查 ${run.id}。`,
      "identity-resolved",
    );
    this.save(file);
    return this.get(id);
  }

  retryParty(id: string, partyId: string): CaseView {
    const file = this.file(this.get(id));
    const party = this.party(file, partyId);
    if (!party.confirmed || !party.entity)
      throw new HttpError(409, "请先补录并确认主体身份");
    this.assertNotRunning(party);
    const oldRun = party.runId;
    const run = this.startRun(file, party);
    party.runId = run.id;
    this.reopenPartyTasks(file, partyId);
    this.invalidate(
      file,
      `主体「${party.name}」重新核查；旧核查 ${oldRun || "无"}，新核查 ${run.id}。旧记录保留。`,
      "party-retried",
    );
    this.save(file);
    return this.get(id);
  }

  updateTask(
    id: string,
    taskId: string,
    raw: z.infer<typeof caseTaskSchema>,
  ): CaseView {
    const input = caseTaskSchema.parse(raw);
    const file = this.file(this.get(id));
    this.assertRevision(file, input.expectedRevision);
    const task = file.tasks.find((t) => t.id === taskId);
    if (!task) throw new HttpError(404, "补证待办不存在或已由最新结果替代");
    if (task.systemManaged)
      throw new HttpError(
        409,
        "此待办由身份或来源状态管理；请补录身份或重新核查，不能手动勾选消除",
      );
    if (
      input.status === "resolved" &&
      (input.note.length < 2 || input.reference.length < 2)
    )
      throw new HttpError(
        400,
        "完成补证需要至少 2 字的核实说明和材料引用；引用仅作本地记录，不代表已上传文件",
      );
    if (
      input.status === task.status &&
      input.note === task.note &&
      input.reference === task.reference
    )
      return this.get(id);
    Object.assign(task, {
      status: input.status,
      note: input.note,
      reference: input.reference,
      updatedAt: now(),
    });
    this.invalidate(
      file,
      `补证「${task.title}」更新为${task.status === "resolved" ? "已补齐" : "待补充"}；说明：${task.note || "未填写"}；材料引用：${task.reference || "未填写"}。`,
      "task-updated",
    );
    this.save(file);
    return this.get(id);
  }

  recordDecision(
    id: string,
    raw: {
      status: CaseDecision["status"];
      note: string;
      reviewer: string;
      expectedRevision?: number;
    },
  ): CaseView {
    const input = caseDecisionSchema.parse(raw);
    const view = this.get(id);
    this.assertRevision(view, input.expectedRevision);
    if (input.status === "declined" && view.status === "running")
      throw new HttpError(409, "核查仍在运行，请等待本轮结果保存后结束审查");
    if (input.status === "review-recorded" && view.blockers.length)
      throw new HttpError(409, `审查记录尚不完备：${view.blockers.join("；")}`);
    const file = this.file(view);
    file.decision = {
      status: input.status,
      note: input.note,
      reviewer: input.reviewer,
      revision: file.revision,
      ...(input.status === "draft" ? {} : { recordedAt: now() }),
    };
    this.event(
      file,
      "decision-recorded",
      `人工审查状态：${decisionLabels[input.status]}；填写人：${input.reviewer || "未填写"}（身份未验证）；说明：${input.note || "未填写"}。此记录不批准收案，也不发送通知。`,
    );
    this.save(file);
    return this.get(id);
  }

  private assertRevision(file: CaseFile, expected?: number) {
    if (expected !== undefined && expected !== file.revision)
      throw new HttpError(
        409,
        "资料版本已更新，请查看最新证据后再次保存；输入内容仍保留在当前页面",
      );
  }
  private file(view: CaseView): CaseFile {
    const {
      runs: _runs,
      status: _status,
      blockers: _blockers,
      progress: _progress,
      ...file
    } = view;
    return file;
  }
  private party(file: CaseFile, id: string) {
    const party = file.parties.find((p) => p.id === id);
    if (!party) throw new HttpError(404, "案件主体不存在");
    return party;
  }
  private assertNotRunning(party: CaseParty) {
    if (party.runId && this.store.get(party.runId)?.status === "running")
      throw new HttpError(409, "该主体仍在核查中，请等待完成后重试或修改身份");
  }
  private startRun(file: CaseFile, party: CaseParty) {
    return this.screening.create({
      matterName: file.name,
      prospectiveClient:
        file.parties
          .filter((p) => p.role === "拟委托人")
          .map((p) => p.name)
          .join("、")
          .slice(0, 200) || "未指定拟委托人（见案件主体清单）",
      context: file.context,
      jurisdiction: file.jurisdiction,
      partyRole: party.role,
      entity: party.entity!,
      mode: file.mode,
    });
  }
  private runs(file: CaseFile): Run[] {
    return file.parties.flatMap((p) =>
      p.runId ? [this.store.get(p.runId)].filter((r): r is Run => !!r) : [],
    );
  }
  private fingerprint(file: CaseFile, runs: Run[]) {
    // In-progress trace streaming cannot validate a decision; completed evidence and every review field must invalidate it.
    return hash(
      file.parties.map((p) => {
        const run = runs.find((r) => r.id === p.runId);
        return {
          partyId: p.id,
          runId: p.runId,
          evidence:
            run?.status === "running"
              ? { id: run.id, status: run.status }
              : run || null,
        };
      }),
    );
  }
  private save(file: CaseFile) {
    const runs = this.runs(file);
    file.tasks = this.deriveTasks(file, runs);
    file.updatedAt = now();
    this.store.saveCase(file, this.fingerprint(file, runs));
  }
  private event(file: CaseFile, type: string, message: string) {
    const activity = { id: randomUUID(), at: now(), type, message };
    file.activity.push(activity);
    file.updatedAt = activity.at;
    this.store.audit(`case-${type}`, {
      caseId: file.id,
      revision: file.revision,
      ...activity,
    });
  }
  private invalidate(file: CaseFile, reason: string, type: string) {
    file.revision += 1;
    const previous = file.decision;
    if (previous.status !== "draft")
      this.event(
        file,
        "decision-invalidated",
        `旧审查状态「${decisionLabels[previous.status]}」（修订 ${previous.revision}，填写人 ${previous.reviewer}，说明 ${previous.note}）已失效：${reason}`,
      );
    file.decision = {
      status: "draft",
      note: previous.note,
      reviewer: previous.reviewer,
      revision: file.revision,
      ...(previous.status !== "draft" || previous.invalidatedAt
        ? { invalidatedAt: now() }
        : {}),
    };
    this.event(file, type, reason);
  }
  private reopenPartyTasks(file: CaseFile, id: string) {
    for (const task of file.tasks)
      if (task.partyIds.includes(id) && !task.systemManaged) {
        task.status = "open";
        task.updatedAt = now();
      }
  }
  private deriveTasks(file: CaseFile, runs: Run[]): CaseTask[] {
    const tasks = new Map<string, CaseTask>();
    const add = (
      kind: CaseTask["kind"],
      key: string,
      partyId: string,
      title: string,
      description: string,
      systemManaged: boolean,
    ) => {
      const id = stableTaskId(kind, key);
      const existing = tasks.get(id);
      if (existing) {
        if (!existing.partyIds.includes(partyId))
          existing.partyIds.push(partyId);
        if (!file.tasks.find((t) => t.id === id)?.partyIds.includes(partyId))
          existing.status = "open";
        return;
      }
      const previous = file.tasks.find((t) => t.id === id);
      tasks.set(id, {
        id,
        kind,
        title,
        description,
        partyIds: [partyId],
        required: true,
        systemManaged,
        status:
          systemManaged || !previous?.partyIds.includes(partyId)
            ? "open"
            : previous.status,
        note: previous?.note || "",
        reference: previous?.reference || "",
        ...(previous?.updatedAt ? { updatedAt: previous.updatedAt } : {}),
      });
    };
    for (const party of file.parties) {
      if (!party.confirmed || !party.entity) {
        add(
          "identity",
          party.id,
          party.id,
          `确认主体：${party.name}`,
          "请搜索并确认登记身份。未取得可靠身份前，该主体不计入已核查范围。",
          true,
        );
        continue;
      }
      const run = runs.find((r) => r.id === party.runId);
      if (!run || run.status === "failed" || run.status === "partial")
        add(
          "coverage",
          party.id,
          party.id,
          `补齐来源：${party.name}`,
          !run
            ? "未找到有效核查记录，请重新核查。"
            : `本次核查${run.status === "failed" ? "失败" : "来源不完整"}。${run.error || run.gaps.filter((g) => /失败|未完成|不可用|无法|缺失|未披露|异常/.test(g)).join("；") || "请检查单主体范围说明和调用记录，修复来源后重跑。"}`,
          true,
        );
      for (const finding of run?.findings || []) {
        // A dismissed name-only hit is not evidence that an engagement belongs to this party.
        if (finding.type === "similar" && finding.review === "dismissed")
          continue;
        const match = finding.match;
        add(
          "scope",
          match.id,
          party.id,
          `核实委托范围 · ${match.matterRef}`,
          `核实「${match.matterName}」涉及的身份、委托范围及与本事项的关系，记录材料引用。${finding.type === "similar" ? "当前仅名称相似，须先确认是否同一主体。" : "记录命中或公司关联不自动构成法律冲突。"}`,
          false,
        );
        if (
          /既往|已结案|结束|closed|former/i.test(
            `${match.relationship} ${match.status}`,
          )
        )
          add(
            "confidentiality",
            match.id,
            party.id,
            `核实既往保密义务 · ${match.matterRef}`,
            `核实「${match.matterName}」已取得的保密信息及相关义务；请填写核实说明与材料引用，不在此表披露保密内容。`,
            false,
          );
      }
    }
    return [...tasks.values()];
  }
  private view(file: CaseFile, runs: Run[]): CaseView {
    const blockers: string[] = this.extraBlockers(file.id);
    for (const party of file.parties) {
      if (!party.confirmed || !party.entity) {
        blockers.push(`「${party.name}」身份未确认`);
        continue;
      }
      const run = runs.find((r) => r.id === party.runId);
      if (!run) blockers.push(`「${party.name}」缺少核查记录`);
      else if (run.status === "running")
        blockers.push(`「${party.name}」核查仍在运行`);
      else if (run.status !== "completed")
        blockers.push(
          `「${party.name}」${run.status === "failed" ? "来源核查失败" : "来源覆盖不完整"}`,
        );
    }
    const pending = runs
      .flatMap((r) => r.findings)
      .filter((f) => f.review === "pending" || f.review === "escalated");
    if (pending.length)
      blockers.push(`${pending.length} 条线索仍待复核或进一步复核`);
    const openTasks = file.tasks.filter(
      (t) => t.required && t.status === "open",
    );
    if (openTasks.some((t) => !t.systemManaged))
      blockers.push(
        `${openTasks.filter((t) => !t.systemManaged).length} 项委托范围或保密补证尚未补齐`,
      );
    return {
      ...file,
      runs,
      blockers,
      status: runs.some((r) => r.status === "running")
        ? "running"
        : file.decision.status === "declined"
          ? "closed"
          : blockers.length
            ? "needs-attention"
            : file.decision.status === "review-recorded"
              ? "recorded"
              : "ready-for-review",
      progress: {
        total: file.parties.length,
        confirmed: file.parties.filter((p) => p.confirmed && p.entity).length,
        completed: runs.filter((r) => r.status === "completed").length,
        findings: runs.reduce((n, r) => n + r.findings.length, 0),
        pendingFindings: pending.length,
        openTasks: openTasks.length,
      },
    };
  }
}
