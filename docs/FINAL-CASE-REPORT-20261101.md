# 案件级收案审查记录

- 案件：交付验收 · 融资收案审查（虚构 · 2026-11-01）
- 案件编号：a0f550f6-2bbe-42b8-9c04-f14ebd746f3d
- 修订：7
- 创建：2026-11-01T01:52:53.157Z；更新：2026-11-01T01:57:08.733Z
- 事项背景：软件交付验收场景，交易、委托及内部事项全部虚构。拟代表 HSBC UK BANK PLC 提供融资文件审阅服务，对方为 HSBC BANK PLC。需核实本所既有事项与拟委托范围是否重叠，以及示例委托说明中的客户边界、集团关联和保密安排。公众企业名称仅用于真实身份检索，不代表存在实际委托或冲突。
- 司法辖区（仅作背景）：中国香港（事项背景）
- 执行模式：AI 辅助核查，实际完成情况见每个主体的模型状态及调用轨迹
- 覆盖进度：2/2 个主体来源核查完整，2 个身份已确认。

> 本原型的内部事项及律师姓名全部为虚构数据；公开企业名称与 LEI 不代表真实委托关系。系统生成核查线索和补证清单，不自动判断法律利益冲突，也不批准收案。GLEIF 母公司关系采用会计合并口径，不是完整股权、控制或法律关联图谱。未命中不等于不存在利益冲突。

## 主体清单与覆盖

### 拟委托人 · HSBC UK BANK PLC

- 主体编号：59e78d9e-e052-4715-9296-cf6394811183
- 身份：已选择确认；LEI 21380081EP12LC86CB82
- 当前核查：0a4944a6-5c00-460a-bddb-91da731069a9 / completed
- 实际取得主体：HSBC UK BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。
- 模型执行：completed；模型 deepseek-flash；工具调用 6 次；2 轮。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82)；获取时间 2026-11-01T01:52:54.631Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent)；获取时间 2026-11-01T01:52:55.129Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent)；获取时间 2026-11-01T01:52:55.808Z。

### 交易对方 · HSBC BANK PLC

- 主体编号：e0767c8d-e318-4a52-92ed-783e2343139b
- 身份：已选择确认；LEI MP6I5ZYZBEU3UXPYFY54
- 当前核查：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8 / completed
- 实际取得主体：HSBC BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。
- 模型执行：completed；模型 deepseek-flash；工具调用 6 次；2 轮。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54)；获取时间 2026-11-01T01:52:55.453Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent)；获取时间 2026-11-01T01:52:55.906Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent)；获取时间 2026-11-01T01:52:55.909Z。

## 当前阻塞项

- 1 个审查问题尚待核实或材料变更复核
- 6 条线索仍待复核或进一步复核
- 4 项委托范围或保密补证尚未补齐

## 补证清单（跨主体合并）

### 核实委托范围 · DEMO-2026-014

- 编号：scope-4e40087843ab66349b2c；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「银行监管咨询（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。当前仅名称相似，须先确认是否同一主体。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

### 核实委托范围 · DEMO-2026-027

- 编号：scope-f09377ae7b9dc48c545f；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「信息技术采购咨询（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。当前仅名称相似，须先确认是否同一主体。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

### 核实委托范围 · DEMO-2025-038

- 编号：scope-057a483887f4046f45a4；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「集团治理专项（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。记录命中或公司关联不自动构成法律冲突。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

### 核实既往保密义务 · DEMO-2025-038

- 编号：confidentiality-057a483887f4046f45a4；种类：confidentiality；状态：待补充
- 涉及主体：HSBC UK BANK PLC、HSBC BANK PLC
- 要求：核实「集团治理专项（虚构）」已取得的保密信息及相关义务；请填写核实说明与材料引用，不在此表披露保密内容。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

## 核查线索与人工复核

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：0a4944a6-5c00-460a-bddb-91da731069a9 / bc5b9f9f-4652-4007-be8c-4539cb0d9da3
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK PLC 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：98f5acfd-fcb7-4487-80c8-0dfdebddb634、c9bf7d6f-c53c-4168-b22a-b9806f6f8d98

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：0a4944a6-5c00-460a-bddb-91da731069a9 / 35a3ac9d-f0ae-4da9-a33c-ef12b8e9a8a5
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：98f5acfd-fcb7-4487-80c8-0dfdebddb634、c9bf7d6f-c53c-4168-b22a-b9806f6f8d98

