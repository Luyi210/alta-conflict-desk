# 实现边界与 API 合约（v0.2）

所有日期 ISO8601；类型以 `shared/types.ts` 为准。API 响应为 JSON，报告端点返回 Markdown 附件。错误为 `{error: string}` 并返回对应 4xx/5xx。只绑定 `127.0.0.1`。案件、核查、补证、复核、工具权限与调用记录持久化 SQLite，虚构台账单独文件。项目是单用户本地原型，不用真实客户数据。

## 连接器与身份

- GET /api/status → AppStatus
- POST /api/connectors/:id/connect → Connector；真实 MCP initialize + tools/list
- POST /api/connectors/:id/test → Connector；连接后实际读工具测试；失败响应有错误
- POST /api/connectors/:id/disconnect → Connector；关闭 stdio 进程且禁止调用
- GET /api/entities?q=... → {entities: Entity[], trace: Trace}；必须已连接 GLEIF，真实 MCP search_entities

连接器测试和身份检索也经过统一工具权限入口。已暂停其依赖工具时，不能绕过权限继续查询。

## 案件工作流（当前主入口）

- GET /api/cases → `{cases:CaseView[]}`；含各主体当前 runs、progress、tasks、blockers。
- POST /api/cases body `CaseInput` → `CaseView` 201；一至六个企业，至少一个已确认 LEI。角色可为拟委托人、交易对方、担保方或其他相关方。同一 LEI 和主体 id 不可重复。
- GET /api/cases/:id → `CaseView`；按当前子核查结果派生补证、覆盖状态及旧意见失效。
- POST /api/cases/:id/parties/:partyId/resolve body `{entity:Entity,confirmed:true}` → `CaseView`；补录身份后创建该主体的新核查，旧记录保留。
- POST /api/cases/:id/parties/:partyId/retry → `CaseView`；已确认主体且不在运行中才可重跑，保留旧 run。
- POST /api/cases/:id/tasks/:taskId body `{status:'open'|'resolved',note:string,reference:string}` → `CaseView`；身份/来源待办由系统管理，不能手动勾选消除；人工补证标为完成须有说明和材料引用。
- POST /api/cases/:id/decision body `{status,note,reviewer}` → `CaseView`；status 为 `draft`、`needs-information`、`needs-partner-review`、`review-recorded`。后者仅在无系统阻塞项时允许。
- GET /api/cases/:id/report → Markdown 附件；汇总各方覆盖、补证、线索、总意见、活动与实际工具轨迹。

每个已确认主体均调用单主体核查引擎，包含拟委托人；未确认主体仍列入案件范围，形成身份缺口。跨主体命中同一内部事项时合并委托范围/保密补证。补证引用只是文本记录，不是上传文件或真实性校验。

未确认身份、仍在运行、来源失败/不完整、待复核/待进一步复核线索、未补齐人工待办均阻塞 `review-recorded`。该状态仅指记录齐备，不批准收案。审查人姓名未验证，待合伙人复核不发送通知。身份补录、重跑、补证、子核查结果或复核变化后，旧意见恢复草稿，修订号递增，活动保存失效原因。

## 单主体核查（兼容 v0.1，并被案件复用）

- POST /api/runs body RunInput → Run（创建后后台执行，立即返回 running）；模型未配置选择 ai 应 409
- GET /api/runs → {runs: Run[]} 最新在前
- GET /api/runs/:id → Run；前端每 800ms 轮询直至非 running
- POST /api/runs/:runId/findings/:findingId/review body {review:'escalated'|'dismissed'|'pending',note:string} → Run；撤回 pending 允许，其他需说明
- GET /api/runs/:id/report → Markdown attachment，含真实来源、运行模式、范围缺口、人工复核、调用日志，不泄露环境变量

