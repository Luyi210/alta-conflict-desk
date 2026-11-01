# 交付资料索引

## 评审先看

| 顺序 | 资料 | 用途 |
| --- | --- | --- |
| 1 | [图文使用说明（PDF）](../output/pdf/Alta-Conflict-Desk-使用说明.pdf) · [文字版](USER-GUIDE.md) | 10 页、8 张配图，按 7 步完成一宗演示案件 |
| 2 | [项目首页](../README.md) | 场景、核心能力和本机启动 |
| 3 | [简要方案](PROPOSAL.md) | 目标用户、场景取舍及未来接入 Alta Lex 的方式 |
| 4 | [运行指南](OPERATIONS.md) · [工具台说明](TOOLS.md) | 安装、模型配置、MCP 接入和手动调用 |
| 5 | [交付清单](DELIVERY-CHECKLIST.md) · [最终验收](evidence/2026-11-01/FINAL-ACCEPTANCE-20261101.md) | 对照题目查看完成项、真实调用与剩余事项 |
| 6 | [AI 协作摘要](AI-COLLABORATION.md) · [脱敏对话](AI-CONVERSATION-REDACTED.md) | 开发过程与相关 AI 沟通记录 |
| 7 | [参考研究](RESEARCH.md) · [第三方说明](THIRD-PARTY-NOTICES.md) | GitHub 参考项目、复用范围与依赖许可 |

新克隆没有开发机的 `.env`、模型密钥和案件数据库。无密钥可运行规则核查；要复现模型发起的 MCP 调用，需按[运行指南](OPERATIONS.md#可选模型配置)配置自己的工具调用模型，再建立演示案件。请勿把真实客户材料或密钥提交到仓库。

## 当前验收凭证

[2026-11-01 验收记录](evidence/2026-11-01/FINAL-ACCEPTANCE-20261101.md)说明干净安装、模型发起的 MCP 调用、材料变更及实际导出范围。原始凭证：[主体核查](evidence/2026-11-01/FINAL-AI-VERIFICATION-20261101.json)、[材料审查](evidence/2026-11-01/FINAL-ASSISTANT-VERIFICATION-20261101.json)、[流程汇总](evidence/2026-11-01/FINAL-FLOW-VERIFICATION-20261101.json)；浏览器导出：[案件报告](evidence/2026-11-01/FINAL-CASE-REPORT-20261101.md)、[Word 备忘录](evidence/2026-11-01/FINAL-REVIEW-MEMO-20261101.docx)。

完整文件列表见 [当前验收目录](evidence/2026-11-01/README.md)。

## 实现与问题记录

- [API 约定](API-CONTRACT.md)与[代码检查](notes/CODE-REVIEW-2026-11-01.md)：接口、修复及验证范围。
- [GLEIF 超时处理](notes/GLEIF-RECOVERY.md)与[浏览器记录](notes/BROWSER-VERIFICATION.md)：实际问题和处理过程。
- [演示顺序](DEMO.md)：当前版本现场讲解提纲；新版连续视频尚未录制。
- [技术记录索引](notes/README.md)：代码检查、GLEIF 超时处理和浏览器验证。

## 历史材料

旧版说明、验证 JSON、示例报告和视频保留原日期及当时的功能范围，供追溯，不代表当前版本的连续演示。见[历史索引](history/README.md)、[旧验收凭证](history/evidence/README.md)及[旧视频索引](history/media/README.md)。截图见[图片索引](screenshots/README.md)：除审查总览外，多数为换色前截图，图文说明已逐张标注。脱敏对话中的旧本机路径保留当时写法，现有路径以本索引为准。