### HSBC UK BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：0a4944a6-5c00-460a-bddb-91da731069a9 / 6ccedb5e-3005-4caf-a736-fb31138a8973
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：98f5acfd-fcb7-4487-80c8-0dfdebddb634、0a113432-641b-4d31-b151-18f8a7c259db、20e91205-e346-4fe2-bf5c-12787707b532

### HSBC BANK PLC · 同一主体出现在既有事项

- 核查 / 线索编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8 / bfac20e6-974d-407f-b9f4-4b9b91bcdc18
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：exact-lei；线索类型：direct
- 说明：LEI 与虚构台账 DEMO-2026-014 完全一致。请核实委托范围与在办义务。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：de46a5a7-0f42-45c9-8b8e-9182f7cddb6e、9b2debe4-f474-4e4e-bff0-5c21a7016302

### HSBC BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8 / 92c8cc9d-be71-4aa1-9a12-fd4c85b24611
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：de46a5a7-0f42-45c9-8b8e-9182f7cddb6e、9b2debe4-f474-4e4e-bff0-5c21a7016302

### HSBC BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8 / 9fd18ba6-82f9-48df-b8c8-7a417963230d
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：de46a5a7-0f42-45c9-8b8e-9182f7cddb6e、37782617-373e-46f8-adad-08416e39f507、c63114a8-0d23-487d-b405-da4a063f4cd6

## 案件级人工意见

- 状态：草稿
- 对应修订：7
- 填写人（手工输入，身份未验证）：演示复核人（虚构验收）
- 说明：【软件验收记录】公开企业身份与模型工具流程已核对，尚缺签署版委托范围、客户边界及保密安排说明；本案保留待补充材料，不形成收案批准或实际法律结论。
- 记录时间：未记录
- 原意见失效时间：2026-11-01T01:57:08.732Z；文字保留为草稿，须按当前资料重新审查。

### 主体：HSBC UK BANK PLC

## AI 核查简报

AI 摘要（待律师核对）：
已按 LEI 核查 HSBC UK BANK PLC（21380081EP12LC86CB82，ACTIVE）及其唯一披露母公司 HSBC HOLDINGS PLC（MLU0ZO3ML4LN2LL2TL39，ACTIVE）；后者母公司关系查询返回 404 缺口。台账中仅见近似名称记录（无 exact-lei 命中）与母公司 exact-lei 既往事项，身份、范围与保密义务均待律师复核。

引用调用：478a0328-ae41-4f65-99f5-c25e01cb034a、4f9fb6cc-89d6-4d86-8469-6967fd6d7a10、960672a2-3d73-4177-881d-8749898d46ff、8343282d-281b-4a67-987d-fa9693d5c211、a526d2f8-a946-406d-95fe-3f455f0ea564、a9e5493b-278c-4982-8f3c-0402ee49b84f

### 来源记录（直接由实际工具字段整理）

- 登记主体：HSBC UK BANK PLC；LEI 21380081EP12LC86CB82；辖区 GB；状态 ACTIVE。（来源调用：478a0328-ae41-4f65-99f5-c25e01cb034a）
- 直接会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：4f9fb6cc-89d6-4d86-8469-6967fd6d7a10）
- 最终会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：4f9fb6cc-89d6-4d86-8469-6967fd6d7a10）
- 登记主体：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39；辖区 GB；状态 ACTIVE。（来源调用：960672a2-3d73-4177-881d-8749898d46ff）
- DEMO-2026-014 · HSBC BANK PLC：仅名称匹配，身份未确认；事项「银行监管咨询（虚构）」；现有客户，进行中。（来源调用：a526d2f8-a946-406d-95fe-3f455f0ea564）
- DEMO-2026-027 · HSBC BANK SERVICES LIMITED：仅名称匹配，身份未确认；事项「信息技术采购咨询（虚构）」；待识别记录，进行中。（来源调用：a526d2f8-a946-406d-95fe-3f455f0ea564）
- DEMO-2025-038 · HSBC HOLDINGS PLC：LEI 一致；事项「集团治理专项（虚构）」；既往客户，已结案。（来源调用：a9e5493b-278c-4982-8f3c-0402ee49b84f）

### 律师待核实

