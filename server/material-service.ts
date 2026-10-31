import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { MaterialPage, MaterialReview } from "../shared/materials.ts";
import { MaterialStore } from "./material-store.ts";
import { ConnectorManager, HttpError, ToolError } from "./connectors.ts";
import { CaseService } from "./cases.ts";
import { Store } from "./store.ts";
import { modelConfigured, modelName } from "./model.ts";
import { reviewMaterials, verifyQuote } from "./material-model.ts";
export class MaterialService {
  readonly data: MaterialStore;
  private jobs = new Set<Promise<void>>();
  private activeUploads = new Set<string>();
  constructor(
    dir: string,
    private cases: CaseService,
    private connectors: ConnectorManager,
    private store: Store,
  ) {
    this.data = new MaterialStore(dir);
    this.data.recover();
    connectors.setCasePolicy((caseId, id, model) => {
      cases.get(caseId);
      this.data.get(caseId, id, model);
    });
  }
  snapshot(caseId: string) {
    this.cases.get(caseId);
    return {
      materials: this.data.list(caseId),
      reviews: this.data.reviews(caseId),
      evidence: this.data.evidence(caseId),
      connected: this.connectors.get("documents").connected,
      tools: this.connectors
        .get("documents")
        .tools.map((t) => ({ name: t.name, enabled: t.enabled !== false })),
    };
  }
  async upload(
    caseId: string,
    title: string,
    bytes: Buffer,
    previous?: string,
  ) {
    this.cases.get(caseId);
    title = z.string().trim().min(1).max(160).parse(title);
    if (previous) z.string().uuid().parse(previous);
    if (this.activeUploads.has(caseId))
      throw new HttpError(409, "本案正在导入材料，请稍后重试");
    this.activeUploads.add(caseId);
    try {
      const material = await this.data.add(caseId, title, bytes, previous);
      const oldIds = this.data
        .list(caseId)
        .filter(
          (m) => m.documentId === material.documentId && m.id !== material.id,
        )
        .map((m) => m.id);
      const taskIds = this.data
        .evidence(caseId)
        .filter((e) => oldIds.includes(e.versionId) && e.taskId)
        .map((e) => e.taskId!);
      this.cases.materialsChanged(
        caseId,
        `导入「${title}」v${material.version}；旧版原文和引用保留，新版尚未授权 AI。`,
        taskIds,
      );
      return material;
    } finally {
      this.activeUploads.delete(caseId);
    }
  }
  permit(caseId: string, id: string, allowed: boolean) {
    this.cases.get(caseId);
    this.data.permit(caseId, id, z.boolean().parse(allowed));
    this.store.audit("material-permission", {
      caseId,
      versionId: id,
      allowed,
      at: new Date().toISOString(),
    });
    return this.snapshot(caseId);
  }
  async read(caseId: string, id: string, page: number, model = false) {
    this.cases.get(caseId);
    this.data.get(caseId, id, model);
    return this.connectors.call<MaterialPage>(
      "documents",
      "read_material_page",
      { caseId, versionId: id, page, access: model ? "model" : "user" },
      model ? "model" : "user",
      { caseId, model },
    );
  }
  start(caseId: string, raw: unknown) {
    const file = this.cases.get(caseId);
    const input = z
      .object({
        versionIds: z.array(z.string().uuid()).min(1).max(4),
        question: z.string().trim().min(2).max(1200),
      })
      .strict()
      .parse(raw);
    if (new Set(input.versionIds).size !== input.versionIds.length)
      throw new HttpError(400, "材料版本重复");
    if (!modelConfigured()) throw new HttpError(409, "模型尚未配置");
    if (this.data.reviews(caseId).some((r) => r.status === "running"))
      throw new HttpError(409, "本案材料复核仍在运行");
    const materials = input.versionIds.map((id) =>
      this.data.get(caseId, id, true),
    );
    if (materials.reduce((n, m) => n + m.pageCount, 0) > 12)
      throw new HttpError(400, "每轮最多 12 页，请减少选定材料");
    for (const m of materials)
      this.connectors.validateCall(
        "documents",
        "read_material_page",
        { caseId, versionId: m.id, page: 1, access: "model" },
        { caseId, model: true },
      );
    const r: MaterialReview = {
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
    };
    this.data.saveReview(r);
    const assertAccess = () => {
      for (const m of materials)
        this.connectors.validateCall(
          "documents",
          "read_material_page",
          { caseId, versionId: m.id, page: 1, access: "model" },
          { caseId, model: true },
        );
    };
    const job = new Promise<void>((resolve) => setImmediate(resolve))
      .then(async () => {
        try {
          await reviewMaterials(
            r,
            materials,
            file.context,
            async (id, page) => {
              try {
                const out = await this.read(caseId, id, page, true);
                r.traces.push(out.trace);
                this.data.saveReview(r);
                return out;
              } catch (error) {
                if (error instanceof ToolError) r.traces.push(error.trace);
                this.data.saveReview(r);
                throw error;
              }
            },
            assertAccess,
            () => this.data.saveReview(r),
          );
          r.status = "completed";
        } catch (error) {
          r.status = "failed";
          r.items = [];
          r.error = error instanceof Error ? error.message : "材料复核失败";
        } finally {
          r.completedAt = new Date().toISOString();
          this.data.saveReview(r);
          this.store.audit("material-model-finished", {
            id: r.id,
            caseId,
            status: r.status,
            calls: r.traces.length,
          });
        }
      })
      .finally(() => this.jobs.delete(job));
    this.jobs.add(job);
    return r;
  }
  record(caseId: string, raw: unknown) {
    const file = this.cases.get(caseId);
    const input = z
      .object({
        versionId: z.string().uuid(),
        page: z.number().int().positive(),
        quote: z.string().trim().min(8).max(1800),
        note: z.string().trim().min(2).max(2000),
        taskId: z.string().max(100).optional(),
        expectedRevision: z.number().int().positive(),
      })
      .strict()
      .parse(raw);
    if (input.expectedRevision !== file.revision)
      throw new HttpError(409, "案件已更新，请重新核对材料后保存");
    if (
      input.taskId &&
      !file.tasks.some((t) => t.id === input.taskId && !t.systemManaged)
    )
      throw new HttpError(400, "只能关联本案当前的人工补证待办");
    const source = this.data.page(caseId, input.versionId, input.page);
    if (!verifyQuote(source.text, input.quote))
      throw new HttpError(
        400,
        "引用必须是该版本该页的连续原文，不能改写或省略",
      );
    const { expectedRevision, ...body } = input;
    const evidence = {
      id: randomUUID(),
      caseId,
      ...body,
      createdAt: new Date().toISOString(),
    };
    this.data.addEvidence(evidence);
    this.cases.materialsChanged(
      caseId,
      `保存材料依据：${source.material.title} v${source.material.version} 第 ${input.page} 页；${input.note}`,
      input.taskId ? [input.taskId] : [],
    );
    return evidence;
  }
  report(caseId: string) {
    const snapshot = this.snapshot(caseId);
    const safe = (v: string) => v.replace(/```/g, "\\`\\`\\`");
    return (
      "\n\n## 材料版本与原文依据\n\n" +
      snapshot.materials
        .map(
          (m) =>
            `- ${safe(m.title)} · v${m.version} · ${m.pageCount} 页 · SHA-256 ${m.sha256} · ${m.latest ? "当前版本" : "旧版保留"} · 编号 ${m.id}`,
        )
        .join("\n") +
      "\n\n" +
      snapshot.evidence
        .map((e) => {
          const m = this.data.get(caseId, e.versionId);
          return `### 人工材料记录 ${e.id}\n\n- ${safe(m.title)} v${m.version} 第 ${e.page} 页；${m.latest ? "当前版本" : "已有新版本，引用仍绑定旧版"}\n- SHA-256：${m.sha256}\n- 引用：${safe(e.quote)}\n- 说明：${safe(e.note)}\n- 补证编号：${e.taskId || "未关联"}；时间：${e.createdAt}\n`;
        })
        .join("\n") +
      "\n## 材料 AI 复核与真实 MCP 调用\n\n" +
      snapshot.reviews
        .map(
          (r) =>
            `### ${r.id}\n\n状态：${r.status}；模型：${r.model}；轮次：${r.rounds}；${r.error ? `错误：${safe(r.error)}` : ""}\n\n\`\`\`json\n${safe(JSON.stringify({ question: r.question, items: r.items, traces: r.traces }, null, 2))}\n\`\`\`\n`,
        )
        .join("\n")
    );
  }
  async close() {
    await Promise.allSettled(this.jobs);
    this.data.close();
  }
}
