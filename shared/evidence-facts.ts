import type { ModelBrief, Trace } from "./types";

type Item = NonNullable<ModelBrief["facts"]>[number];
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const str = (value: unknown) => (typeof value === "string" ? value : "未提供");

// These cards quote structured tool fields. They are never generated from model prose.
export function evidenceFacts(traces: Trace[]): Item[] {
  const facts = new Map<string, Item>();
  const matches = new Map<string, { rank: number; item: Item }>();
  for (const trace of traces) {
    if (trace.status !== "success" || trace.initiator !== "model") continue;
    const result = record(trace.result);
    if (trace.connector === "gleif" && trace.tool === "get_entity") {
      const entity = record(result.entity);
      if (typeof entity.lei !== "string" || typeof entity.name !== "string")
        continue;
      facts.set(`entity:${entity.lei}`, {
        text: `登记主体：${entity.name}；LEI ${entity.lei}；辖区 ${str(entity.jurisdiction)}；状态 ${str(entity.status)}。`,
        traceIds: [trace.id],
      });
    }
    if (
      trace.connector === "gleif" &&
      trace.tool === "get_relationships" &&
      Array.isArray(result.relations)
    ) {
      for (const raw of result.relations) {
        const relation = record(raw),
          entity = record(relation.entity);
        if (
          typeof entity.name !== "string" ||
          !["direct-parent", "ultimate-parent"].includes(String(relation.type))
        )
          continue;
        facts.set(`relation:${trace.args.lei}:${relation.type}:${entity.lei}`, {
          text: `${relation.type === "direct-parent" ? "直接" : "最终"}会计合并母公司：${entity.name}；LEI ${str(entity.lei)}。关系口径不等于全部法律关联。`,
          traceIds: [trace.id],
        });
      }
    }
    if (
      trace.connector === "ledger" &&
      trace.tool === "search_matters" &&
      Array.isArray(result.matches)
    ) {
      if (!result.matches.length)
        facts.set(`empty:${trace.args.lei}`, {
          text: `本次台账查询未返回「${str(trace.args.name)}」的匹配记录；未命中不等于无冲突。`,
          traceIds: [trace.id],
        });
      for (const raw of result.matches) {
        const match = record(raw);
        if (
          typeof match.id !== "string" ||
          typeof match.clientName !== "string"
        )
          continue;
        const exact = match.matchType === "exact-lei";
        const rank = exact ? 2 : 1;
        const item = {
          text: `${str(match.matterRef)} · ${match.clientName}：${exact ? "LEI 一致" : "仅名称匹配，身份未确认"}；事项「${str(match.matterName)}」；${str(match.relationship)}，${str(match.status)}。`,
          traceIds: [trace.id],
        };
        if ((matches.get(match.id)?.rank || 0) < rank)
          matches.set(match.id, { rank, item });
      }
    }
  }
  return [...facts.values(), ...[...matches.values()].map((m) => m.item)];
}