- 拟委托人 HSBC UK BANK PLC 在演示台账中仅获近似名称线索（DEMO-2026-014 的客户为 HSBC BANK PLC，LEI 为 MP6I5ZYZBEU3UXPYFY54，与本次确认 LEI 不同；DEMO-2026-027 客户无 LEI），该等记录的真实主体身份以及与本次拟委托的同一性应由律师人工确认；本核查不构成身份结论。（来源调用：a526d2f8-a946-406d-95fe-3f455f0ea564）
- 母公司 HSBC HOLDINGS PLC 在演示台账中为 exact-lei 既往客户（DEMO-2025-038 集团治理专项，已结案）。需核实该事项的实际服务范围是否覆盖融资文件审阅、现时保密义务与信息隔离安排是否延伸到子公司相关事务，以及既往客户关系在本次委托下的处理立场。（来源调用：a9e5493b-278c-4982-8f3c-0402ee49b84f）
- 事项背景中的对方 HSBC BANK PLC 未在本轮授权范围内核查（其 LEI 仅出现在台账字段中，未经 exact-lei 身份确认）；此外 HSBC HOLDINGS PLC 的直接与最终母公司查询返回 404 缺口，其上层关联链条未获证据，均需律师另行安排核查或补充查询。（来源调用：8343282d-281b-4a67-987d-fa9693d5c211）

### 建议下一步

- 调取 DEMO-2026-014 与 DEMO-2026-027 的委托书、立项表与客户主体登记信息（含注册编号、地址、LEI），逐项与本次确认主体比对，判断是同一法人还是不同主体，并出具身份核实说明。（来源调用：a526d2f8-a946-406d-95fe-3f455f0ea564）
- 调取 DEMO-2025-038 的委托范围、结案文件与保密条款，评估其是否涵盖融资文件审阅或同类交付验收服务；就信息隔离墙与母公司—子公司保密边界形成书面意见。（来源调用：a9e5493b-278c-4982-8f3c-0402ee49b84f）
- 向拟委托人取得法人注册证明与 LEI 归属材料，并对 HSBC BANK PLC 及 HSBC HOLDINGS PLC 上层关联主体在后续单独轮次中按 exact-lei 核查；对 404 缺口记录在案并说明数据仅覆盖 GLEIF 会计合并口径。（来源调用：478a0328-ae41-4f65-99f5-c25e01cb034a、4f9fb6cc-89d6-4d86-8469-6967fd6d7a10、960672a2-3d73-4177-881d-8749898d46ff、8343282d-281b-4a67-987d-fa9693d5c211）

### 主体：HSBC BANK PLC

## AI 核查简报

AI 摘要（待律师核对）：
已按 exact-LEI 核对 HSBC BANK PLC（当前主体）与 HSBC HOLDINGS PLC（其直接及最终母公司）的公开身份、GLEIF 母公司关系及虚构台账。台账显示，当前主体有一件进行中的监管咨询事项，母公司有一件已结案事项，另有一条无 LEI 的近似名记录需人工排除。是否构成冲突及可收案性均待律师复核。

引用调用：a1fdccc9-50ff-442b-9178-be88ff3a7cef、02411906-4385-4d81-a7d3-e91bb2ddfa76、3648a3da-93c7-4e0b-8416-c13b2f116769、ea015f95-0da5-4887-b2bc-f36c7e359491、734edc69-f3ff-48af-946d-d253e0cd9267、67cd7056-0258-4191-af6c-cc753ef0a2c8

### 来源记录（直接由实际工具字段整理）

- 登记主体：HSBC BANK PLC；LEI MP6I5ZYZBEU3UXPYFY54；辖区 GB；状态 ACTIVE。（来源调用：a1fdccc9-50ff-442b-9178-be88ff3a7cef）
- 直接会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：02411906-4385-4d81-a7d3-e91bb2ddfa76）
- 最终会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：02411906-4385-4d81-a7d3-e91bb2ddfa76）
- 登记主体：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39；辖区 GB；状态 ACTIVE。（来源调用：3648a3da-93c7-4e0b-8416-c13b2f116769）
- DEMO-2026-014 · HSBC BANK PLC：LEI 一致；事项「银行监管咨询（虚构）」；现有客户，进行中。（来源调用：734edc69-f3ff-48af-946d-d253e0cd9267）
- DEMO-2026-027 · HSBC BANK SERVICES LIMITED：仅名称匹配，身份未确认；事项「信息技术采购咨询（虚构）」；待识别记录，进行中。（来源调用：734edc69-f3ff-48af-946d-d253e0cd9267）
- DEMO-2025-038 · HSBC HOLDINGS PLC：LEI 一致；事项「集团治理专项（虚构）」；既往客户，已结案。（来源调用：67cd7056-0258-4191-af6c-cc753ef0a2c8）

### 律师待核实

