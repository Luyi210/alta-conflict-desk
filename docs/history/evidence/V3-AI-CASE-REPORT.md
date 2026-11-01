# 案件级收案审查记录

- 案件：全链路验收 · 双主体融资专项（虚构）
- 案件编号：fe5bd2b5-c7e3-4440-835c-2a7729b6ff2e
- 修订：5
- 创建：2026-10-30T13:39:37.690Z；更新：2026-10-30T13:42:53.390Z
- 事项背景：软件功能验收，全部委托关系均为虚构。拟委托人 HSBC UK BANK PLC 寻求融资文件专项服务，交易对方为 HSBC BANK PLC。请分别核查两方及 GLEIF 已披露母公司，结合本次专项范围提示与既有监管咨询或集团治理事项的范围和保密义务复核重点。不得将公司关联视为已构成利益冲突，不作批准收案结论。
- 司法辖区（仅作背景）：中国香港（事项背景）
- 执行模式：AI 辅助核查，实际完成情况见每个主体的模型状态及调用轨迹
- 覆盖进度：2/2 个主体来源核查完整，2 个身份已确认。

> 本原型的内部事项及律师姓名全部为虚构数据；公开企业名称与 LEI 不代表真实委托关系。系统生成核查线索和补证清单，不自动判断法律利益冲突，也不批准收案。GLEIF 母公司关系采用会计合并口径，不是完整股权、控制或法律关联图谱。未命中不等于不存在利益冲突。

## 主体清单与覆盖

### 拟委托人 · HSBC UK BANK PLC

- 主体编号：ae639c34-52fe-4320-9e2c-874565f12596
- 身份：已选择确认；LEI 21380081EP12LC86CB82
- 当前核查：6c62eeac-7faf-41ee-adee-d5afc830d0d6 / completed
- 实际取得主体：HSBC UK BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。
- 模型执行：completed；模型 deepseek-flash；工具调用 6 次；2 轮。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82)；获取时间 2026-10-30T13:42:42.149Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent)；获取时间 2026-10-30T13:42:42.585Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent)；获取时间 2026-10-30T13:42:44.168Z。

### 交易对方 · HSBC BANK PLC

- 主体编号：b92b2ca8-ae0e-46af-98e1-24cdac16333b
- 身份：已选择确认；LEI MP6I5ZYZBEU3UXPYFY54
- 当前核查：32b3a553-a2e6-4b38-9e19-c811f345ce8a / completed
- 实际取得主体：HSBC BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。
- 模型执行：completed；模型 deepseek-flash；工具调用 6 次；2 轮。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54)；获取时间 2026-10-30T13:39:39.654Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent)；获取时间 2026-10-30T13:39:40.076Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent)；获取时间 2026-10-30T13:39:45.222Z。

## 当前阻塞项

- 6 条线索仍待复核或进一步复核
- 4 项委托范围或保密补证尚未补齐

## 补证清单（跨主体合并）

### 核实委托范围 · DEMO-2026-014

- 编号：scope-4e40087843ab66349b2c；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「银行监管咨询（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。当前仅名称相似，须先确认是否同一主体。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：2026-10-30T13:42:40.552Z

### 核实委托范围 · DEMO-2026-027

- 编号：scope-f09377ae7b9dc48c545f；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「信息技术采购咨询（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。当前仅名称相似，须先确认是否同一主体。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：2026-10-30T13:42:40.552Z

### 核实委托范围 · DEMO-2025-038

- 编号：scope-057a483887f4046f45a4；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「集团治理专项（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。记录命中或公司关联不自动构成法律冲突。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：2026-10-30T13:42:40.552Z

### 核实既往保密义务 · DEMO-2025-038

- 编号：confidentiality-057a483887f4046f45a4；种类：confidentiality；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「集团治理专项（虚构）」已取得的保密信息及相关义务；请填写核实说明与材料引用，不在此表披露保密内容。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：2026-10-30T13:42:40.552Z

## 核查线索与人工复核

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6 / 81225dcd-9174-4dff-925d-27f4514b938f
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK PLC 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：b8067008-751d-4fe9-92b9-1b7684d16a55、5e937040-a4d3-410e-ae72-2f1fa4e0b6af

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6 / 41987fab-da41-47d2-87f3-581a30d6797e
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：b8067008-751d-4fe9-92b9-1b7684d16a55、5e937040-a4d3-410e-ae72-2f1fa4e0b6af

