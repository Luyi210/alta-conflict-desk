import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  Entity,
  Finding,
  LedgerMatch,
  Relation,
  Run,
  RunInput,
  Trace,
} from "../shared/types.ts";
import { ConnectorManager, HttpError, ToolError } from "./connectors.ts";
import { Store } from "./store.ts";
import { modelConfigured, modelReview } from "./model.ts";

export const entitySchema = z.object({
  lei: z.string().regex(/^[A-Z0-9]{20}$/),
  name: z.string().min(1).max(300),
  jurisdiction: z.string().max(100),
  status: z.string().max(100),
  address: z.string().max(1000),
  sourceUrl: z.string().url(),
  fetchedAt: z.string().datetime(),
});
export const runInputSchema = z.object({
  matterName: z.string().trim().min(2).max(200),
  prospectiveClient: z.string().trim().min(2).max(200),
  partyRole: z.enum(["对方当事人", "交易对方", "交易对手", "其他相关方"]),
  entity: entitySchema,
  mode: z.enum(["rules", "ai"]),
});
export const reviewSchema = z
  .object({
    review: z.enum(["pending", "escalated", "dismissed"]),
    note: z.string().trim().max(2000),
  })
  .refine(
    (v) => v.review === "pending" || v.note.length >= 2,
    "请填写至少 2 字的复核理由",
  );