- 拟委托对象为 HSBC UK BANK PLC，其与本次已核查主体 HSBC BANK PLC（LEI MP6I5ZYZBEU3UXPYFY54）是否为同一法律实体？该拟委托方本身在本轮未获核查，若为不同实体，其身份与台账匹配结果如何处理？（来源调用：a1fdccc9-50ff-442b-9178-be88ff3a7cef）
- 台账 DEMO-2026-014（HSBC BANK PLC，进行中，银行监管咨询，LEI 精确一致）的委托范围、所涉主体与保密义务是否覆盖本次融资文件审阅（交付验收、香港事项背景）？已结案事项 DEMO-2025-038（HSBC HOLDINGS PLC，集团治理专项）的既往信息是否构成本所使用限制？（来源调用：734edc69-f3ff-48af-946d-d253e0cd9267、67cd7056-0258-4191-af6c-cc753ef0a2c8）
- 近似名记录 HSBC BANK SERVICES LIMITED（无 LEI，事项 DEMO-2026-027，信息技术采购咨询，进行中）与本次主体、母公司及拟委托方之间的实际身份关系如何？其客户边界与保密安排是否与本次交易相关？（来源调用：734edc69-f3ff-48af-946d-d253e0cd9267）

### 建议下一步

- 取得拟委托人 HSBC UK BANK PLC 的注册资料与 LEI，确认其是否为独立法人，并在获授权的独立核查中单独比对台账。（复核建议，尚未核实）
- 调取 DEMO-2026-014 与 DEMO-2025-038 的委托书、业务范围与利益冲突豁免或保密条款，交由承办合伙人与林律师、周律师确认范围是否重叠。（来源调用：734edc69-f3ff-48af-946d-d253e0cd9267、67cd7056-0258-4191-af6c-cc753ef0a2c8）
- 要求提供 HSBC BANK SERVICES LIMITED 的注册证明与 LEI，人工排除同名或近似名误报；并因 HSBC HOLDINGS PLC 母公司关系查询返回 404 缺口，补充集团架构资料以核实是否还有其他关联主体。（来源调用：ea015f95-0da5-4887-b2bc-f36c7e359491、734edc69-f3ff-48af-946d-d253e0cd9267）


## 活动与旧意见失效记录

- 2026-11-01T01:52:53.162Z · created · 创建案件；2 个已确认主体开始核查，0 个主体待补充身份。
- 2026-11-01T01:53:07.274Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-11-01T01:53:08.487Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-11-01T01:54:09.463Z · material-evidence-updated · 导入「DEMO-2026-014 委托范围说明（虚构）」v1；旧版原文和引用保留，新版尚未授权 AI。
- 2026-11-01T01:56:22.352Z · material-evidence-updated · 采用 AI 补证草稿至「核实签署版原委托的范围与排除项：是否仅限银行监管申报、是否明确排除融资文件与交易谈判」；仍待律师复核。
- 2026-11-01T01:56:39.688Z · material-evidence-updated · 审查问题「核实签署版原委托的范围与排除项：是否仅限银行监管申报、是否明确排除融资文件与交易谈判」已保存工作记录；填写人 演示复核人（虚构验收）（身份未验证）。
- 2026-11-01T01:57:04.333Z · decision-recorded · 人工审查状态：待补充材料；填写人：演示复核人（虚构验收）（身份未验证）；说明：【软件验收记录】公开企业身份与模型工具流程已核对，尚缺签署版委托范围、客户边界及保密安排说明；本案保留待补充材料，不形成收案批准或实际法律结论。。此记录不批准收案，也不发送通知。
- 2026-11-01T01:57:08.732Z · decision-invalidated · 旧审查状态 needs-information（修订 6，填写人 演示复核人（虚构验收），说明 【软件验收记录】公开企业身份与模型工具流程已核对，尚缺签署版委托范围、客户边界及保密安排说明；本案保留待补充材料，不形成收案批准或实际法律结论。）已失效：导入「DEMO-2026-014 委托范围说明（虚构）」v2；旧版原文和引用保留，新版尚未授权 AI。
- 2026-11-01T01:57:08.732Z · material-evidence-updated · 导入「DEMO-2026-014 委托范围说明（虚构）」v2；旧版原文和引用保留，新版尚未授权 AI。