### HSBC UK BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6 / 0e42d070-84b0-402c-ae24-e9bcc9611081
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：b8067008-751d-4fe9-92b9-1b7684d16a55、eef23a06-cbe8-497e-9d3d-9e6d17a52027、95c74e48-fb3e-497b-83a2-9ce735d43b89

### HSBC BANK PLC · 同一主体出现在既有事项

- 核查 / 线索编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a / 000f8b84-ec1d-42e0-ae1d-8bfe3fcb35bc
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：exact-lei；线索类型：direct
- 说明：LEI 与虚构台账 DEMO-2026-014 完全一致。请核实委托范围与在办义务。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：4438d3ac-7453-44b7-a594-d5932943107e、f48989aa-7135-48d0-ad00-039abb28bd8e

### HSBC BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a / 593c7234-b734-4e45-9050-b1fb2d1948a6
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：4438d3ac-7453-44b7-a594-d5932943107e、f48989aa-7135-48d0-ad00-039abb28bd8e

### HSBC BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a / 30774765-45c8-44f4-80eb-1e1e0a9517f7
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：4438d3ac-7453-44b7-a594-d5932943107e、5372f50a-a6de-40f8-bc09-46d786e96897、e128a6a6-f97b-4f38-b980-71f75157fb85

## 案件级人工意见

- 状态：草稿
- 对应修订：5
- 填写人（手工输入，身份未验证）：未填写
- 说明：未填写
- 记录时间：未记录

### 主体：HSBC UK BANK PLC

## AI 核查简报

AI 摘要（待律师核对）：
已核实：拟委托人 HSBC UK BANK PLC（LEI 21380081EP12LC86CB82，GB，ACTIVE）的 GLEIF 直接及最终母公司均为 HSBC HOLDINGS PLC（LEI MLU0ZO3ML4LN2LL2TL39）；HSBC HOLDINGS PLC 的母公司查询返回 404，存在覆盖缺口。台账：核对当前主体时命中两条近似名称记录（含 HSBC BANK PLC，其 LEI 不同，属 name-only 待身份复核）；核对母公司时命中一条 exact-LEI 既往的集团治理事项记录。以上不构成冲突判断。

引用调用：4644b47e-ed2d-4ff4-bea5-e87b24bf3de2、836b1ada-d0e3-421d-a561-127082f7d8ec、6a481ec4-8f83-4595-95b3-947d789cc115、59a1f070-13cd-4839-89b8-787add0d914a、34066168-0975-4552-aec8-c48d7065ecec、3303c78d-c351-4888-bcdc-23d71e1c9e20

### 来源记录（直接由实际工具字段整理）

- 登记主体：HSBC UK BANK PLC；LEI 21380081EP12LC86CB82；辖区 GB；状态 ACTIVE。（来源调用：4644b47e-ed2d-4ff4-bea5-e87b24bf3de2）
- 登记主体：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39；辖区 GB；状态 ACTIVE。（来源调用：836b1ada-d0e3-421d-a561-127082f7d8ec）
- 直接会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：6a481ec4-8f83-4595-95b3-947d789cc115）
- 最终会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：6a481ec4-8f83-4595-95b3-947d789cc115）
- DEMO-2026-014 · HSBC BANK PLC：仅名称匹配，身份未确认；事项「银行监管咨询（虚构）」；现有客户，进行中。（来源调用：34066168-0975-4552-aec8-c48d7065ecec）
- DEMO-2026-027 · HSBC BANK SERVICES LIMITED：仅名称匹配，身份未确认；事项「信息技术采购咨询（虚构）」；待识别记录，进行中。（来源调用：34066168-0975-4552-aec8-c48d7065ecec）
- DEMO-2025-038 · HSBC HOLDINGS PLC：LEI 一致；事项「集团治理专项（虚构）」；既往客户，已结案。（来源调用：3303c78d-c351-4888-bcdc-23d71e1c9e20）

### 律师待核实

- 交易对方 HSBC BANK PLC（LEI MP6I5ZYZBEU3UXPYFY54）与拟委托人 HSBC UK BANK PLC 是否为不同法律实体？该主体及任何其他交易相关方的核查，是否已另行立案覆盖？本次核查范围不包含该主体。（来源调用：34066168-0975-4552-aec8-c48d7065ecec）
- DEMO-2026-014（银行监管咨询，进行中，委托人 HSBC BANK PLC）与本次融资文件专项的范围是否重叠？既有保密义务与利益冲突筛查义务如何适用于名称相同、但 LEI 不同的相关实体？（来源调用：34066168-0975-4552-aec8-c48d7065ecec）
- DEMO-2025-038（集团治理专项，已结案，exact-LEI 为 HSBC HOLDINGS PLC）产生的保密义务是否约束向拟委托人及其交易对方提供融资文件服务？其适用范围是否覆盖母子公司共享的信息？（来源调用：3303c78d-c351-4888-bcdc-23d71e1c9e20、6a481ec4-8f83-4595-95b3-947d789cc115）

