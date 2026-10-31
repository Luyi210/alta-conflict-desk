import type { Finding } from "./types.ts";

export const normalizedEntityName = (name: string) =>
  name
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export function explainMatch(finding: Finding) {
  const subject = finding.relation?.entity || finding.entity;
  const match = finding.match;
  const sameLei = Boolean(match.lei && match.lei === subject.lei);
  const differentLei = Boolean(match.lei && match.lei !== subject.lei);
  const sameName =
    normalizedEntityName(subject.name) ===
    normalizedEntityName(match.clientName);
  return {
    subject: subject.name,
    summary: sameLei
      ? "LEI 一致，仍需核实事项范围与义务"
      : differentLei
        ? "LEI 不一致，不能按同一主体处理"
        : "台账缺少 LEI，名称线索不足以确认身份",
    rows: [
      {
        field: "法人标识 LEI",
        source: subject.lei,
        ledger: match.lei || "未记录",
        state: sameLei ? "same" : differentLei ? "different" : "missing",
        detail: sameLei
          ? "公开登记与台账标识一致。"
          : differentLei
            ? "两个不同的 LEI；名称相似不能消除标识矛盾。"
            : "需补充台账主体的可靠登记标识。",
      },
      {
        field: "企业名称",
        source: subject.name,
        ledger: match.clientName,
        state: sameName ? "same" : "different",
        detail: sameName
          ? "忽略大小写、全半角和标点后相同；名称本身不是唯一标识。"
          : "名称存在差异；别名或更名情况尚未核实。",
      },
      {
        field: "登记辖区",
        source: subject.jurisdiction || "未取得",
        ledger: "未记录",
        state: "missing",
        detail: "本地台账未提供辖区，不能推定一致。",
      },
    ],
    relation: finding.relation
      ? "本表比对的是已披露母公司与台账。母公司身份匹配不等于当前主体就是该客户，也不直接认定利益冲突。"
      : "身份匹配与法律利益冲突判断分开处理；最终由律师复核。",
  };
}
