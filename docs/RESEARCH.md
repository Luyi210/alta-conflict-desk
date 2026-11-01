# 研究依据与开源参考

调研日期：2026 年 10 月 27 日（Asia/Shanghai）。本文件记录实际读取的官方仓库、文档与职业规范，以及它们如何影响原型设计。星数来自当日 GitHub REST API `GET /repos/{owner}/{repo}`；会随时间变化。星数只是社区采用程度的线索，不代表适合本场景或已经过安全审计。

## 1. 为什么选择这个场景

原型聚焦 **律所接受新委托前的主体识别与潜在利益冲突核查**。律师需要先确认“是否同一法律主体”，再查本所现有、历史和潜在委托记录，判断是否值得进一步审查。公司集团关联可以补充调查线索，但不能直接替代职业规范下的判断。

这里有两类不同的问题：

1. **事实匹配**：名称是否一致、LEI 是否一致、公开记录是否披露会计合并母公司、内部台账是否有该主体。
2. **专业判断**：是否存在相关事项、保密信息、对立利益、代理范围或其他适用规则因素；是否允许继续接受委托。

产品自动完成前一类可核验步骤，将后一类留给律师复核。所谓“直接命中”描述台账匹配，不是已经认定利益冲突。

## 2. 最有参考价值的 GitHub 项目

