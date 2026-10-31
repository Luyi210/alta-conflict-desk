import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Footer,
  PageNumber,
} from "docx";
import type { CaseView } from "../shared/types.ts";
import type { IssueSnapshot } from "../shared/issues.ts";
import {
  issueCategories,
  issueStates,
  citationRelations,
} from "../shared/issues.ts";
const p = (text: string, bold = false, keepNext = bold) =>
  new Paragraph({
    children: [new TextRun({ text, bold })],
    keepNext,
    spacing: { after: 80, line: 280 },
  });
const heading = (
  text: string,
  level:
    | typeof HeadingLevel.HEADING_1
    | typeof HeadingLevel.HEADING_2 = HeadingLevel.HEADING_1,
) =>
  new Paragraph({
    text,
    heading: level,
    keepNext: true,
    spacing: { before: 220, after: 120 },
  });
export async function buildMemo(matter: CaseView, snapshot: IssueSnapshot) {
  const decisionLabels = {
    draft: "草稿 未形成有效总意见",
    declined: "已记录不承接意见",
    "needs-information": "待补充材料",
    "needs-partner-review": "待合伙人进一步复核",
    "review-recorded": "系统范围内审查记录完备",
  };
  const body: (Paragraph | Table)[] = [
    new Paragraph({
      text: "收案审查备忘录",
      heading: HeadingLevel.TITLE,
      spacing: { after: 160 },
    }),
    p(matter.name, true),
    p(
      `本备忘录记录本事项的主体核查范围、原文依据、审查问题与人工处理意见，供经办律师与复核人员核对。当前状态：${decisionLabels[matter.decision.status]}。尚有 ${snapshot.issues.filter((i) => i.effectiveStatus !== "resolved").length} 个审查问题未完成处理，${matter.progress.openTasks} 项补证及 ${matter.progress.pendingFindings} 条线索待处理。`,
    ),
    p(
      `导出时间：${new Date().toLocaleString("zh-CN", { hour12: false })}　案件修订：${matter.revision}`,
    ),
    p(`案件编号：${matter.id}`),
    heading("一 审查范围与总意见"),
    p(`事项辖区：${matter.jurisdiction || "未填写"}`),
    p(matter.context || "事项背景未填写"),
    p(
      `总意见填写人：${matter.decision.reviewer || "未填写"}。姓名为人工记录，身份未经系统认证。`,
    ),
    p(
      matter.decision.status === "draft"
        ? `保留的意见草稿：${matter.decision.note || "尚未填写"}`
        : `已记录总意见：${matter.decision.note || "尚未填写"}`,
    ),
    p("材料版本变更后的历史意见只供追溯；本备忘录不代替律师的收案判断。"),
    heading("二 涉及主体"),
  ];
  const border = { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" };
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [1300, 4200, 3500],
      borders: {
        top: border,
        bottom: border,
        left: border,
        right: border,
        insideHorizontal: border,
        insideVertical: border,
      },
      rows: [
        ["角色", "主体名称", "身份核查"],
        ...matter.parties.map((v) => [
          v.role,
          v.entity?.name || v.name,
          v.confirmed ? `已确认 LEI\n${v.entity?.lei}` : "身份尚未确认",
        ]),
      ].map(
        (row, index) =>
          new TableRow({
            tableHeader: index === 0,
            cantSplit: true,
            children: row.map(
              (text, c) =>
                new TableCell({
                  width: { size: [1300, 4200, 3500][c], type: WidthType.DXA },
                  margins: { top: 110, bottom: 110, left: 120, right: 120 },
                  shading: { fill: index === 0 ? "E8EDF2" : "FFFFFF" },
                  children: [p(text, index === 0)],
                }),
            ),
          }),
      ),
    }),
  );
  body.push(heading("三 审查问题与处理记录"));
  if (!snapshot.issues.length)
    body.push(p("尚未建立审查问题；不能据此推定不存在问题。"));
  for (const [index, i] of snapshot.issues.entries()) {
    body.push(
      heading(`${index + 1} ${i.title}`, HeadingLevel.HEADING_2),
      p(
        `${issueCategories[i.category]}　${issueStates[i.effectiveStatus]}　责任人：${i.owner || "未指定"}`,
      ),
      p(
        `相关主体：${i.partyIds.map((id) => matter.parties.find((v) => v.id === id)?.name || id).join("、") || "未指定"}`,
      ),
      p(`待补信息：${i.missing || "未记录待补信息"}`),
      p(
        `${i.effectiveStatus === "resolved" ? "本轮已记录意见" : "工作说明 尚未形成当前有效处理意见"}：${i.note || "未填写"}`,
      ),
    );
    for (const impact of i.impacts)
      body.push(
        p(
          `待重新核实：${impact.from.title} 从 v${impact.from.version} 更新至 v${impact.to.version}。相关旧意见与引用保留，变更的业务影响尚待人工确认。`,
          true,
        ),
      );
    for (const c of i.citations) {
      const m = snapshot.materials.find((m) => m.id === c.versionId)!;
      body.push(
        p(
          `${citationRelations[c.relation]}　${m.title} v${m.version} 第 ${c.page} 页${m.latest ? "" : " 旧版依据"}`,
          true,
        ),
        p(`原文：${c.quote}`),
      );
    }
    if (!i.citations.length) body.push(p("尚无已关联的原文依据。"));
    if (i.reviews.length) {
      body.push(p("人工意见历史", true));
      for (const r of i.reviews)
        body.push(
          p(`${r.at}　填写人：${r.reviewer}　${r.note}`),
          p(
            `当时核对的材料版本：${r.versions.map((v) => v.versionId).join("；")}`,
          ),
        );
    }
  }
  body.push(heading("四 未完成事项"));
  for (const b of matter.blockers) body.push(p(b));
  if (!matter.blockers.length)
    body.push(p("当前系统范围内没有未完成阻塞项；这不表示已经批准收案。"));
  for (const t of matter.tasks.filter((t) => t.status === "open"))
    body.push(p(t.title, true), p(t.description));
  body.push(heading("五 材料与原文索引"));
  if (!snapshot.materials.length) body.push(p("尚未导入材料。"));
  for (const m of snapshot.materials)
    body.push(
      p(
        `${m.title}　v${m.version}　${m.pageCount} 页　${m.latest ? "当前版本" : "旧版保留"}`,
        true,
      ),
      p(`版本编号：${m.id}`),
      p(`SHA 256：${m.sha256}`),
    );
  for (const e of snapshot.evidence) {
    const m = snapshot.materials.find((m) => m.id === e.versionId)!;
    body.push(
      p(`已留存摘录　${m.title} v${m.version} 第 ${e.page} 页`, true),
      p(e.quote),
      p(`核实说明：${e.note}`),
    );
  }
  body.push(
    heading("六 复核留存"),
    p("经办人：________________　复核人：________________", false, true),
    p("复核日期：________________", false, true),
    p("以上栏位供后续人工填写，不构成系统认证或电子签署。"),
  );
  return Packer.toBuffer(
    new Document({
      creator: "Alta Conflict Desk",
      title: "收案审查备忘录",
      description: matter.name,
      styles: {
        default: {
          document: {
            run: {
              font: { ascii: "Calibri", eastAsia: "宋体", hAnsi: "Calibri" },
              size: 22,
              color: "000000",
            },
            paragraph: { spacing: { line: 280, after: 80 } },
          },
          title: {
            run: { size: 36, bold: true, color: "000000" },
            paragraph: { spacing: { after: 160 } },
          },
          heading1: { run: { size: 28, bold: true, color: "000000" } },
          heading2: { run: { size: 24, bold: true, color: "000000" } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1134, bottom: 1134, left: 1276, right: 1276 },
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: "right",
                  children: [
                    new TextRun({
                      children: ["第 ", PageNumber.CURRENT, " 页"],
                      size: 18,
                    }),
                  ],
                }),
              ],
            }),
          },
          children: body,
        },
      ],
    }),
  );
}