单次 `/runs` 只处理 `entity` 指定的一家企业及其公开关系；`prospectiveClient` 是该次记录的背景字段，不会自行产生另一家企业的查询。**案件 `/cases` 会为包括拟委托人在内的每个已确认主体分别创建 run**，因此不能把旧单主体接口限制写成新版产品只核查对方。旧历史和报告继续保留。

## 独立工具调用台

- GET /api/tool-desk → `{tools:CatalogTool[],calls:ToolExecution[]}`；schema 来自真实 MCP 发现。首次未连接没有工具，断开/重启可保留上次目录且 `available:false`。
- POST /api/tool-desk/permissions body `{connector,tool,enabled}` → `{tools:CatalogTool[]}`；持久化每项工具权限。
- POST /api/tool-desk/calls body `{connector,tool,args}` → `ToolExecution` 201；预检通过后异步运行。未知、禁用、未连接或 schema 不合法直接返回错误，不伪装成功调用。
- GET /api/tool-desk/calls/:id → `ToolExecution`；状态 `queued`、`running`、`success` 或 `error`，完成后附真实 trace 或错误。
- POST /api/tool-desk/calls/:id/retry → 新 `ToolExecution` 201；仅失败记录可重试，`retryOf` 指向原记录，原记录不覆盖。

参数在统一后端入口校验；权限约束后续手动、规则及模型调用。执行前再次检查权限和连接。已开始的只读调用不提供假取消；重启导致未完成调用中断时记录结果未知，可手动创建新的重试。手动调用历史与各核查自身 trace 分开保存，发起方使用 `user`、`rules` 或 `model` 标识。

## MCP 真实工具（两组独立 stdio server）

- GLEIF：search_entities({query})、get_entity({lei})、get_relationships({lei})
- 本地 SQLite 台账：search_matters({name,lei?})、ledger_info({})

MCP 工具返回 JSON 文本，由客户端解析。GLEIF 无认证，外网失败明确报错，不能用缓存演示结果冒充。会计合并母公司关系读取不到或覆盖不全须成为 gaps，不代表不存在任何关联。台账在服务内只读查询，数据库初始化由宿主准备。案件汇总各方实际覆盖，页面和报告不将未识别主体计为已核查。

## 规则与模型

按 LEI 精确匹配优先，exact-name/similar-name 作为身份待确认线索，不能仅凭名称认定法律冲突。关联企业命中也是线索。限定 direct-parent 和 ultimate-parent，不把无关系当成全面清白。所有内部记录为虚构律所委托；公开公司名称/LEI 可以真实。辖区字段只作背景，不执行当地法律判断。

模型可选 OpenAI-compatible API 环境变量。未配置时 `rules` 可实际调用 MCP，但不能称为 AI 验收通过。配置后通过 function calling 转发至同一权限和校验入口，检查允许工具、已确认主体边界、调用次数与真实引用。`Run.modelExecution` 记录状态、模型、轮次与工具调用数；配置存在不等于执行通过。

当前 DeepSeek `deepseek-flash` 已完成一次实际验收：一个已确认企业、2 轮、4 次 `initiator:model` 成功 MCP 调用，另有 4 次 `rules` 预核查。证据见 [AI-LIVE-VERIFICATION.json](AI-LIVE-VERIFICATION.json)；案件仍存在未确认主体和补证缺口。`npm run verify:ai -- --case <id>` 只读检查已有记录，不新建任务、不请求模型、不读取 `.env`；mock 测试仅验证协议边界，原规则验收不因此改变模式。

## v0.5 案件材料

前缀 `/api/cases/:id/materials`：