| 项目 | 实时 stars | 仓库最近 push（UTC） | 我们学习什么 | 本原型的取舍 |
| --- | ---: | --- | --- | --- |
| [Dify](https://github.com/langgenius/dify) | 159,653 | 2026-10-27 | 将集成管理与具体工具调用分开；连接、权限、工具选择、执行日志各有入口 | 只借鉴职责划分，自行设计律师工作流，不复制其控制台、画布或业务源码 |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | 13,660 | 2026-10-27 | 标准 MCP client/server、工具发现、输入 schema、stdio 传输 | 使用官方 SDK 作为实际依赖；避免把普通 HTTP 请求或固定假数据称作 MCP |
| [MCP Inspector](https://github.com/modelcontextprotocol/inspector) | 11,160 | 2026-10-25 | 连接生命周期与请求/响应分离，能够看到实际工具参数、结果和错误 | 借鉴可观察性；不把开发者调试器直接当律师的产品界面 |
| [OpenContracts](https://github.com/Open-Source-Legal/OpenContracts) | 1,524 | 2026-10-27 | 证据引用、人工标注、关系数据与 AI 共用数据层 | 借鉴“结论可回到来源、人工复核被保存”；不引入整套文档平台 |
| [yente](https://github.com/opensanctions/yente) | 183 | 2026-10-26 | 多属性主体匹配、候选结果、误报复核与数据源限定 | 相关性很高但星数不高。参考方法，自行实现窄范围匹配；不在两天 MVP 中部署搜索集群 |

以上仓库当日均未被标记为 archived。push 时间只能说明仓库有更新，不能保证某个功能稳定。尚未在本机完整运行上述产品；本轮学习范围为 README、许可证、相关官方设计/使用文档与公开 API。

### 2.1 Dify：学习集成管理，不引入通用工作流平台

[官方 Integrations 文档](https://docs.dify.ai/en/cloud/use-dify/workspace/plugins)将模型、工具、数据源等连接置于工作区管理；[Tool Node 文档](https://docs.dify.ai/en/cloud/use-dify/nodes/tools)再让具体工作流选择工具和凭证。这支持本原型采用两个清楚的层次：连接器页负责“是否可用、允许调用什么”，核查页负责“此次案件需要查什么”。

**工程决定**：只做两个明确的连接器卡片与有界工具集合，不提供任意脚本执行、通用拖拽画布或插件商城。这样能在两天内验证产品闭环。

**许可证**：[Dify LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE)是带附加条件的 Apache 2.0 修改版，涉及多租户使用和前端标识等限制，不能简单写成“纯 Apache 2.0、随意复制”。本原型不复制其源码或视觉资产。

### 2.2 MCP SDK 与 Inspector：学习真实协议和执行证据

SDK 当前 `main` 已是 v2，使用拆分的 `@modelcontextprotocol/server` 与 `@modelcontextprotocol/client`，支持 2026-07-28 规范。`@modelcontextprotocol/sdk@1.32.2` 属于仍在维护的 v1 分支，适合本原型固定版本快速验证；其覆盖的规范与 v2 不同，不能将它写成“最新 v2 SDK”。参见 [v1 README](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)与 [v1 LICENSE](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/LICENSE)。

[Inspector 架构文档](https://github.com/modelcontextprotocol/inspector/blob/main/docs/architecture.md)让共享 client 管理连接、请求与状态，展示层消费状态。**本原型采用的原则**：由后端持有 MCP 连接，前端呈现运行事实；每次调用留存工具名、参数、耗时、结果或错误。断开连接应真实阻断后续调用，不能只是改变按钮颜色。

**许可证**：v1 SDK 分支为 MIT；SDK 与 Inspector 当前 `main` 的 [LICENSE](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/LICENSE)处于 MIT 向 Apache-2.0 的过渡，文档另涉 CC-BY-4.0。应以实际安装版本的许可证为准。本原型不复制 Inspector 源码。

### 2.3 OpenContracts：学习证据与人工复核

[README](https://github.com/Open-Source-Legal/OpenContracts#readme)描述了文档、引用、人工标注与关系数据，以及同一数据层通过 API、MCP 和 React UI 呈现的方式。对本项目有用的是“可追溯的数据对象 + 人工确认”，而不是其整套文件解析与检索能力。

**工程决定**：发现项保存来源、主体标识、匹配依据、关联路径和复核记录。律师可以排除误报或标记进一步审查；这些动作不修改原始外部事实。该仓库为 MIT。仅参考产品/数据组织思路，不复制实现。

### 2.4 yente：学习主体匹配，不冒充法律结论

[官方 matching 文档](https://www.opensanctions.org/docs/api/matching/)采用多属性样例查询、返回排序候选，强调限定数据集、补充标识信息和人工处理误报。名称相似并不足以确认主体相同。

**工程决定**：以 LEI 精确一致作为强匹配依据；名称仅提供候选或弱匹配线索。让律师先确认主体，再核查关联台账。没有精确标识的相似名称保持“待确认”，不包装成百分比法律风险。

[yente README](https://github.com/opensanctions/yente#readme)说明部署需要 Elasticsearch/OpenSearch。为控制两天范围，本原型不用该服务。yente 代码为 MIT，但 OpenSanctions **数据**具有单独授权条件；本原型不接入或再分发 OpenSanctions 数据。

## 3. 职业规范依据及其产品含义

这些是不同司法辖区的一手资料，用于验证工作流需求和设计边界，**不是将美国或英格兰与威尔士规则直接作为香港法律结论**。真正接入 Alta Lex 时，应由律所指定适用司法辖区、内部政策与审批人。

| 官方资料 | 核对后的要点 | 对原型的具体影响 |
| --- | --- | --- |
| [ABA Model Rule 1.7，Comment [34]](https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_7_conflict_of_interest_current_clients/comment_on_rule_1_7/)（美国示范规则） | 代理一个组织不当然等于代理其母公司或子公司；代理范围、双方理解和实质限制等事实会影响判断 | 关联命中只标记“需进一步审查”；提供关联证据，不自动判定冲突 |
| [SRA Conflicts of interest guidance](https://www.sra.org.uk/solicitors/guidance/conflicts-interest/)及[Code 6.1–6.5](https://www.sra.org.uk/solicitors/standards-regulations/code-conduct-solicitors/)（英格兰与威尔士） | 指引将潜在委托人纳入讨论；冲突、保密、前客户问题不能混为单一名称匹配问题 | 台账区分现有/历史/潜在委托，复核时查看事项范围；不能把“已结案”自动当作无问题 |
| [ABA Model Rule 1.18](https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_18_duties_of_prospective_client/)（美国示范规则） | 即使未建立委托关系，咨询中获知的信息仍可能涉及义务；实际影响取决于具体条件 | 收案核查放在详细案情采集之前；外部身份查询只发送待核验名称/标识，不发送案情或内部客户资料 |

上述规范未被编码为自动“允许/禁止收案”引擎。展示规则明确分为 **精确主体命中、关联主体线索、名称近似待确认**；决定是否接受委托由律师作出。

## 4. GLEIF 数据源：能回答什么，不能回答什么

[GLEIF 官方 API](https://www.gleif.org/en/lei-data/gleif-api)支持实体名称、标识、筛选、模糊匹配和母子关系查询，其基础为 LEI Golden Copy。它适合作为不依赖额外账号的公开身份来源。

- **覆盖边界**：覆盖具有 LEI 的主体，不能等同于全球全部公司。查无结果应显示“该来源未找到”，不能显示“公司不存在”。
- **关系含义**：Level 2 的 direct/ultimate parent 指会计合并母公司；不是完整股权、实控人、受益所有人或所有法律关联关系图。
- **缺失与例外**：官方 [Reporting Exceptions 2.1](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-reporting-exceptions-2-1-format)说明无 LEI、不公开、无需合并等情况。没有母公司结果不证明不存在关联。
- **展示证据**：应显示查询时间、来源链接、主体标识、记录更新时间；若关系数据仅由主体提供，保留 `corroborationLevel`，不能暗示经过本产品独立查证。

### 已验证的公开演示事实

2026-10-27 实际 HTTP 请求（未通过 MCP；仅为选材核验）得到：

| 请求 | 实际响应摘要 |
| --- | --- |
| [HSBC BANK PLC](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54) | LEI `MP6I5ZYZBEU3UXPYFY54`；registration status `ISSUED` |
| [direct-parent](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent) | HSBC HOLDINGS PLC；LEI `MLU0ZO3ML4LN2LL2TL39` |
| [ultimate-parent](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent) | 同上 |
| [direct-parent-relationship](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent-relationship) | `IS_DIRECTLY_CONSOLIDATED_BY`；`ACTIVE`；lastUpdateDate `2026-10-12T10:13:06Z`；corroborationLevel `ENTITY_SUPPLIED_ONLY` |

这只是用于确定演示选材。正式运行应重新通过原型 MCP 查询并记录当次结果。演示中“某主体曾由本所代理”的内部客户/案件记录全部是虚构数据，与真实公司是否聘任任何律所无关。不得把公开的真实主体名称与虚构委托关系合并成对外事实陈述。

## 5. 本原型的实现边界与验收

按顺序验证三件事：

1. **连接是真实的**：MCP client 完成连接、`tools/list` 和 `tools/call`；GLEIF HTTP 调用发生在 MCP server 内，内部台账由另一个 MCP server 查询 SQLite。
2. **发现可解释**：每项发现能够还原到当次工具结果；失败、未查询范围、数据缺口单独展示；复核状态、理由和时间被保存。当前单用户原型没有登录身份，不记录或核验复核人身份。
3. **AI 不作假**：没有模型凭证时只运行明确标识的规则预览。完成题目中的 AI 要求，需要另行验证真实模型读取工具 schema、提出工具调用、接收真实结果，再生成有来源的分析。仅执行预定步骤不等于 AI 自主调用。

此版本不做完整律师事务所管理系统、不做全球工商爬虫、不做法律自动裁决、不做多租户生产部署。未来扩展应优先接入本所真实 CRM/DMS、建立权限和保密边界、添加适用司法辖区政策，再逐步提高匹配覆盖。

## 6. 复用记录

- 直接依赖：官方 MCP SDK（实际版本以 `package-lock.json` 为准）。其余运行依赖按项目锁文件和各自许可证列明。
- 设计参考：Dify 的集成/调用职责分离，Inspector 的工具调用可观察性，OpenContracts 的证据与人工复核，yente 的多属性主体匹配。
- 未复制：以上产品的业务源码、UI 组件、图标、截图与商标视觉资产；不再分发 OpenSanctions 数据。
- 公开运行数据：GLEIF API；演示内部记录：项目自建虚构种子数据。
- 文档内容：对原始资料作摘要并链接到来源，没有嵌入长篇规范原文。

如果后续实施实际复制或移植了任何代码，应在交付前更新本节，注明仓库、提交/版本、文件、修改范围及保留的许可声明。

## v0.6 历史复用：文字比较与 Word

- [kpdecker/jsdiff](https://github.com/kpdecker/jsdiff)：实际使用 `diffLines` 比较 PDF 提取页的行级变化；设置时间/编辑预算，超过预算显示整页对照。BSD-3-Clause，未复制业务 UI。它不理解条款效力，也不自动对应重排页面。
- [docx 官方文档](https://docx.js.org/)与[API](https://docx.js.org/api/modules/index.html)：v0.6 曾采用 npm `docx` 生成本机 Word 样本；该功能及依赖现已移除。没有复用第三方律师意见模板。
- [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)：按官方文档在最终整理阶段使用 `json_object`，同时保留本项目的 schema、真实引用校验及一次格式重试。仅对已知官方主机附加 JSON 参数，其他兼容服务需自行验证。

本轮未重新统计 GitHub stars，不以历史星数宣称当前热度。实际依赖版本及使用边界见许可清单。

## v0.5 实际复用：PDF.js

2026-10-31 阅读 [Mozilla PDF.js 官方仓库](https://github.com/mozilla/pdf.js)，新增 `pdfjs-dist` 6.4.299（Apache-2.0）。直接复用 PDF 加载、页文本提取和 canvas 渲染；没有复制其完整 viewer UI。版本指纹、案件范围、模型工具权限和引用校验由本原型实现。OpenContracts 仍为证据定位与审阅思路参考，没有引入其后端或前端组件。曾查看 pdf-lib，但未安装或复用，因此不将其列作实际依赖。