### 建议下一步

- 向拟委托人书面确认其准确法律名称与 LEI，并确认 HSBC BANK PLC（MP6I5ZYZBEU3UXPYFY54）及 HSBC BANK SERVICES LIMITED（无 LEI）是否属于本次委托的当事方，据此排除或保留 name-only 台账命中。（来源调用：34066168-0975-4552-aec8-c48d7065ecec）
- 调取 DEMO-2026-014 与 DEMO-2025-038 的委托范围、利益冲突筛查记录及保密条款，交负责合伙人及律师人工判断其与本次融资专项的范围是否重叠。（来源调用：3303c78d-c351-4888-bcdc-23d71e1c9e20）
- 就 HSBC HOLDINGS PLC 母公司关系中的 404 缺口，补充其他公开来源，并查看案件覆盖清单与集团结构材料，补全上下游实体后再行核查。（来源调用：59a1f070-13cd-4839-89b8-787add0d914a）

### 主体：HSBC BANK PLC

## AI 核查简报

AI 摘要（待律师核对）：
已用 exact-lei 核实 HSBC BANK PLC（GB，存续）及其 GLEIF 披露直接/最终母公司 HSBC HOLDINGS PLC；后者母公司关系查询返回 404 缺口。台账显示：交易对方为既有进行中监管咨询客户（exact-lei）；母公司为已结案集团治理事项委托人（exact-lei）；另有一条无 LEI 的近似名称记录待人工排除。仅为核查线索，不作冲突结论。

引用调用：94e48a6e-8265-471e-8b3d-595af33d2f69、62bdcdd2-0dcb-4ecd-b3e8-3e6dbf07a3db、a915279d-2164-4c6b-9e27-50f2a1c6ffc6、0aa77b1a-e51b-4891-83c8-3c02f8424725、eeaef91f-5bc5-442a-b1e7-c02580aa1c8a、2356bb15-14c7-4942-ace0-f5521e90eb57

### 来源记录（直接由实际工具字段整理）

- 登记主体：HSBC BANK PLC；LEI MP6I5ZYZBEU3UXPYFY54；辖区 GB；状态 ACTIVE。（来源调用：94e48a6e-8265-471e-8b3d-595af33d2f69）
- 直接会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：62bdcdd2-0dcb-4ecd-b3e8-3e6dbf07a3db）
- 最终会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：62bdcdd2-0dcb-4ecd-b3e8-3e6dbf07a3db）
- 登记主体：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39；辖区 GB；状态 ACTIVE。（来源调用：a915279d-2164-4c6b-9e27-50f2a1c6ffc6）
- DEMO-2026-014 · HSBC BANK PLC：LEI 一致；事项「银行监管咨询（虚构）」；现有客户，进行中。（来源调用：eeaef91f-5bc5-442a-b1e7-c02580aa1c8a）
- DEMO-2026-027 · HSBC BANK SERVICES LIMITED：仅名称匹配，身份未确认；事项「信息技术采购咨询（虚构）」；待识别记录，进行中。（来源调用：eeaef91f-5bc5-442a-b1e7-c02580aa1c8a）
- DEMO-2025-038 · HSBC HOLDINGS PLC：LEI 一致；事项「集团治理专项（虚构）」；既往客户，已结案。（来源调用：2356bb15-14c7-4942-ace0-f5521e90eb57）

### 律师待核实

- 拟委托人 HSBC UK BANK PLC 的身份与 LEI 未提供，需核实其与 HSBC BANK PLC、HSBC HOLDINGS PLC 的关系，以及本次融资专项中各方角色（是否互为交易对手）；其辖区背景为中国香港，需确认适用法律与执业限制。（复核建议，尚未核实）
- 既有进行中的银行监管咨询（DEMO-2026-014，林律师）范围是否涵盖融资文件、监管资本/披露事项，是否含与该交易对方相关的保密义务、信息安全隔离（ethical screen）安排？（来源调用：eeaef91f-5bc5-442a-b1e7-c02580aa1c8a）
- 已结案的集团治理专项（DEMO-2025-038，周律师）保密义务是否持续、是否涉及本交易对方或母公司层面的治理信息；其信息是否会流入本项目？此项不因母子关系本身构成冲突。（来源调用：2356bb15-14c7-4942-ace0-f5521e90eb57）

