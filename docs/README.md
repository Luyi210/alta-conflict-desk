# 资料索引

## 从哪里开始

| 文档 | 看什么 |
| --- | --- |
| [使用说明书](USER-GUIDE.md) | 按页面顺序完成一宗演示案件 |
| [项目首页](../README.md) | 场景、操作路径与启动方式 |
| [方案](PROPOSAL.md) | 用户、实现范围、取舍和未来集成 |
| [工具台说明](TOOLS.md) | 连接、权限、手动调用和失败重试 |
| [交付清单](DELIVERY-CHECKLIST.md) | 对照题目查看完成项与剩余事项 |
| [演示大纲](DEMO.md) | 当前版本的现场讲解顺序；连续视频暂缓 |

## 当前验收材料

[2026-11-01 验收记录](FINAL-ACCEPTANCE-20261101.md)说明干净安装、模型发起的 MCP 调用、律师处理材料变更及实际导出范围。原始凭证分别见 [主体核查](FINAL-AI-VERIFICATION-20261101.json)、[材料审查](FINAL-ASSISTANT-VERIFICATION-20261101.json)和[流程汇总](FINAL-FLOW-VERIFICATION-20261101.json)；浏览器导出的文件见 [案件报告](FINAL-CASE-REPORT-20261101.md)与[Word 备忘录](FINAL-REVIEW-MEMO-20261101.docx)。

## 实现与过程

- [运行指南](OPERATIONS.md)与[API 约定](API-CONTRACT.md)：环境配置、数据存储、接口和复验命令。
- [参考研究](RESEARCH.md)与[第三方说明](THIRD-PARTY-NOTICES.md)：参考项目、直接使用的依赖及许可。
- [协作摘要](AI-COLLABORATION.md)与[脱敏对话](AI-CONVERSATION-REDACTED.md)：开发过程和可见沟通记录。
- [GLEIF 超时处理](GLEIF-RECOVERY.md)、[浏览器记录](BROWSER-VERIFICATION.md)与[目录整理](CLEANUP-2026-11-01.md)：问题处理和验证范围。
- [代码与产品表达检查](CODE-REVIEW-2026-11-01.md)：本轮修复、回归测试与界面核对。

早期核验 JSON、报告、截图和旧版演示均保留原日期与当时的功能范围。版本说明见 [历史索引](history/README.md)，旧视频见[媒体索引](history/media/README.md)，截图位于 `screenshots/`。脱敏对话中的旧文件路径保留当时写法，现有路径以本索引为准。新克隆不包含开发机数据库，需创建自己的演示案件。
