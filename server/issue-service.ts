import { randomUUID } from "node:crypto";
import { z } from "zod";
import { diffLines } from "diff";
import type {
  IssueCitation,
  IssueSnapshot,
  IssueView,
  MaterialComparison,
  ReviewIssue,
} from "../shared/issues.ts";
import { issueCategories, issueStates } from "../shared/issues.ts";
import { CaseService } from "./cases.ts";
import { MaterialService } from "./material-service.ts";
import { HttpError } from "./connectors.ts";
import { verifyQuote } from "./material-model.ts";
import type { AssistantAction } from "../shared/assistant.ts";

const category = z.enum(["scope", "boundary", "confidentiality", "other"]);
const editable = z.object({
  title: z.string().trim().min(2).max(1000),
  category,
  partyIds: z.array(z.string().max(200)).max(6),
  owner: z.string().trim().max(100),
  missing: z.string().trim().max(3000),
  note: z.string().trim().max(4000),
  status: z.enum(["open", "reviewing", "resolved"]),
});
export class IssueService {
  constructor(
    readonly cases: CaseService,
    readonly materials: MaterialService,
  ) {
    materials.data.db.exec(
      "CREATE TABLE IF NOT EXISTS review_issues (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, sourceKey TEXT, data TEXT NOT NULL, UNIQUE(caseId,sourceKey))",
    );
    cases.setExtraBlockers((id) => {
      const pending = this.list(id).filter(
        (i) => i.effectiveStatus !== "resolved",
      );
      return pending.length
        ? [`${pending.length} 个审查问题尚待核实或材料变更复核`]
        : [];
    });
  }
  private rows(caseId: string): ReviewIssue[] {
    return (
      this.materials.data.db
        .prepare(
          "SELECT data FROM review_issues WHERE caseId=? ORDER BY rowid DESC",
        )
        .all(caseId) as { data: string }[]
    ).map((r) => JSON.parse(r.data));
  }
  private save(i: ReviewIssue) {
    this.materials.data.db
      .prepare(
        "INSERT INTO review_issues VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .run(i.id, i.caseId, i.sourceKey || null, JSON.stringify(i));
  }
  list(caseId: string): IssueView[] {
    const materials = this.materials.data.list(caseId);
    return this.rows(caseId).map((i) => {
      const impacts: IssueView["impacts"] = [];
      const last = i.reviews.at(-1);
      const documents = new Set(
        i.citations
          .map((c) => materials.find((m) => m.id === c.versionId)?.documentId)
          .filter(Boolean),
      );
      for (const documentId of documents) {
        const latest = materials.find(
          (m) => m.documentId === documentId && m.latest,
        )!;
        const acknowledged = last?.versions.find(
          (v) => v.documentId === documentId,
        );
        const oldCitations = i.citations.filter(
          (c) =>
            materials.find((m) => m.id === c.versionId)?.documentId ===
              documentId && c.versionId !== latest.id,
        );
        if (oldCitations.length && acknowledged?.versionId !== latest.id) {
          const from = materials.find(
            (m) =>
              m.id === (acknowledged?.versionId || oldCitations[0].versionId),
          )!;
          impacts.push({
            documentId: documentId!,
            from,
            to: latest,
            citationIds: oldCitations.map((c) => c.id),
            previousOpinion: last,
          });
        }
      }
      return {
        ...i,
        impacts,
        effectiveStatus: impacts.length ? "stale" : i.status,
      };
    });
  }
  snapshot(caseId: string): IssueSnapshot {
    const matter = this.cases.get(caseId);
    return {
      issues: this.list(caseId),
      materials: this.materials.data.list(caseId),
      reviews: this.materials.data.reviews(caseId),
      evidence: this.materials.data.evidence(caseId),
      caseRevision: matter.revision,
    };
  }
  adoptAssistant(
    caseId: string,
    key: string,
    action: AssistantAction,
    expected: number,
  ) {
    const existing = this.list(caseId).find((i) =>
      i.assistantApplications?.includes(key),
    );
    if (existing) return existing.id;
    this.check(caseId, expected);
    const target = action.targetIssueId
      ? this.get(caseId, action.targetIssueId)
      : undefined;
    if (!target && this.list(caseId).length >= 50)
      throw new HttpError(409, "本案最多保存 50 个审查问题");
    for (const c of action.citations) {
      const source = this.materials.data.page(caseId, c.versionId, c.page);
      if (!verifyQuote(source.text, c.quote))
        throw new HttpError(400, "建议引用无法对应原文");
    }
    const now = new Date().toISOString();
    const issue: ReviewIssue = target
      ? { ...target }
      : {
          id: randomUUID(),
          caseId,
          revision: 0,
          title: action.title,
          category: action.category,
          partyIds: action.partyIds,
          sourceKey: key,
          owner: "",
          missing: "",
          note: "",
          status: "reviewing",
          citations: [],
          reviews: [],
          createdAt: now,
          updatedAt: now,
        };
    issue.missing = [issue.missing, action.missing]
      .filter(Boolean)
      .join("\n\n");
    issue.note = [
      issue.note,
      `【AI 补证请求草稿 · 待律师核实】\n${action.request}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    if (issue.note.length > 4000 || issue.missing.length > 3000)
      throw new HttpError(
        400,
        "原记录与草稿合并后过长，请缩短补证草稿；原记录未修改",
      );
    issue.citations = [...issue.citations];
    for (const c of action.citations)
      if (
        !issue.citations.some(
          (old) =>
            old.versionId === c.versionId &&
            old.page === c.page &&
            old.quote === c.quote,
        )
      )
        issue.citations.push({
          id: randomUUID(),
          versionId: c.versionId,
          page: c.page,
          quote: c.quote,
          relation: "context",
        });
    if (issue.citations.length > 20)
      throw new HttpError(400, "该问题的原文依据已达上限，请手动整理后重试");
    issue.status = "reviewing";
    issue.assistantApplications = [...(issue.assistantApplications || []), key];
    this.change(issue, `采用 AI 补证草稿至「${issue.title}」；仍待律师复核。`);
    return issue.id;
  }
  private get(caseId: string, id: string) {
    this.cases.get(caseId);
    const issue = this.list(caseId).find((i) => i.id === id);
    if (!issue) throw new HttpError(404, "本案中不存在该审查问题");
    return issue;
  }
  private check(caseId: string, expected: number) {
    if (this.cases.get(caseId).revision !== expected)
      throw new HttpError(
        409,
        "案件资料已更新，请刷新问题工作台后保存；原输入仍保留",
      );
  }
  private change(issue: ReviewIssue, message: string) {
    issue.revision++;
    issue.updatedAt = new Date().toISOString();
    this.save(issue);
    this.cases.materialsChanged(issue.caseId, message);
    return this.snapshot(issue.caseId);
  }
  create(caseId: string, raw: unknown) {
    const input = z
      .object({
        expectedRevision: z.number().int().positive(),
        title: z.string().trim().min(2).max(1000).optional(),
        category: category.default("other"),
        taskId: z.string().optional(),
        reviewId: z.string().uuid().optional(),
        itemIndex: z.number().int().nonnegative().optional(),
      })
      .strict()
      .parse(raw);
    this.check(caseId, input.expectedRevision);
    const matter = this.cases.get(caseId);
    let title = input.title,
      sourceKey: string | undefined,
      partyIds: string[] = [],
      citations: IssueCitation[] = [],
      kind = input.category,
      missing = "";
    if (input.taskId && input.reviewId)
      throw new HttpError(400, "请选择一种问题来源");
    if (input.taskId) {
      const task = matter.tasks.find(
        (t) => t.id === input.taskId && !t.systemManaged,
      );
      if (!task) throw new HttpError(400, "只能从当前人工补证项建立问题");
      title = task.title;
      sourceKey = `task:${task.id}`;
      partyIds = task.partyIds;
      kind = task.kind === "confidentiality" ? "confidentiality" : "scope";
      missing = task.description;
    } else if (input.reviewId) {
      const review = this.materials.data
        .reviews(caseId)
        .find((r) => r.id === input.reviewId && r.status === "completed");
      const item = review?.items[input.itemIndex ?? -1];
      if (!item) throw new HttpError(404, "本案中不存在该已完成的 AI 问题");
      title = item.question;
      sourceKey = `ai:${input.reviewId}:${input.itemIndex}`;
      citations = item.citations.map((c) => ({
        id: randomUUID(),
        versionId: c.versionId,
        page: c.page,
        quote: c.quote,
        relation: "context",
      }));
    }
    if (!title) throw new HttpError(400, "请填写问题或选择有效来源");
    const existing =
      sourceKey && this.rows(caseId).find((i) => i.sourceKey === sourceKey);
    if (existing) return this.snapshot(caseId);
    if (this.rows(caseId).length >= 50)
      throw new HttpError(409, "本案最多 50 个审查问题");
    const at = new Date().toISOString();
    const i: ReviewIssue = {
      id: randomUUID(),
      caseId,
      title,
      category: kind,
      partyIds,
      taskId: input.taskId,
      sourceKey,
      owner: "",
      missing,
      note: "",
      status: "open",
      citations,
      reviews: [],
      revision: 1,
      createdAt: at,
      updatedAt: at,
    };
    this.save(i);
    this.cases.materialsChanged(caseId, `建立审查问题：${title}`);
    return this.snapshot(caseId);
  }
  update(caseId: string, id: string, raw: unknown) {
    const input = editable
      .extend({
        expectedRevision: z.number().int().positive(),
        issueRevision: z.number().int().positive(),
        acknowledgedVersionIds: z.array(z.string().uuid()).max(30).default([]),
      })
      .strict()
      .parse(raw);
    this.check(caseId, input.expectedRevision);
    const current = this.get(caseId, id);
    if (current.revision !== input.issueRevision)
      throw new HttpError(409, "该问题已由其他操作更新，请刷新后重新保存");
    const matter = this.cases.get(caseId);
    if (input.partyIds.some((p) => !matter.parties.some((v) => v.id === p)))
      throw new HttpError(400, "关联主体必须属于本案");
    const { effectiveStatus, impacts, ...issue } = current;
    const {
      expectedRevision,
      issueRevision,
      acknowledgedVersionIds,
      ...fields
    } = input;
    if (input.status === "resolved") {
      if (!input.owner || input.note.length < 10 || !issue.citations.length)
        throw new HttpError(
          400,
          "记录处理意见须填写责任人、至少 10 字说明和一条原文依据",
        );
      if (impacts.some((p) => !acknowledgedVersionIds.includes(p.to.id)))
        throw new HttpError(409, "请逐份核对最新版本并确认变更影响");
      if (
        impacts.some(
          (p) => !issue.citations.some((c) => c.versionId === p.to.id),
        )
      )
        throw new HttpError(409, "请补充每份受影响材料最新版本的原文依据");
      if (input.missing.trim())
        throw new HttpError(
          409,
          "仍有待补信息，请完成核实或在意见中说明处理依据后清空待补栏",
        );
      const documents = new Set(
        issue.citations.map(
          (c) => this.materials.data.get(caseId, c.versionId).documentId,
        ),
      );
      const versions = this.materials.data
        .list(caseId)
        .filter((m) => m.latest && documents.has(m.documentId))
        .map((m) => ({
          documentId: m.documentId,
          versionId: m.id,
          sha256: m.sha256,
        }));
      issue.reviews.push({
        id: randomUUID(),
        at: new Date().toISOString(),
        reviewer: input.owner,
        note: input.note,
        basis: structuredClone(issue.citations),
        versions,
      });
    }
    Object.assign(issue, fields);
    return this.change(
      issue,
      `审查问题「${issue.title}」已保存${input.status === "resolved" ? "处理意见" : "工作记录"}；填写人 ${issue.owner || "未指定"}（身份未验证）。`,
    );
  }
  addCitation(caseId: string, id: string, raw: unknown) {
    const input = z
      .object({
        expectedRevision: z.number().int().positive(),
        versionId: z.string().uuid(),
        page: z.number().int().positive(),
        quote: z.string().trim().min(8).max(1800),
        relation: z.enum(["support", "contradict", "context"]),
      })
      .strict()
      .parse(raw);
    this.check(caseId, input.expectedRevision);
    const { effectiveStatus, impacts, ...issue } = this.get(caseId, id);
    const page = this.materials.data.page(caseId, input.versionId, input.page);
    if (!verifyQuote(page.text, input.quote))
      throw new HttpError(400, "引用必须为本案所选版本该页的连续原文");
    if (issue.citations.length >= 20)
      throw new HttpError(409, "每个问题最多 20 条原文依据");
    if (
      issue.citations.some(
        (c) =>
          c.versionId === input.versionId &&
          c.page === input.page &&
          c.quote === input.quote &&
          c.relation === input.relation,
      )
    )
      return this.snapshot(caseId);
    issue.citations.push({
      id: randomUUID(),
      versionId: input.versionId,
      page: input.page,
      quote: input.quote,
      relation: input.relation,
    });
    issue.status = "reviewing";
    return this.change(
      issue,
      `为审查问题「${issue.title}」补充 v${page.material.version} 第 ${input.page} 页依据；原意见保留，需重新记录处理意见。`,
    );
  }
  async compare(
    caseId: string,
    fromId: string,
    toId: string,
  ): Promise<MaterialComparison> {
    this.cases.get(caseId);
    const from = this.materials.data.get(caseId, fromId),
      to = this.materials.data.get(caseId, toId);
    if (from.documentId !== to.documentId || from.version >= to.version)
      throw new HttpError(400, "请选择同一材料由旧到新的两个版本");
    const pages: MaterialComparison["pages"] = [],
      traces: MaterialComparison["traces"] = [];
    for (let page = 1; page <= Math.max(from.pageCount, to.pageCount); page++) {
      let before = "",
        after = "";
      if (page <= from.pageCount) {
        const r = await this.materials.read(caseId, fromId, page);
        before = r.data.text;
        traces.push(r.trace);
      }
      if (page <= to.pageCount) {
        const r = await this.materials.read(caseId, toId, page);
        after = r.data.text;
        traces.push(r.trace);
      }
      const changes = diffLines(before, after, {
        timeout: 100,
        maxEditLength: 4000,
      });
      pages.push({
        page,
        before,
        after,
        changed: before !== after,
        truncatedDiff: !changes,
        changes: changes || [
          { value: before, removed: true },
          { value: after, added: true },
        ],
      });
    }
    return {
      from,
      to,
      pages,
      traces,
      changedPages: pages.filter((p) => p.changed).length,
      affectedIssueIds: this.list(caseId)
        .filter((i) => i.citations.some((c) => c.versionId === fromId))
        .map((i) => i.id),
    };
  }
  compareReview(caseId: string, raw: unknown) {
    const input = z
      .object({ from: z.string().uuid(), to: z.string().uuid() })
      .strict()
      .parse(raw);
    const from = this.materials.data.get(caseId, input.from),
      to = this.materials.data.get(caseId, input.to);
    if (from.documentId !== to.documentId || from.version >= to.version)
      throw new HttpError(400, "请选择同一材料的旧版和新版");
    const titles = this.list(caseId)
      .filter((i) => i.citations.some((c) => c.versionId === from.id))
      .map((i) => i.title)
      .join("；")
      .slice(0, 650);
    return this.materials.start(caseId, {
      versionIds: [from.id, to.id],
      question: `比较旧版 v${from.version} 与新版 v${to.version}，逐项提出变更对委托范围、客户边界及保密义务的待核实影响。每项差异尽量同时引用新旧原文，明确不确定性，不作收案决定。关联审查问题（仅为用户记录）：${titles || "尚未建立"}。`,
    });
  }
  markdown(caseId: string) {
    const text = (value: string) =>
      value
        .replace(/[\r\n]+/g, " ")
        .replace(/[<>]/g, "")
        .replace(/([\\`*_{}\[\]|#])/g, "\\$1");
    return (
      "\n\n## 审查问题与处理意见\n\n" +
      this.list(caseId)
        .map(
          (i) =>
            `### ${text(i.title)}\n\n类别：${issueCategories[i.category]}；状态：${issueStates[i.effectiveStatus]}；责任人：${text(i.owner || "未指定")}\n\n待补：${text(i.missing || "未记录")}\n\n意见：${text(i.note || "未记录")}\n\n历史意见 ${i.reviews.length} 次；原文依据 ${i.citations.length} 条；待复核材料变更 ${i.impacts.length} 份\n`,
        )
        .join("\n")
    );
  }
}
