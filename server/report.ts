import type { Run } from "../shared/types.ts";
const text = (value: string) =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>]/g, "")
    .replace(/([\[\]`])/g, "\\$1");
export function report(run: Run) {
  const review = {
    pending: "待复核",
    escalated: "已标记进一步复核",
    dismissed: "排除此线索",
  };
  return [
    "# 收案前主体与潜在利益冲突核查记录",
    "",
    `- 核查编号：${run.id}`,
    `- 事项：${text(run.matterName)}`,
    `- 拟委托人（背景字段，本次未核查）：${text(run.prospectiveClient)}`,
    `- 选定主体：${text(run.entity.name)} / ${run.entity.lei}`,
    `- 主体角色：${text(run.partyRole)}`,
    `- 模式：${run.mode === "rules" ? "规则预览（非 AI 推理验收）" : "AI 工具核查（见调用记录与缺口）"}`,
    `- 状态：${run.status}`,
    `- 开始：${run.createdAt}`,
    `- 完成：${run.completedAt || "尚未完成"}`,
    "",
    "> 内部委托台账全部为虚构演示数据；公众企业名称与 LEI 不表示真实委托关系。本报告记录筛查线索，不作是否收案的法律决定。",
    "",
    "## 结果",
    "",
    text(run.summary.replace(/条待律师复核的线索/g, "条核查线索")),
    ...(run.error ? ["", `错误：${text(run.error)}`] : []),
    "",
    "## 范围与未覆盖项",
    "",
    ...run.gaps.map((gap) => `- ${text(gap)}`),
    "",
    "## 主体与公开关系来源",
    "",
    `- [选定主体原始记录](${run.entity.sourceUrl})；获取于 ${run.entity.fetchedAt}`,
    ...run.relations.map(
      (r) =>
        `- ${r.type === "direct-parent" ? "直接母公司" : "最终母公司"}：${text(r.entity.name)} / ${r.entity.lei}；[公开关系](${r.sourceUrl})；获取于 ${r.fetchedAt}`,
    ),
    "",
    "## 核查线索与律师复核",
    "",
    ...run.findings.flatMap((finding, index) => [
      `### ${index + 1}. ${text(finding.title)}`,
      "",
      text(finding.summary),
      "",
      `- 对应主体：${text(finding.entity.name)}`,
      `- 虚构内部记录：${text(finding.match.clientName)} / ${text(finding.match.matterRef)}`,
      `- 虚构事项：${text(finding.match.matterName)}`,
      `- 匹配依据：${finding.match.matchType}`,
      `- 复核状态：${review[finding.review]}`,
      `- 复核理由：${text(finding.reviewNote || "尚未填写")}`,
      `- 最近复核时间：${finding.reviewedAt || "尚未复核"}`,
      `- 证据调用编号：${finding.evidenceTraceIds.join("、")}`,
      "",
    ]),
    ...(run.modelSummary ? ["## 模型辅助摘要", "", run.modelSummary, ""] : []),
    "## 实际 MCP 调用轨迹",
    "",
    ...run.traces.flatMap((trace) => [
      `### ${trace.connector} / ${trace.tool}`,
      "",
      `- 调用编号：${trace.id}`,
      `- 发起方：${trace.initiator === "model" ? "模型工具调用" : trace.initiator === "rules" ? "规则编排" : "用户操作"}`,
      `- 开始：${trace.startedAt}`,
      `- 耗时：${trace.durationMs} ms`,
      `- 状态：${trace.status}`,
      "",
      "```json",
      JSON.stringify(
        { arguments: trace.args, result: trace.result, error: trace.error },
        null,
        2,
      ).replace(/```/g, "\\`\\`\\`"),
      "```",
      "",
    ]),
    "---",
    "Alta Conflict Desk · 独立本地原型。请结合适用司法辖区的职业规范、完整委托关系和保密义务，由有权律师作最终判断。",
    "",
  ].join("\n");
}
