# 实现边界与 API 合约

所有日期 ISO8601；类型以 shared/types.ts 为准。API 响应为 JSON。错误为 `{error: string}` 并返回正确的 4xx/5xx。只绑定 127.0.0.1。所有核查、复核和调用记录持久化 SQLite，模拟台账单独文件。项目是单用户本地原型，不用真实客户数据。

## API
- GET /api/status → AppStatus
- POST /api/connectors/:id/connect → Connector；真实 MCP initialize + tools/list
- POST /api/connectors/:id/test → Connector；连接后实际读工具测试；失败响应有错误
- POST /api/connectors/:id/disconnect → Connector；关闭 stdio 进程且禁止调用
- GET /api/entities?q=... → {entities: Entity[], trace: Trace}；必须已连接 GLEIF，真实 MCP search_entities
- POST /api/runs body RunInput → Run（创建后后台执行，立即返回 running）；模型未配置选择 ai 应 409
- GET /api/runs → {runs: Run[]} 最新在前
- GET /api/runs/:id → Run；前端每 800ms 轮询直至非 running
- POST /api/runs/:runId/findings/:findingId/review body {review:'escalated'|'dismissed'|'pending',note:string} → Run；撤回 pending 允许，其他需说明
- GET /api/runs/:id/report → Markdown attachment，含真实来源、运行模式、范围缺口、人工复核、调用日志，不泄露环境变量

## MCP 真实工具（两组独立 stdio server）
- GLEIF：search_entities({query})、get_entity({lei})、get_relationships({lei})
- 本地 SQLite 台账：search_matters({name,lei?})、ledger_info({})

MCP 工具返回 JSON 文本，由客户端解析。GLEIF 无认证，外网失败明确报错，不能用缓存演示结果冒充。关系读取不到/覆盖不全须成为 gaps。台账必须在服务内只读查询（数据库初始化由宿主准备）。仅已确认对方主体和其公开关系用于匹配，prospectiveClient 是本次事项背景文字，当前不提供其核查。页面和报告明确范围。

## 规则与模型
按 LEI 精确匹配优先，exact-name/similar-name 作为身份待确认线索，不能仅凭名称自动认定直接冲突。关联企业命中也是线索，不自动判法律冲突。限定 direct-parent 和 ultimate-parent，不把无关系当成全面清白。所有记录为虚构律所委托；公众公司名称/LEI 可是真实。模型可选 OpenAI-compatible API 环境变量；未配置 rules 可完整调用 MCP 但不称为 AI 验收通过。模型配置后通过 tools/function calling 转发到相同 MCP 服务，最终结果须引用已有证据且不能替代规则事实/律师结论。支持只运行规则，无额外服务依赖。
