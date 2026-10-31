import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { AssistantRun, AssistantSnapshot } from "../shared/assistant.ts";
import { CaseService } from "./cases.ts";
import { MaterialService } from "./material-service.ts";
import { IssueService } from "./issue-service.ts";
import { ConnectorManager, HttpError, ToolError } from "./connectors.ts";
import { modelConfigured, modelName } from "./model.ts";
import { reviewMaterials } from "./material-model.ts";
import {
  assistantFormat,
  assistantOutput,
  assistantSystem,
  validateAssistantOutput,
} from "./assistant-model.ts";

export class AssistantService {
  private jobs = new Set<Promise<void>>();
  constructor(
    readonly cases: CaseService,
    readonly materials: MaterialService,
    readonly issues: IssueService,
    readonly connectors: ConnectorManager,
  ) {
    materials.data.db.exec(
      "CREATE TABLE IF NOT EXISTS assistant_runs (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, data TEXT NOT NULL)",
    );
    for (const row of materials.data.db
      .prepare("SELECT data FROM assistant_runs")
      .all() as { data: string }[]) {
      const run: AssistantRun = JSON.parse(row.data);
      if (run.status === "running") {
        run.status = "failed";
        run.error = "服务重启中断了 AI 助理，请重新生成；读取凭证已保留。";
        run.completedAt = new Date().toISOString();
        this.save(run);
      }
    }
  }
  private save(run: AssistantRun) {
    this.materials.data.db
      .prepare(
        "INSERT INTO assistant_runs VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .run(run.id, run.caseId, JSON.stringify(run));
  }
  private runs(caseId: string): AssistantRun[] {
    return (
      this.materials.data.db
        .prepare(
          "SELECT data FROM assistant_runs WHERE caseId=? ORDER BY rowid DESC",
        )
        .all(caseId) as { data: string }[]
    ).map((r) => JSON.parse(r.data));
  }
  snapshot(caseId: string): AssistantSnapshot {
    const c = this.cases.get(caseId),
      m = this.materials.snapshot(caseId);
    return {
      runs: this.runs(caseId),
      materials: m.materials,
      issues: this.issues.list(caseId),
      caseRevision: c.revision,
      model: { configured: modelConfigured(), name: modelName() },
      ready:
        m.connected &&
        m.tools.some((t) => t.name === "read_material_page" && t.enabled),
    };
  }
  start(caseId: string, raw: unknown) {
    const input = z
      .object({
        question: z.string().trim().min(2).max(1200),
        versionIds: z.array(z.string().uuid()).min(1).max(4),
        expectedRevision: z.number().int().positive(),
      })
      .strict()
      .parse(raw);
    const c = this.cases.get(caseId);
    if (c.revision !== input.expectedRevision)
      throw new HttpError(409, "案件资料已更新，请刷新后生成");
    if (!modelConfigured()) throw new HttpError(409, "请先配置模型 API");
    if (this.runs(caseId).some((r) => r.status === "running"))
      throw new HttpError(409, "本案 AI 助理仍在运行");
    if (new Set(input.versionIds).size !== input.versionIds.length)
      throw new HttpError(400, "材料版本重复");
    const selected = input.versionIds.map((id) =>
      this.materials.data.get(caseId, id, true),
    );
    if (selected.reduce((n, m) => n + m.pageCount, 0) > 12)
      throw new HttpError(400, "每轮最多 12 页，请缩小选定材料范围");
    const assertAccess = () => {
      for (const m of selected)
        this.connectors.validateCall(
          "documents",
          "read_material_page",
          { caseId, versionId: m.id, page: 1, access: "model" },
          { caseId, model: true },
        );
    };
    assertAccess();
    const pending = this.issues
      .list(caseId)
      .filter((i) => i.effectiveStatus !== "resolved");
    const run: AssistantRun = {
      id: randomUUID(),
      caseId,
      createdAt: new Date().toISOString(),
      status: "running",
      model: modelName(),
      question: input.question,
      versionIds: input.versionIds,
      traces: [],
      items: [],
      rounds: 0,
      caseRevision: c.revision,
      basisRevision: c.revision,
      issueIds: pending.map((i) => i.id),
      partyIds: c.parties.map((p) => p.id),
      summary: "",
      actions: [],
      applications: {},
    };
    const context = JSON.stringify({
      caseName: c.name,
      background: c.context,
      jurisdiction: c.jurisdiction,
      parties: c.parties.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        identityConfirmed: p.confirmed,
      })),
      pendingIssues: pending.map((i) => ({
        id: i.id,
        title: i.title,
        category: i.category,
        missing: i.missing,
        status: i.effectiveStatus,
      })),
      scopeNotice:
        // Recorded titles help avoid repeating work; prior opinions are not sent as verified facts.
        "未提供既往核查原始凭证。本轮仅分析所选PDF与上述案件陈述，不重新检索外部主体或法律，不决定收案。",
      recordedIssueTitles: this.issues
        .list(caseId)
        .filter((i) => i.effectiveStatus === "resolved")
        .map((i) => i.title),
    });
    this.save(run);
    const job = new Promise<void>((resolve) => setImmediate(resolve))
      .then(async () => {
        try {
          await reviewMaterials(
            run,
            selected,
            context,
            async (id, page) => {
              try {
                const out = await this.materials.read(caseId, id, page, true);
                run.traces.push(out.trace);
                this.save(run);
                return out;
              } catch (error) {
                if (error instanceof ToolError) run.traces.push(error.trace);
                this.save(run);
                throw error;
              }
            },
            assertAccess,
            () => this.save(run),
            {
              schema: assistantOutput,
              system: assistantSystem,
              format: assistantFormat,
              instruction:
                "所有选定页已实际读取。按format输出最多3项有依据、可执行的核实行动与补证请求正文。每处引用的versionId/page/traceId从实际凭证索引复制，quote必须是对应页连续原文，每个选定版本至少引用一次。targetIssueId复用上下文的相同未决问题或null。仅JSON，不再调用工具。",
              accept: (raw) => {
                const out = validateAssistantOutput(raw, run);
                run.summary = out.summary;
                run.actions = out.actions;
              },
            },
          );
          run.status = "completed";
        } catch (error) {
          run.status = "failed";
          run.actions = [];
          run.summary = "";
          run.error =
            error instanceof Error ? error.message : "AI 助理运行失败";
        } finally {
          run.completedAt = new Date().toISOString();
          this.save(run);
        }
      })
      .finally(() => this.jobs.delete(job));
    this.jobs.add(job);
    return run;
  }
  apply(caseId: string, runId: string, raw: unknown) {
    const input = z
      .object({
        index: z.number().int().min(0).max(2),
        expectedRevision: z.number().int().positive(),
        missing: z.string().trim().min(2).max(1500),
        request: z.string().trim().min(2).max(1800),
      })
      .strict()
      .parse(raw);
    this.cases.get(caseId);
    const run = this.runs(caseId).find((r) => r.id === runId);
    if (!run || run.status !== "completed")
      throw new HttpError(404, "本案中不存在已完成的建议");
    if (run.applications[input.index])
      return {
        issueId: run.applications[input.index],
        snapshot: this.snapshot(caseId),
      };
    if (
      run.basisRevision !== input.expectedRevision ||
      this.cases.get(caseId).revision !== run.basisRevision
    )
      throw new HttpError(
        409,
        "案件资料已变化，这轮建议仅供回看；请基于当前材料重新生成",
      );
    const action = run.actions[input.index];
    if (!action) throw new HttpError(404, "建议不存在");
    validateAssistantOutput(
      { summary: run.summary, actions: run.actions },
      run,
    );
    const issueId = this.issues.adoptAssistant(
      caseId,
      `assistant:${run.id}:${input.index}`,
      { ...action, missing: input.missing, request: input.request },
      input.expectedRevision,
    );
    run.applications[input.index] = issueId;
    run.adoptedDrafts = {
      ...run.adoptedDrafts,
      [input.index]: { missing: input.missing, request: input.request },
    };
    run.basisRevision = this.cases.get(caseId).revision;
    this.save(run);
    return { issueId, snapshot: this.snapshot(caseId) };
  }
  async close() {
    await Promise.allSettled([...this.jobs]);
  }
}