export const coverageGaps = [
  "核查仅覆盖选定对方主体及 GLEIF 披露的直接/最终母公司；拟委托人字段仅为事项背景，尚未执行其主体核查。",
  "GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。",
  "内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。",
];
export function buildFindings(
  entity: Entity,
  matches: LedgerMatch[],
  evidenceTraceIds: string[],
  relation?: Relation,
): Finding[] {
  return matches.map((match) => {
    const identityConfirmed = match.matchType === "exact-lei";
    const type = identityConfirmed
      ? relation
        ? "related"
        : "direct"
      : "similar";
    return {
      id: randomUUID(),
      type,
      title:
        type === "direct"
          ? "同一主体出现在既有事项"
          : type === "related"
            ? "公开母公司出现在既有事项"
            : "近似/同名记录，身份待确认",
      summary:
        type === "direct"
          ? `LEI 与虚构台账 ${match.matterRef} 完全一致。请核实委托范围与在办义务。`
          : type === "related"
            ? `公开${relation?.type === "direct-parent" ? "直接" : "最终"}母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。`
            : `仅名称匹配，尚不能确认与 ${match.clientName} 为同一主体。请补充登记信息。`,
      entity,
      ...(relation ? { relation } : {}),
      match,
      evidenceTraceIds,
      review: "pending",
      reviewNote: "",
    };
  });
}
export class ScreeningService {
  private jobs = new Set<Promise<void>>();
  constructor(
    private store: Store,
    private connectors: ConnectorManager,
  ) {}
  create(input: RunInput) {
    for (const c of this.connectors.list())
      if (!c.connected) throw new HttpError(409, `请先连接${c.name}`);
    if (input.mode === "ai" && !modelConfigured())
      throw new HttpError(
        409,
        "尚未配置模型 API；请选择规则预览，或在 .env 中配置模型后重启服务。",
      );
    const run: Run = {
      id: randomUUID(),
      ...input,
      status: "running",
      createdAt: new Date().toISOString(),
      findings: [],
      relations: [],
      traces: [],
      gaps: [...coverageGaps],
      summary: "核查正在执行，完成前请勿据此作出收案决定。",
    };
    this.store.save(run);
    const job = this.execute(run).finally(() => this.jobs.delete(job));
    this.jobs.add(job);
    return run;
  }
  private async execute(run: Run) {
    const persist = () => this.store.save(run);
    const call = async <T>(
      id: "gleif" | "ledger",
      tool: string,
      args: Record<string, unknown>,
      initiator: Trace["initiator"] = "rules",
    ) => {
      try {
        const r = await this.connectors.call<T>(id, tool, args, initiator);
        run.traces.push(r.trace);
        persist();
        return r;
      } catch (err) {
        if (err instanceof ToolError) run.traces.push(err.trace);
        persist();
        throw err;
      }
    };
    let partial = false;
    try {
      // Resolve again by LEI, so untrusted input cannot forge the authoritative entity name/source.
      const identity = await call<{ entity: Entity }>("gleif", "get_entity", {
        lei: run.entity.lei,
      });
      run.entity = identity.data.entity;
      persist();
      const direct = await call<{ matches: LedgerMatch[] }>(
        "ledger",
        "search_matters",
        { name: run.entity.name, lei: run.entity.lei },
      );
      run.findings.push(
        ...buildFindings(run.entity, direct.data.matches, [
          identity.trace.id,
          direct.trace.id,
        ]),
      );
      persist();
      let relationships:
        | { data: { relations: Relation[]; gaps: string[] }; trace: Trace }
        | undefined;
      try {
        relationships = await call<{ relations: Relation[]; gaps: string[] }>(
          "gleif",
          "get_relationships",
          { lei: run.entity.lei },
        );
        run.relations = relationships.data.relations;
        run.gaps.push(...relationships.data.gaps);
        if (relationships.data.gaps.length) partial = true;
      } catch (err) {
        partial = true;
        run.gaps.push(`公开关系查询失败：${(err as Error).message}`);
      }
      const seen = new Set([run.entity.lei]);
      for (const relation of run.relations) {
        if (seen.has(relation.entity.lei)) continue;
        seen.add(relation.entity.lei);
        try {
          const related = await call<{ matches: LedgerMatch[] }>(
            "ledger",
            "search_matters",
            { name: relation.entity.name, lei: relation.entity.lei },
          );
          // One ledger record may be a fuzzy hit for both nodes; prefer the strongest identity evidence.
          const newFindings = buildFindings(
            relation.entity,
            related.data.matches,
            [identity.trace.id, relationships!.trace.id, related.trace.id],
            relation,
          );
          for (const finding of newFindings) {
            const prev = run.findings.find(
              (f) => f.match.id === finding.match.id,
            );
            if (!prev) run.findings.push(finding);
            else if (prev.type === "similar" && finding.type !== "similar")
              run.findings.splice(run.findings.indexOf(prev), 1, finding);
          }
          persist();
        } catch (err) {
          partial = true;
          run.gaps.push(
            `${relation.entity.name} 内部比对失败：${(err as Error).message}`,
          );
        }
      }
      if (run.mode === "ai") {
        try {
          run.modelSummary = await modelReview(run, (id, tool, args) =>
            call(id, tool, args, "model"),
          );
        } catch (err) {
          partial = true;
          run.gaps.push(`模型工具核查未完成：${(err as Error).message}`);
        }
      }
      run.status = partial ? "partial" : "completed";
      run.summary = run.findings.length
        ? `发现 ${run.findings.length} 条核查线索。${partial ? "部分数据未能取得；" : ""}结论仅限已列明的来源与核查范围。`
        : `在已取得的数据中未发现匹配记录。${partial ? "部分数据未能取得；" : ""}这不等于无利益冲突或可以收案。`;
    } catch (err) {
      run.status = "failed";
      run.error = (err as Error).message;
      run.summary = "核查未完成，请检查连接和调用记录后重试。";
      run.gaps.push(`核心核查失败：${run.error}`);
    } finally {
      run.completedAt = new Date().toISOString();
      persist();
    }
  }
  review(
    id: string,
    findingId: string,
    review: Finding["review"],
    note: string,
  ) {
    const run = this.store.get(id);
    if (!run) throw new HttpError(404, "核查不存在");
    if (run.status === "running")
      throw new HttpError(409, "核查尚未完成，请稍后复核");
    const finding = run.findings.find((f) => f.id === findingId);
    if (!finding) throw new HttpError(404, "线索不存在");
    finding.review = review;
    finding.reviewNote = note;
    finding.reviewedAt = new Date().toISOString();
    this.store.save(run);
    this.store.audit("lawyer-review", {
      runId: id,
      findingId,
      review,
      note,
      at: finding.reviewedAt,
    });
    return run;
  }
  async close() {
    await Promise.allSettled(this.jobs);
  }
}