## 实际 MCP 调用轨迹

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：98f5acfd-fcb7-4487-80c8-0dfdebddb634
- 发起方：规则编排
- 时间：2026-11-01T01:52:53.160Z；耗时：1476 ms；状态：success

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
      "fetchedAt": "2026-11-01T01:52:54.631Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:53.162Z",
            "durationMs": 1469,
            "status": 200
          }
        ],
        "durationMs": 1469
      }
    ]
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：c9bf7d6f-c53c-4168-b22a-b9806f6f8d98
- 发起方：规则编排
- 时间：2026-11-01T01:52:54.639Z；耗时：16 ms；状态：success

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

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：0a113432-641b-4d31-b151-18f8a7c259db
- 发起方：规则编排
- 时间：2026-11-01T01:52:54.661Z；耗时：1157 ms；状态：success

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
          "fetchedAt": "2026-11-01T01:52:55.129Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-11-01T01:52:55.129Z"
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
          "fetchedAt": "2026-11-01T01:52:55.808Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-11-01T01:52:55.808Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:54.662Z",
            "durationMs": 467,
            "status": 200
          }
        ],
        "durationMs": 467
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:54.662Z",
            "durationMs": 1146,
            "status": 200
          }
        ],
        "durationMs": 1146
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：20e91205-e346-4fe2-bf5c-12787707b532
- 发起方：规则编排
- 时间：2026-11-01T01:52:55.820Z；耗时：1 ms；状态：success

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

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：478a0328-ae41-4f65-99f5-c25e01cb034a
- 发起方：模型工具调用
- 时间：2026-11-01T01:52:57.812Z；耗时：771 ms；状态：success

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
      "fetchedAt": "2026-11-01T01:52:58.583Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:57.813Z",
            "durationMs": 770,
            "status": 200
          }
        ],
        "durationMs": 770
      }
    ]
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：4f9fb6cc-89d6-4d86-8469-6967fd6d7a10
- 发起方：模型工具调用
- 时间：2026-11-01T01:52:58.586Z；耗时：1126 ms；状态：success

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
          "fetchedAt": "2026-11-01T01:52:59.029Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-11-01T01:52:59.029Z"
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
          "fetchedAt": "2026-11-01T01:52:59.711Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-11-01T01:52:59.711Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:58.586Z",
            "durationMs": 443,
            "status": 200
          }
        ],
        "durationMs": 443
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:58.586Z",
            "durationMs": 1125,
            "status": 200
          }
        ],
        "durationMs": 1125
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：960672a2-3d73-4177-881d-8749898d46ff
- 发起方：模型工具调用
- 时间：2026-11-01T01:52:59.715Z；耗时：451 ms；状态：success

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
      "fetchedAt": "2026-11-01T01:53:00.166Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:59.715Z",
            "durationMs": 451,
            "status": 200
          }
        ],
        "durationMs": 451
      }
    ]
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：8343282d-281b-4a67-987d-fa9693d5c211
- 发起方：模型工具调用
- 时间：2026-11-01T01:53:00.169Z；耗时：1232 ms；状态：success

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
            "startedAt": "2026-11-01T01:53:00.169Z",
            "durationMs": 423,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 423
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:53:00.169Z",
            "durationMs": 1231,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 1231
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：a526d2f8-a946-406d-95fe-3f455f0ea564
- 发起方：模型工具调用
- 时间：2026-11-01T01:53:01.404Z；耗时：1 ms；状态：success

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

