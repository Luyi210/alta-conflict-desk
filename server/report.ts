import type { Finding, Run, Trace } from "../shared/types.ts";
import { evidenceFacts } from "../shared/evidence-facts.ts";
export function briefReport(run: Run): string[] {
  if (!run.modelSummary) return [];
  return [
    "## 核查简报（模型辅助）",
    "",
    "模型整理的摘要（待律师核对）：",
    text(run.modelSummary),
    "",
    ...(
      [
        ["来源记录（直接由实际工具字段整理）", evidenceFacts(run.traces)],
        ["律师待核实", run.modelBrief?.questions],
        ["建议下一步", run.modelBrief?.nextSteps],
      ] as const
    ).flatMap(([label, items]) =>
      items?.length
        ? [
            `### ${label}`,
            "",
            ...items.map(
              (item) =>
                `- ${text(item.text)}${item.traceIds.length ? `（来源调用：${item.traceIds.join("、")}）` : "（复核建议，尚未核实）"}`,
            ),
            "",
          ]
        : [],
    ),
  ];
}
const text = (value: string) =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>]/g, "")
    .replace(/([\\`*_{}\[\]|#])/g, "\\$1");
export function report(run: Run) {
  const runStatus: Record<Run["status"], string> = {
    running: "核查中",
    completed: "已完成",
    partial: "来源不完整",
    failed: "失败",
  };
  const matchType: Record<Finding["match"]["matchType"], string> = {
    "exact-lei": "LEI 一致",
    "exact-name": "名称一致，身份待核实",
    "similar-name": "名称近似，身份待核实",
  };
  const traceStatus: Record<Trace["status"], string> = {
    success: "成功",
    error: "失败",
  };
  const review = {
    pending: "待复核",
    escalated: "已标记进一步复核",
    retained: "已复核，保留问题（不等于批准收案）",
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
    `- 委托背景：${text(run.context || "未提供")}`,
    `- 事项辖区（背景信息，不是法律适用结论）：${text(run.jurisdiction || "未提供")}`,
    `- 模式：${run.mode === "rules" ? "规则核查（不含模型分析）" : "模型辅助核查（见调用记录与缺口）"}`,
    `- 状态：${runStatus[run.status]}`,
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
      `- 匹配依据：${matchType[finding.match.matchType]}`,
      `- 复核状态：${review[finding.review]}`,
      `- 复核理由：${text(finding.reviewNote || "尚未填写")}`,
      `- 最近复核时间：${finding.reviewedAt || "尚未复核"}`,
      `- 证据调用编号：${finding.evidenceTraceIds.join("、")}`,
      "",
    ]),
    ...briefReport(run),
    "## 实际 MCP 调用轨迹",
    "",
    ...run.traces.flatMap((trace) => [
      `### ${trace.connector} / ${trace.tool}`,
      "",
      `- 调用编号：${trace.id}`,
      `- 发起方：${trace.initiator === "model" ? "模型工具调用" : trace.initiator === "rules" ? "规则编排" : "用户操作"}`,
      `- 开始：${trace.startedAt}`,
      `- 耗时：${trace.durationMs} ms`,
      `- 状态：${traceStatus[trace.status]}`,
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
