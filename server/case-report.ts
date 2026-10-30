import type { CaseView } from "../shared/types.ts";
import { briefReport } from "./report.ts";

const text = (value: string) =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>]/g, "")
    .replace(/([\\`*_{}\[\]|])/g, "\\$1");
const source = (label: string, url: string) =>
  /^https?:\/\//i.test(url)
    ? `[${text(label)}](${url.replace(/[\s()<>]/g, (c) => encodeURIComponent(c))})`
    : `${text(label)}：${text(url)}`;
const reviewLabels = {
  pending: "待复核",
  escalated: "待进一步复核",
  retained: "已复核，保留问题（不等于批准收案）",
  dismissed: "已排除此线索",
};
const decisionLabels = {
  declined: "不承接，结束审查（未核实事项仍保留）",
  draft: "草稿",
  "needs-information": "待补充资料",
  "needs-partner-review": "待合伙人复核（本地标记）",
  "review-recorded": "审查记录完备（不等于批准收案）",
};

export function caseReport(file: CaseView) {
  return [
    "# 案件级收案审查记录",
    "",
    `- 案件：${text(file.name)}`,
    `- 案件编号：${file.id}`,
    `- 修订：${file.revision}`,
    `- 创建：${file.createdAt}；更新：${file.updatedAt}`,
    `- 事项背景：${text(file.context || "未填写")}`,
    `- 司法辖区（仅作背景）：${text(file.jurisdiction)}`,
    `- 执行模式：${file.mode === "rules" ? "规则预览，真实 MCP 调用；不代表 AI 模型实跑" : "AI 辅助核查，实际完成情况见每个主体的模型状态及调用轨迹"}`,
    `- 覆盖进度：${file.progress.completed}/${file.progress.total} 个主体来源核查完整，${file.progress.confirmed} 个身份已确认。`,
    "",
    "> 本原型的内部事项及律师姓名全部为虚构数据；公开企业名称与 LEI 不代表真实委托关系。系统生成核查线索和补证清单，不自动判断法律利益冲突，也不批准收案。GLEIF 母公司关系采用会计合并口径，不是完整股权、控制或法律关联图谱。未命中不等于不存在利益冲突。",
    "",
    "## 主体清单与覆盖",
    "",
    ...file.parties.flatMap((p) => {
      const run = file.runs.find((r) => r.id === p.runId);
      return [
        `### ${text(p.role)} · ${text(p.name)}`,
        "",
        `- 主体编号：${p.id}`,
        `- 身份：${p.confirmed && p.entity ? `已选择确认；LEI ${p.entity.lei}` : "未确认，尚未核查"}`,
        `- 当前核查：${run ? `${run.id} / ${run.status}` : "无"}`,
        ...(run
          ? [
              `- 实际取得主体：${text(run.entity.name)}`,
              `- ${text(run.summary)}`,
              ...(run.error ? [`- 错误：${text(run.error)}`] : []),
            ]
          : []),
        ...(run?.modelExecution
          ? [
              `- 模型执行：${run.modelExecution.status}；模型 ${text(run.modelExecution.model)}；工具调用 ${run.modelExecution.toolCallCount} 次；${run.modelExecution.rounds} 轮。${run.modelExecution.error ? text(run.modelExecution.error) : ""}`,
            ]
          : []),
        "",
        ...(run
          ? [
              "**范围与缺口**",
              "",
              ...run.gaps.map((g) => `- ${text(g)}`),
              "",
              "**来源**",
              "",
              `- ${source("所选主体登记记录", run.entity.sourceUrl)}；获取时间 ${run.entity.fetchedAt}。来源是否成功返回以调用轨迹为准。`,
              ...run.relations.map(
                (r) =>
                  `- ${r.type === "direct-parent" ? "直接" : "最终"}母公司：${text(r.entity.name)} / ${r.entity.lei}；${source("公开关系", r.sourceUrl)}；获取时间 ${r.fetchedAt}。`,
              ),
              "",
            ]
          : []),
      ];
    }),
    "## 当前阻塞项",
    "",
    ...(file.blockers.length
      ? file.blockers.map((b) => `- ${text(b)}`)
      : [
          "系统范围内的必填核查、补证与线索复核已完成；仍须由有权律师判断是否接受委托。",
        ]),
    "",
    "## 补证清单（跨主体合并）",
    "",
    ...(file.tasks.length
      ? file.tasks.flatMap((t) => [
          `### ${text(t.title)}`,
          "",
          `- 编号：${t.id}；种类：${t.kind}；状态：${t.status === "resolved" ? "已补齐" : "待补充"}${t.systemManaged ? "（系统根据身份/来源状态管理）" : ""}`,
          `- 涉及主体：${t.partyIds.map((id) => text(file.parties.find((p) => p.id === id)?.name || id)).join("、")}`,
          `- 要求：${text(t.description)}`,
          `- 核实说明：${text(t.note || "未填写")}`,
          `- 材料引用（文本记录，不表示文件上传或真实性验证）：${text(t.reference || "未填写")}`,
          `- 更新：${t.updatedAt || "尚未补录"}`,
          "",
        ])
      : ["暂无由当前结果生成的补证项。", ""]),
    "## 核查线索与人工复核",
    "",
    ...file.runs.flatMap((run) =>
      run.findings.flatMap((f) => [
        `### ${text(run.entity.name)} · ${text(f.title)}`,
        "",
        `- 核查 / 线索编号：${run.id} / ${f.id}`,
        `- 涉及实体：${text(f.entity.name)} / ${f.entity.lei}`,
        `- 虚构事项：${text(f.match.matterName)} / ${text(f.match.matterRef)}`,
        `- 匹配依据：${f.match.matchType}；线索类型：${f.type}`,
        `- 说明：${text(f.summary)}`,
        `- 人工复核：${reviewLabels[f.review]}；${text(f.reviewNote || "尚未填写理由")}`,
        `- 复核时间：${f.reviewedAt || "尚未复核"}`,
        `- 证据调用编号：${f.evidenceTraceIds.join("、") || "未提供"}`,
        "",
      ]),
    ),
    "## 案件级人工意见",
    "",
    `- 状态：${decisionLabels[file.decision.status]}`,
    `- 对应修订：${file.decision.revision}`,
    `- 填写人（手工输入，身份未验证）：${text(file.decision.reviewer || "未填写")}`,
    `- 说明：${text(file.decision.note || "未填写")}`,
    `- 记录时间：${file.decision.recordedAt || "未记录"}`,
    ...(file.decision.invalidatedAt
      ? [
          `- 原意见失效时间：${file.decision.invalidatedAt}；文字保留为草稿，须按当前资料重新审查。`,
        ]
      : []),
    ...(file.decision.status === "declined"
      ? [
          "- 本轮审查已按人工不承接意见结束；前述未核实事项、线索与材料缺口仍保留，不视为核查通过。",
        ]
      : []),
    "",
    ...file.runs.flatMap((run) =>
      run.modelSummary
        ? [`### 主体：${text(run.entity.name)}`, "", ...briefReport(run)]
        : [],
    ),
    "",
    "## 活动与旧意见失效记录",
    "",
    ...file.activity.map((a) => `- ${a.at} · ${a.type} · ${text(a.message)}`),
    "",
    "## 实际 MCP 调用轨迹",
    "",
    ...file.runs.flatMap((run) =>
      run.traces.flatMap((t) => [
        `### ${text(run.entity.name)} · ${t.connector} / ${t.tool}`,
        "",
        `- 核查编号：${run.id}；调用编号：${t.id}`,
        `- 发起方：${t.initiator === "model" ? "模型工具调用" : t.initiator === "rules" ? "规则编排" : "用户操作"}`,
        `- 时间：${t.startedAt}；耗时：${t.durationMs} ms；状态：${t.status}`,
        "",
        "```json",
        JSON.stringify(
          { arguments: t.args, result: t.result, error: t.error },
          null,
          2,
        ).replace(/```/g, "\\`\\`\\`"),
        "```",
        "",
      ]),
    ),
    "---",
    "Alta Conflict Desk · 独立本地原型。适用职业规范、实际委托范围、完整主体名单、保密义务及最终是否收案均由有权律师核实和判断。",
    "",
  ].join("\n");
}