### 建议下一步

- 取得拟委托人 HSBC UK BANK PLC 的精确 LEI 与登记信息后，另行以其已确认主体开展 GLEIF 身份与母公司核查及台账检索，并补入覆盖清单。（复核建议，尚未核实）
- 调取 DEMO-2026-014 与 DEMO-2025-038 的委托范围、聘用条款与保密约定，由主管合伙人书面确认是否需要信息隔离及是否需征得同意。（来源调用：eeaef91f-5bc5-442a-b1e7-c02580aa1c8a、2356bb15-14c7-4942-ace0-f5521e90eb57）
- 对近似名称记录 HSBC BANK SERVICES LIMITED（DEMO-2026-027，无 LEI）进行人工身份排除；并因母公司母公司关系查询返回 404，补充集团结构核实材料。（来源调用：eeaef91f-5bc5-442a-b1e7-c02580aa1c8a、0aa77b1a-e51b-4891-83c8-3c02f8424725）


## 活动与旧意见失效记录

- 2026-10-30T13:39:37.696Z · created · 创建案件；2 个已确认主体开始核查，0 个主体待补充身份。
- 2026-10-30T13:39:46.901Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-10-30T13:40:17.163Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-10-30T13:42:40.552Z · party-retried · 主体「HSBC UK BANK PLC」重新核查；旧核查 4f6082ee-a348-43e0-aa7d-7d39b073b7a5，新核查 6c62eeac-7faf-41ee-adee-d5afc830d0d6。旧记录保留。
- 2026-10-30T13:42:53.389Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。

## 实际 MCP 调用轨迹

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：b8067008-751d-4fe9-92b9-1b7684d16a55
- 发起方：规则编排
- 时间：2026-10-30T13:42:40.552Z；耗时：1600 ms；状态：success

