# v0.2 实现约定：案件级收案审查 + 工具调用台

保留 v1 /api/runs 与历史记录，新增 /api/cases。`shared/types.ts` 是共享约定。禁止把规则流程或模型 mock 标为真实 AI 实跑。既有 data 不重置，所有委托关系继续为虚构。

## 案件模块（CaseService + createCaseRouter）

`server/cases.ts` 导出 `CaseService(store, screening)`；`server/case-routes.ts` 导出 `createCaseRouter(cases)` Router，在 `server/app.ts` 挂载 `/api/cases`。

- GET / → {cases:CaseView[]}，最近优先，hydrated runs/progress/tasks/blockers。
- POST / body CaseInput → CaseView 201；1–6 企业主体；至少 1 个已确认有效 LEI；id 唯一；同一 LEI 重复要拒绝提示合并角色，名称未识别的主体可保留，必须产生补证缺口。
- GET /:id → CaseView
- POST /:id/parties/:partyId/resolve body {entity:Entity,confirmed:true} → CaseView；补录身份触发该主体的新核查，修订号+1，之前总审查意见恢复draft并记录失效原因。
- POST /:id/parties/:partyId/retry → CaseView；已确认主体，原run必须非running；重新核查，保留旧run，不丢审计。
- POST /:id/tasks/:taskId body {status:'open'|'resolved',note:string,reference:string} → CaseView；系统管理的身份/来源失败待办不能靠勾选消除，须补录身份/重跑；人工补证完成需要理由与材料引用。
- POST /:id/decision body {status:CaseDecision.status,note:string,reviewer:string} → CaseView；记录完备(review-recorded)必须没有阻塞项。needs-information / needs-partner-review是本地标记，不发送通知。所有人工状态变更记录activity。
- GET /:id/report → Markdown下载，聚合各主体/范围缺口/任务/人工意见/引用和真实调用追踪。

身份未确认、运行中、来源失败、必填任务未补齐、待复核/待进一步复核线索都应列为blockers。禁止自动输出“无冲突/允许收案”。review-recorded只代表审查记录完备，不批准收案。reviewer为手工填写未验证姓名。司法辖区只作背景，不执行当地法律判断。

CaseView任务由实际结果动态生成、稳定id合并：未确认身份(identity)、未完成来源(coverage)、已有事项范围核实(scope)、既往事项保密义务(confidentiality)。同一内部事项的补证请求可跨主体合并。任务备注和引用是真实保存的人工补充，不伪装上传文件。重新核查不得沿用失效的案件结论。

## 工具模块（ToolDeskService + createToolDeskRouter）

`server/tool-desk.ts` 导出 `ToolDeskService(store, connectors)`；`server/tool-routes.ts` 导出 `createToolDeskRouter(toolDesk)` Router，在 `server/app.ts` 挂载 `/api/tool-desk`。

- GET / → {tools:CatalogTool[],calls:ToolExecution[]}，输入schema来自真实MCP发现，断开仍可保留上次发现但available=false，首次未连接没有工具schema。
- POST /permissions body {connector,tool,enabled:boolean} → {tools:CatalogTool[]}，持久化且在ConnectorManager所有调用路径强制执行（规则、模型、手动）。影响后续调用，已开始的只读请求不假称取消。
- POST /calls body {connector,tool,args} → ToolExecution 201（异步执行）。校验工具及真实输入schema；未知工具、禁止工具、未连接调用应有明确错误。
- GET /calls/:id → ToolExecution
- POST /calls/:id/retry → ToolExecution 201（新调用，retryOf保留关联），仅失败调用可重试，不覆盖原记录。

模型适配器：使用与工具执行相同的权限层；未配置仍拒绝AI。合法JSON、工具schema、确认主体边界、调用次数限制、真实引用必须验证。Run.modelExecution可呈现执行状态/轮次/实际模型调用数；不暴露chain-of-thought或密钥。确保“模型配置存在”与“实跑通过”不同。

## 前端模块

- `src/CaseWorkspace.tsx` 和 `src/CaseResults.tsx` 提供案件输入与结果页；现有单主体历史功能保留。
- `src/ToolDesk.tsx` 为独立组件；props `{onError:(message:string)=>void,onTrace:(trace:Trace)=>void,onConnections:()=>void}`，API 调用上述端点。导入现有 api helper 和共享类型，沿用 btn/panel/badge，样式位于 `src/tool-desk.css`；`App.tsx` 提供导航、通知和追踪抽屉。
- v0.2 未新增 npm 依赖。已完成一次 DeepSeek 真实工具调用验收：一个已确认主体、2 轮、4 次模型 MCP 调用，另有 4 次规则预核查，见 `AI-LIVE-VERIFICATION.json`。案件未确认主体和补证缺口仍保留；不能用模型成功替代案件完备，也不能把旧规则、手动或 mock 记录改成 AI 证据。

## v0.3 兼容扩展

- Finding.review 新增 `retained`，必填复核理由；仅 pending/escalated 计入未处理线索。retained 表示已记录问题，不代表排除或批准收案。
- CaseDecision.status 新增 `declined`；完成中的任务不能结案，停止承接可保留 blockers。CaseView.status 对应 `closed`。证据更新仍恢复 draft，同时保留原意见文字及 invalidatedAt。
- 补证和意见接口可接收 expectedRevision；UI 总是携带，过期返回 409，刷新当前资料并保留未保存输入。
- RunInput/Run 增加可选 context、jurisdiction；Run 增加可选 modelBrief。来源卡统一调用 shared/evidence-facts.ts，由实际模型工具返回生成。
- 模型每轮最多 6 次调用、全程最多 12 次、6 轮。最终输出必须实际查询并引用当前主体及已知母公司的台账来源。既有成功记录不因此被改写为已满足新约束。