| 方法 / 路径 | 用途 |
| --- | --- |
| GET `/` | 本案版本、AI 轮次、人工摘录及材料工具状态 |
| POST `/upload?title=...&previous=...` | `application/pdf` 原始字节，8 MB；previous 可选，生成同材料新版本 |
| POST `/sample` | `{variant:"original"或"updated", previous?}`，导入内置虚构 PDF，真实解析 |
| POST `/:versionId/permission` | `{allowed:boolean}`，按版本授权模型 |
| GET `/:versionId/pdf` | 本案该版本原始 PDF |
| GET `/:versionId/pages/:page` | 通过 MCP 读取原文及 trace |
| POST `/reviews` | `{versionIds:string[],question:string}`，异步模型复核，通过 GET `/` 查看状态 |
| POST `/evidence` | `{versionId,page,quote,note,taskId?,expectedRevision}`，验证连续原文并保存依据 |

材料 MCP `read_material_page` 参数：`caseId`、`versionId`、`page`、`access`（user/model）。后端传入绑定案件的调用 scope，模型不可自行更改 caseId/access。模型阅读同时检查全局工具启用、案件范围和版本授权；返回后再次复查。全局工具台不能直接发起案件页面读取。`materials_info` 仅返回能力，不暴露案件内容。上述范围不是多用户鉴权；原型仅本机单用户。


## v0.6 审查问题与 Word

类型见 shared/issues.ts，保存在 materials.sqlite 的 review_issues 表。已有数据库自动建表，无需手工迁移。

| 路径（均在 /api/cases/:id/issues 下） | 行为 |
| --- | --- |
| GET / | IssueSnapshot，含有效状态、变更影响、材料与 AI 建议 |
| POST / | 创建或导入；title/category，或 taskId，或 reviewId/itemIndex |
| POST /:issueId | 更新 title/category/partyIds/owner/missing/note/status；另带 issueRevision |
| POST /:issueId/citations | 添加 versionId/page/quote/relation，连续原文校验 |
| GET /comparison?from=&to= | 同案同文档旧→新版，真实 MCP 页读取及行差异 |
| POST /compare-review | from/to，沿用逐版本 AI 授权，返回异步材料复核记录 |
| GET /memo.docx | 导出当前保存记录的可编辑 Word；不改变案件修订或意见 |

创建、更新与添加引用均须 expectedRevision，防止旧页面覆盖新案件记录。已处理问题的修改仍会令案件总意见恢复草稿。记录 resolved 要求责任人、原文依据、至少 10 字说明、missing 为空；有版本影响时须 acknowledgedVersionIds 包含最新版本且已关联其原文。历史意见保存引用与版本哈希快照，不能通过编辑当前问题覆盖。

文字比较不调用模型；AI 比较采用现有材料工具白名单和 5 轮/16 次调用上限。JSON 语法或 schema 失败最多重试一次，不放宽引用/授权校验。第三方兼容模型的结构化输出参数兼容性不作保证。

## v0.7 AI 审查助理

路径基于 `/api/cases/:id/assistant`。类型见 shared/assistant.ts；assistant_runs 保存在 materials.sqlite。

| 方法与路径 | 行为 |
| --- | --- |
| GET / | 材料、问题、模型/连接就绪状态、案件修订与助理历史 |
| POST /runs | `{question,versionIds,expectedRevision}`；返回异步运行，轮询 GET / |
| POST /runs/:runId/apply | `{index,expectedRevision,missing,request}`；采用经过编辑的草稿，返回 issueId 与新快照 |

不接受浏览器直接传入引用、目标问题、主体或状态作为采用依据；这些字段必须来自同案已完成、已通过引用校验的模型记录。允许编辑待补信息与请求正文。保存独立的 adoptedDrafts 快照，追加现有问题或创建复核中问题，保留旧文字和意见历史。重复采用幂等；其他案件修订变化后返回 409。采用不能设置 resolved、自动确认收案或发送外部消息。

每案同时最多一轮助理运行；最多 4 份/12 页，逐页真实 MCP 读取，逐版本模型授权。全局权限和版本授权在模型请求前后、工具调用前重查。服务重启将未完成运行保留为失败。上下文包括本案背景、主体、未决问题及已处理问题标题；材料、问题及背景均作为不可信数据处理。