```json
{
  "arguments": {
    "lei": "21380081EP12LC86CB82"
  },
  "result": {
    "entity": {
      "lei": "21380081EP12LC86CB82",
      "name": "HSBC UK BANK PLC",
      "jurisdiction": "GB",
      "status": "ACTIVE",
      "address": "1 CENTENARY SQUARE, BIRMINGHAM, GB",
      "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
      "fetchedAt": "2026-10-30T13:42:42.149Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:40.554Z",
            "durationMs": 1595,
            "status": 200
          }
        ],
        "durationMs": 1595
      }
    ]
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：5e937040-a4d3-410e-ae72-2f1fa4e0b6af
- 发起方：规则编排
- 时间：2026-10-30T13:42:42.156Z；耗时：7 ms；状态：success

```json
{
  "arguments": {
    "name": "HSBC UK BANK PLC",
    "lei": "21380081EP12LC86CB82"
  },
  "result": {
    "matches": [
      {
        "id": "demo-1",
        "clientName": "HSBC BANK PLC",
        "lei": "MP6I5ZYZBEU3UXPYFY54",
        "matterName": "银行监管咨询（虚构）",
        "matterRef": "DEMO-2026-014",
        "role": "委托人",
        "relationship": "现有客户",
        "status": "进行中",
        "partner": "林律师（虚构）",
        "note": "纯演示委托，不代表该企业与任何律所存在关系。LEI 精确一致，仍需律师判断具体事项与义务。",
        "matchType": "similar-name",
        "matchedName": "HSBC UK BANK PLC"
      },
      {
        "id": "demo-3",
        "clientName": "HSBC BANK SERVICES LIMITED",
        "lei": null,
        "matterName": "信息技术采购咨询（虚构）",
        "matterRef": "DEMO-2026-027",
        "role": "委托人",
        "relationship": "待识别记录",
        "status": "进行中",
        "partner": "陈律师（虚构）",
        "note": "完全虚构的近似名称记录，无 LEI，专门演示同名/近似名误报的人工排除。",
        "matchType": "similar-name",
        "matchedName": "HSBC UK BANK PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：eef23a06-cbe8-497e-9d3d-9e6d17a52027
- 发起方：规则编排
- 时间：2026-10-30T13:42:42.167Z；耗时：2023 ms；状态：success

```json
{
  "arguments": {
    "lei": "21380081EP12LC86CB82"
  },
  "result": {
    "relations": [
      {
        "type": "direct-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:42:42.585Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-10-30T13:42:42.585Z"
      },
      {
        "type": "ultimate-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:42:44.168Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-10-30T13:42:44.168Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:42.168Z",
            "durationMs": 417,
            "status": 200
          }
        ],
        "durationMs": 417
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:42.169Z",
            "durationMs": 1999,
            "status": 200
          }
        ],
        "durationMs": 1999
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：95c74e48-fb3e-497b-83a2-9ce735d43b89
- 发起方：规则编排
- 时间：2026-10-30T13:42:44.193Z；耗时：1 ms；状态：success

```json
{
  "arguments": {
    "name": "HSBC HOLDINGS PLC",
    "lei": "MLU0ZO3ML4LN2LL2TL39"
  },
  "result": {
    "matches": [
      {
        "id": "demo-2",
        "clientName": "HSBC HOLDINGS PLC",
        "lei": "MLU0ZO3ML4LN2LL2TL39",
        "matterName": "集团治理专项（虚构）",
        "matterRef": "DEMO-2025-038",
        "role": "委托人",
        "relationship": "既往客户",
        "status": "已结案",
        "partner": "周律师（虚构）",
        "note": "纯演示委托。母子公司关系本身不自动构成法律利益冲突；既往事项和保密义务需人工核实。",
        "matchType": "exact-lei",
        "matchedName": "HSBC HOLDINGS PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：4644b47e-ed2d-4ff4-bea5-e87b24bf3de2
- 发起方：模型工具调用
- 时间：2026-10-30T13:42:45.523Z；耗时：1629 ms；状态：success

```json
{
  "arguments": {
    "lei": "21380081EP12LC86CB82"
  },
  "result": {
    "entity": {
      "lei": "21380081EP12LC86CB82",
      "name": "HSBC UK BANK PLC",
      "jurisdiction": "GB",
      "status": "ACTIVE",
      "address": "1 CENTENARY SQUARE, BIRMINGHAM, GB",
      "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
      "fetchedAt": "2026-10-30T13:42:47.150Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:45.524Z",
            "durationMs": 1626,
            "status": 200
          }
        ],
        "durationMs": 1626
      }
    ]
  }
}
```

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：836b1ada-d0e3-421d-a561-127082f7d8ec
- 发起方：模型工具调用
- 时间：2026-10-30T13:42:47.157Z；耗时：387 ms；状态：success

```json
{
  "arguments": {
    "lei": "MLU0ZO3ML4LN2LL2TL39"
  },
  "result": {
    "entity": {
      "lei": "MLU0ZO3ML4LN2LL2TL39",
      "name": "HSBC HOLDINGS PLC",
      "jurisdiction": "GB",
      "status": "ACTIVE",
      "address": "8 CANADA SQUARE, LONDON, GB",
      "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
      "fetchedAt": "2026-10-30T13:42:47.542Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:47.158Z",
            "durationMs": 384,
            "status": 200
          }
        ],
        "durationMs": 384
      }
    ]
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：6a481ec4-8f83-4595-95b3-947d789cc115
- 发起方：模型工具调用
- 时间：2026-10-30T13:42:47.550Z；耗时：406 ms；状态：success

```json
{
  "arguments": {
    "lei": "21380081EP12LC86CB82"
  },
  "result": {
    "relations": [
      {
        "type": "direct-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:42:47.956Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-10-30T13:42:47.956Z"
      },
      {
        "type": "ultimate-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:42:47.942Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-10-30T13:42:47.942Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:47.551Z",
            "durationMs": 405,
            "status": 200
          }
        ],
        "durationMs": 405
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:47.552Z",
            "durationMs": 390,
            "status": 200
          }
        ],
        "durationMs": 390
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：59a1f070-13cd-4839-89b8-787add0d914a
- 发起方：模型工具调用
- 时间：2026-10-30T13:42:47.963Z；耗时：388 ms；状态：success

```json
{
  "arguments": {
    "lei": "MLU0ZO3ML4LN2LL2TL39"
  },
  "result": {
    "relations": [],
    "gaps": [
      "最终母公司查询未完成：GLEIF HTTP 404: 未提供该记录/关系",
      "直接母公司查询未完成：GLEIF HTTP 404: 未提供该记录/关系"
    ],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:47.964Z",
            "durationMs": 386,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 386
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:42:47.964Z",
            "durationMs": 383,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 384
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：34066168-0975-4552-aec8-c48d7065ecec
- 发起方：模型工具调用
- 时间：2026-10-30T13:42:48.357Z；耗时：1 ms；状态：success

```json
{
  "arguments": {
    "lei": "21380081EP12LC86CB82",
    "name": "HSBC UK BANK PLC"
  },
  "result": {
    "matches": [
      {
        "id": "demo-1",
        "clientName": "HSBC BANK PLC",
        "lei": "MP6I5ZYZBEU3UXPYFY54",
        "matterName": "银行监管咨询（虚构）",
        "matterRef": "DEMO-2026-014",
        "role": "委托人",
        "relationship": "现有客户",
        "status": "进行中",
        "partner": "林律师（虚构）",
        "note": "纯演示委托，不代表该企业与任何律所存在关系。LEI 精确一致，仍需律师判断具体事项与义务。",
        "matchType": "similar-name",
        "matchedName": "HSBC UK BANK PLC"
      },
      {
        "id": "demo-3",
        "clientName": "HSBC BANK SERVICES LIMITED",
        "lei": null,
        "matterName": "信息技术采购咨询（虚构）",
        "matterRef": "DEMO-2026-027",
        "role": "委托人",
        "relationship": "待识别记录",
        "status": "进行中",
        "partner": "陈律师（虚构）",
        "note": "完全虚构的近似名称记录，无 LEI，专门演示同名/近似名误报的人工排除。",
        "matchType": "similar-name",
        "matchedName": "HSBC UK BANK PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：6c62eeac-7faf-41ee-adee-d5afc830d0d6；调用编号：3303c78d-c351-4888-bcdc-23d71e1c9e20
- 发起方：模型工具调用
- 时间：2026-10-30T13:42:48.362Z；耗时：2 ms；状态：success

```json
{
  "arguments": {
    "lei": "MLU0ZO3ML4LN2LL2TL39",
    "name": "HSBC HOLDINGS PLC"
  },
  "result": {
    "matches": [
      {
        "id": "demo-2",
        "clientName": "HSBC HOLDINGS PLC",
        "lei": "MLU0ZO3ML4LN2LL2TL39",
        "matterName": "集团治理专项（虚构）",
        "matterRef": "DEMO-2025-038",
        "role": "委托人",
        "relationship": "既往客户",
        "status": "已结案",
        "partner": "周律师（虚构）",
        "note": "纯演示委托。母子公司关系本身不自动构成法律利益冲突；既往事项和保密义务需人工核实。",
        "matchType": "exact-lei",
        "matchedName": "HSBC HOLDINGS PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC BANK PLC · gleif / get_entity

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：4438d3ac-7453-44b7-a594-d5932943107e
- 发起方：规则编排
- 时间：2026-10-30T13:39:37.695Z；耗时：1960 ms；状态：success

```json
{
  "arguments": {
    "lei": "MP6I5ZYZBEU3UXPYFY54"
  },
  "result": {
    "entity": {
      "lei": "MP6I5ZYZBEU3UXPYFY54",
      "name": "HSBC BANK PLC",
      "jurisdiction": "GB",
      "status": "ACTIVE",
      "address": "8 CANADA SQUARE, LONDON, GB",
      "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
      "fetchedAt": "2026-10-30T13:39:39.654Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:39:37.698Z",
            "durationMs": 1956,
            "status": 200
          }
        ],
        "durationMs": 1956
      }
    ]
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：f48989aa-7135-48d0-ad00-039abb28bd8e
- 发起方：规则编排
- 时间：2026-10-30T13:39:39.659Z；耗时：8 ms；状态：success

```json
{
  "arguments": {
    "name": "HSBC BANK PLC",
    "lei": "MP6I5ZYZBEU3UXPYFY54"
  },
  "result": {
    "matches": [
      {
        "id": "demo-1",
        "clientName": "HSBC BANK PLC",
        "lei": "MP6I5ZYZBEU3UXPYFY54",
        "matterName": "银行监管咨询（虚构）",
        "matterRef": "DEMO-2026-014",
        "role": "委托人",
        "relationship": "现有客户",
        "status": "进行中",
        "partner": "林律师（虚构）",
        "note": "纯演示委托，不代表该企业与任何律所存在关系。LEI 精确一致，仍需律师判断具体事项与义务。",
        "matchType": "exact-lei",
        "matchedName": "HSBC BANK PLC"
      },
      {
        "id": "demo-3",
        "clientName": "HSBC BANK SERVICES LIMITED",
        "lei": null,
        "matterName": "信息技术采购咨询（虚构）",
        "matterRef": "DEMO-2026-027",
        "role": "委托人",
        "relationship": "待识别记录",
        "status": "进行中",
        "partner": "陈律师（虚构）",
        "note": "完全虚构的近似名称记录，无 LEI，专门演示同名/近似名误报的人工排除。",
        "matchType": "similar-name",
        "matchedName": "HSBC BANK PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：5372f50a-a6de-40f8-bc09-46d786e96897
- 发起方：规则编排
- 时间：2026-10-30T13:39:39.671Z；耗时：5552 ms；状态：success

```json
{
  "arguments": {
    "lei": "MP6I5ZYZBEU3UXPYFY54"
  },
  "result": {
    "relations": [
      {
        "type": "direct-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:39:40.076Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-10-30T13:39:40.076Z"
      },
      {
        "type": "ultimate-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:39:45.222Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-10-30T13:39:45.222Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:39:39.671Z",
            "durationMs": 405,
            "status": 200
          }
        ],
        "durationMs": 405
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:39:39.672Z",
            "durationMs": 5550,
            "status": 200
          }
        ],
        "durationMs": 5550
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：e128a6a6-f97b-4f38-b980-71f75157fb85
- 发起方：规则编排
- 时间：2026-10-30T13:39:45.224Z；耗时：1 ms；状态：success

```json
{
  "arguments": {
    "name": "HSBC HOLDINGS PLC",
    "lei": "MLU0ZO3ML4LN2LL2TL39"
  },
  "result": {
    "matches": [
      {
        "id": "demo-2",
        "clientName": "HSBC HOLDINGS PLC",
        "lei": "MLU0ZO3ML4LN2LL2TL39",
        "matterName": "集团治理专项（虚构）",
        "matterRef": "DEMO-2025-038",
        "role": "委托人",
        "relationship": "既往客户",
        "status": "已结案",
        "partner": "周律师（虚构）",
        "note": "纯演示委托。母子公司关系本身不自动构成法律利益冲突；既往事项和保密义务需人工核实。",
        "matchType": "exact-lei",
        "matchedName": "HSBC HOLDINGS PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC BANK PLC · gleif / get_entity

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：94e48a6e-8265-471e-8b3d-595af33d2f69
- 发起方：模型工具调用
- 时间：2026-10-30T13:39:47.123Z；耗时：983 ms；状态：success

```json
{
  "arguments": {
    "lei": "MP6I5ZYZBEU3UXPYFY54"
  },
  "result": {
    "entity": {
      "lei": "MP6I5ZYZBEU3UXPYFY54",
      "name": "HSBC BANK PLC",
      "jurisdiction": "GB",
      "status": "ACTIVE",
      "address": "8 CANADA SQUARE, LONDON, GB",
      "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
      "fetchedAt": "2026-10-30T13:39:48.105Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:39:47.124Z",
            "durationMs": 981,
            "status": 200
          }
        ],
        "durationMs": 981
      }
    ]
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：62bdcdd2-0dcb-4ecd-b3e8-3e6dbf07a3db
- 发起方：模型工具调用
- 时间：2026-10-30T13:39:48.112Z；耗时：13439 ms；状态：success

```json
{
  "arguments": {
    "lei": "MP6I5ZYZBEU3UXPYFY54"
  },
  "result": {
    "relations": [
      {
        "type": "direct-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:39:48.517Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-10-30T13:39:48.517Z"
      },
      {
        "type": "ultimate-parent",
        "entity": {
          "lei": "MLU0ZO3ML4LN2LL2TL39",
          "name": "HSBC HOLDINGS PLC",
          "jurisdiction": "GB",
          "status": "ACTIVE",
          "address": "8 CANADA SQUARE, LONDON, GB",
          "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
          "fetchedAt": "2026-10-30T13:40:01.550Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-10-30T13:40:01.550Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:39:48.113Z",
            "durationMs": 403,
            "status": 200
          }
        ],
        "durationMs": 403
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:39:48.113Z",
            "durationMs": 10496,
            "error": "UND_ERR_CONNECT_TIMEOUT"
          },
          {
            "number": 2,
            "startedAt": "2026-10-30T13:39:58.910Z",
            "durationMs": 2640,
            "status": 200
          }
        ],
        "durationMs": 13437
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · gleif / get_entity

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：a915279d-2164-4c6b-9e27-50f2a1c6ffc6
- 发起方：模型工具调用
- 时间：2026-10-30T13:40:01.556Z；耗时：4193 ms；状态：success

```json
{
  "arguments": {
    "lei": "MLU0ZO3ML4LN2LL2TL39"
  },
  "result": {
    "entity": {
      "lei": "MLU0ZO3ML4LN2LL2TL39",
      "name": "HSBC HOLDINGS PLC",
      "jurisdiction": "GB",
      "status": "ACTIVE",
      "address": "8 CANADA SQUARE, LONDON, GB",
      "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
      "fetchedAt": "2026-10-30T13:40:05.748Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:40:01.557Z",
            "durationMs": 4191,
            "status": 200
          }
        ],
        "durationMs": 4191
      }
    ]
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：0aa77b1a-e51b-4891-83c8-3c02f8424725
- 发起方：模型工具调用
- 时间：2026-10-30T13:40:05.753Z；耗时：6285 ms；状态：success

```json
{
  "arguments": {
    "lei": "MLU0ZO3ML4LN2LL2TL39"
  },
  "result": {
    "relations": [],
    "gaps": [
      "直接母公司查询未完成：GLEIF HTTP 404: 未提供该记录/关系",
      "最终母公司查询未完成：GLEIF HTTP 404: 未提供该记录/关系"
    ],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:40:05.754Z",
            "durationMs": 397,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 397
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T13:40:05.754Z",
            "durationMs": 6283,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 6283
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：eeaef91f-5bc5-442a-b1e7-c02580aa1c8a
- 发起方：模型工具调用
- 时间：2026-10-30T13:40:12.044Z；耗时：2 ms；状态：success

```json
{
  "arguments": {
    "lei": "MP6I5ZYZBEU3UXPYFY54",
    "name": "HSBC BANK PLC"
  },
  "result": {
    "matches": [
      {
        "id": "demo-1",
        "clientName": "HSBC BANK PLC",
        "lei": "MP6I5ZYZBEU3UXPYFY54",
        "matterName": "银行监管咨询（虚构）",
        "matterRef": "DEMO-2026-014",
        "role": "委托人",
        "relationship": "现有客户",
        "status": "进行中",
        "partner": "林律师（虚构）",
        "note": "纯演示委托，不代表该企业与任何律所存在关系。LEI 精确一致，仍需律师判断具体事项与义务。",
        "matchType": "exact-lei",
        "matchedName": "HSBC BANK PLC"
      },
      {
        "id": "demo-3",
        "clientName": "HSBC BANK SERVICES LIMITED",
        "lei": null,
        "matterName": "信息技术采购咨询（虚构）",
        "matterRef": "DEMO-2026-027",
        "role": "委托人",
        "relationship": "待识别记录",
        "status": "进行中",
        "partner": "陈律师（虚构）",
        "note": "完全虚构的近似名称记录，无 LEI，专门演示同名/近似名误报的人工排除。",
        "matchType": "similar-name",
        "matchedName": "HSBC BANK PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：32b3a553-a2e6-4b38-9e19-c811f345ce8a；调用编号：2356bb15-14c7-4942-ace0-f5521e90eb57
- 发起方：模型工具调用
- 时间：2026-10-30T13:40:12.052Z；耗时：1 ms；状态：success

```json
{
  "arguments": {
    "lei": "MLU0ZO3ML4LN2LL2TL39",
    "name": "HSBC HOLDINGS PLC"
  },
  "result": {
    "matches": [
      {
        "id": "demo-2",
        "clientName": "HSBC HOLDINGS PLC",
        "lei": "MLU0ZO3ML4LN2LL2TL39",
        "matterName": "集团治理专项（虚构）",
        "matterRef": "DEMO-2025-038",
        "role": "委托人",
        "relationship": "既往客户",
        "status": "已结案",
        "partner": "周律师（虚构）",
        "note": "纯演示委托。母子公司关系本身不自动构成法律利益冲突；既往事项和保密义务需人工核实。",
        "matchType": "exact-lei",
        "matchedName": "HSBC HOLDINGS PLC"
      }
    ],
    "synthetic": true,
    "coverage": "仅比对本地演示台账；非完整律所客户数据库。"
  }
}
```

---
Alta Conflict Desk · 独立本地原型。适用职业规范、实际委托范围、完整主体名单、保密义务及最终是否收案均由有权律师核实和判断。