- 核查编号：0a4944a6-5c00-460a-bddb-91da731069a9；调用编号：a9e5493b-278c-4982-8f3c-0402ee49b84f
- 发起方：模型工具调用
- 时间：2026-11-01T01:53:01.407Z；耗时：1 ms；状态：success

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

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：de46a5a7-0f42-45c9-8b8e-9182f7cddb6e
- 发起方：规则编排
- 时间：2026-11-01T01:52:53.162Z；耗时：2291 ms；状态：success

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
      "fetchedAt": "2026-11-01T01:52:55.453Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:53.165Z",
            "durationMs": 2288,
            "status": 200
          }
        ],
        "durationMs": 2288
      }
    ]
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：9b2debe4-f474-4e4e-bff0-5c21a7016302
- 发起方：规则编排
- 时间：2026-11-01T01:52:55.455Z；耗时：1 ms；状态：success

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

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：37782617-373e-46f8-adad-08416e39f507
- 发起方：规则编排
- 时间：2026-11-01T01:52:55.458Z；耗时：451 ms；状态：success

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
          "fetchedAt": "2026-11-01T01:52:55.906Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-11-01T01:52:55.906Z"
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
          "fetchedAt": "2026-11-01T01:52:55.909Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-11-01T01:52:55.909Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:55.458Z",
            "durationMs": 448,
            "status": 200
          }
        ],
        "durationMs": 448
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:55.459Z",
            "durationMs": 450,
            "status": 200
          }
        ],
        "durationMs": 450
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：c63114a8-0d23-487d-b405-da4a063f4cd6
- 发起方：规则编排
- 时间：2026-11-01T01:52:55.911Z；耗时：1 ms；状态：success

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

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：a1fdccc9-50ff-442b-9178-be88ff3a7cef
- 发起方：模型工具调用
- 时间：2026-11-01T01:52:57.762Z；耗时：769 ms；状态：success

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
      "fetchedAt": "2026-11-01T01:52:58.531Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:57.762Z",
            "durationMs": 769,
            "status": 200
          }
        ],
        "durationMs": 769
      }
    ]
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：02411906-4385-4d81-a7d3-e91bb2ddfa76
- 发起方：模型工具调用
- 时间：2026-11-01T01:52:58.534Z；耗时：1237 ms；状态：success

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
          "fetchedAt": "2026-11-01T01:52:58.976Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-11-01T01:52:58.976Z"
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
          "fetchedAt": "2026-11-01T01:52:59.771Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-11-01T01:52:59.771Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:58.534Z",
            "durationMs": 442,
            "status": 200
          }
        ],
        "durationMs": 442
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:58.535Z",
            "durationMs": 1236,
            "status": 200
          }
        ],
        "durationMs": 1236
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · gleif / get_entity

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：3648a3da-93c7-4e0b-8416-c13b2f116769
- 发起方：模型工具调用
- 时间：2026-11-01T01:52:59.774Z；耗时：443 ms；状态：success

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
      "fetchedAt": "2026-11-01T01:53:00.216Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:52:59.774Z",
            "durationMs": 442,
            "status": 200
          }
        ],
        "durationMs": 442
      }
    ]
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：ea015f95-0da5-4887-b2bc-f36c7e359491
- 发起方：模型工具调用
- 时间：2026-11-01T01:53:00.218Z；耗时：1220 ms；状态：success

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
            "startedAt": "2026-11-01T01:53:00.218Z",
            "durationMs": 1220,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 1220
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-11-01T01:53:00.219Z",
            "durationMs": 420,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 420
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：734edc69-f3ff-48af-946d-d253e0cd9267
- 发起方：模型工具调用
- 时间：2026-11-01T01:53:01.440Z；耗时：1 ms；状态：success

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

- 核查编号：5ac8fd8f-2ad4-487e-97aa-decbdb7a36d8；调用编号：67cd7056-0258-4191-af6c-cc753ef0a2c8
- 发起方：模型工具调用
- 时间：2026-11-01T01:53:01.443Z；耗时：0 ms；状态：success

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


## 材料版本与原文依据

- DEMO-2026-014 委托范围说明（虚构） · v2 · 2 页 · SHA-256 656d8290d6eb7c9d3108b3a5479c39377dbb167e8c5cb577ea2e7ed2e599579d · 当前版本 · 编号 9d27f69b-8d2a-4b58-a876-1002711d3ce9
- DEMO-2026-014 委托范围说明（虚构） · v1 · 2 页 · SHA-256 e33e05dc54c4127833748d402aff7fa13780165ab763f411d59abf715972af3f · 旧版保留 · 编号 fd2c161b-e7dc-4263-afc7-677509f0bde7


## 材料 AI 复核与真实 MCP 调用



## 审查问题与处理意见

### 核实签署版原委托的范围与排除项：是否仅限银行监管申报、是否明确排除融资文件与交易谈判

类别：委托范围；状态：stale；责任人：演示复核人（虚构验收）

待补：实际签署的委托书或委托范围说明（含签署方、签署日期、生效与终止条款）；范围条款与排除条款原文；任何对排除项作出变更的补充协议或书面变更记录；事项编号与文件版本对照表。

意见：【虚构软件验收人工记录】已逐页核对示例 PDF，原文确实包含监管申报范围和融资文件排除项。本次只验证依据追溯与审查流程；签署版及变更文件尚缺，保留复核中，不据此判断实际委托或是否承接。

【虚构软件验收草稿，未发送】请提供 DEMO-2026-014 实际签署的委托范围文件及全部补充协议，明确融资文件审阅与交易谈判是否属于服务范围，并列明签署主体、适用期间和版本沿革。请同时说明本次拟委托人与文件所列 HSBC BANK PLC 的关系；未取得材料前保留待核实状态。

历史意见 0 次；原文依据 2 条；待复核材料变更 1 份
