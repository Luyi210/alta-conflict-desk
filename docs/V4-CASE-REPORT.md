# 案件级收案审查记录

- 案件：产品体验验收 · 融资专项（虚构）
- 案件编号：745ef599-51c2-4b47-9199-d72d71636d72
- 修订：3
- 创建：2026-10-30T14:00:50.827Z；更新：2026-10-30T14:01:16.999Z
- 事项背景：演示事项：拟为 HSBC UK BANK PLC 提供融资文件专项服务，交易对方为 HSBC BANK PLC。核实双方及已披露母公司是否命中本所既有事项，并由律师复核委托范围及保密义务。企业身份公开，委托关系与事项全部虚构。
- 司法辖区（仅作背景）：中国香港（事项背景）
- 执行模式：AI 辅助核查，实际完成情况见每个主体的模型状态及调用轨迹
- 覆盖进度：2/2 个主体来源核查完整，2 个身份已确认。

> 本原型的内部事项及律师姓名全部为虚构数据；公开企业名称与 LEI 不代表真实委托关系。系统生成核查线索和补证清单，不自动判断法律利益冲突，也不批准收案。GLEIF 母公司关系采用会计合并口径，不是完整股权、控制或法律关联图谱。未命中不等于不存在利益冲突。

## 主体清单与覆盖

### 拟委托人 · HSBC UK BANK PLC

- 主体编号：aca6a590-eb88-4b17-bbcf-d9c4668c72b8
- 身份：已选择确认；LEI 21380081EP12LC86CB82
- 当前核查：b14d9ca4-bea4-4a82-9a54-88798e63a9f6 / completed
- 实际取得主体：HSBC UK BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。
- 模型执行：completed；模型 deepseek-flash；工具调用 6 次；2 轮。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82)；获取时间 2026-10-30T14:00:52.465Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent)；获取时间 2026-10-30T14:00:52.885Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent)；获取时间 2026-10-30T14:00:52.886Z。

### 交易对方 · HSBC BANK PLC

- 主体编号：59370c64-e1c4-4a2a-8c9d-cffd068d82e0
- 身份：已选择确认；LEI MP6I5ZYZBEU3UXPYFY54
- 当前核查：b22232b1-40db-4df1-9b33-4ba9341b7f47 / completed
- 实际取得主体：HSBC BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。
- 模型执行：completed；模型 deepseek-flash；工具调用 6 次；2 轮。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54)；获取时间 2026-10-30T14:00:52.474Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent)；获取时间 2026-10-30T14:00:55.473Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent)；获取时间 2026-10-30T14:01:04.739Z。

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

- 核查 / 线索编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6 / fcf4f884-0fb6-4508-a9a2-a554eeaa972f
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK PLC 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：972253d8-2a48-4aa7-b043-13bd7835dcaf、932a8f79-28a1-4ef2-b3c4-60e63e4ce659

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6 / 22e85bc3-7432-4897-a366-f48217d06594
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：972253d8-2a48-4aa7-b043-13bd7835dcaf、932a8f79-28a1-4ef2-b3c4-60e63e4ce659

### HSBC UK BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6 / 7f82084b-c22b-4f6b-b91e-8fab11a0769b
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：972253d8-2a48-4aa7-b043-13bd7835dcaf、054f1399-9dcd-49c2-af8b-b836f9654dc2、334bc9da-ca24-421f-b5d0-783c47a0a9ab

### HSBC BANK PLC · 同一主体出现在既有事项

- 核查 / 线索编号：b22232b1-40db-4df1-9b33-4ba9341b7f47 / f5af242d-b31f-48c4-ab41-c606513f6628
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：exact-lei；线索类型：direct
- 说明：LEI 与虚构台账 DEMO-2026-014 完全一致。请核实委托范围与在办义务。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：bdf6a6b5-7da5-41e9-b6da-a06c3010eda1、e0c5ae9a-2e14-401a-bacd-58bad49b77f9

### HSBC BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：b22232b1-40db-4df1-9b33-4ba9341b7f47 / 5a5f45bf-ceea-4d20-81e1-9d12e34ab3c5
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：bdf6a6b5-7da5-41e9-b6da-a06c3010eda1、e0c5ae9a-2e14-401a-bacd-58bad49b77f9

### HSBC BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：b22232b1-40db-4df1-9b33-4ba9341b7f47 / 08f70837-0af9-4ece-b1a4-6e5779c84d64
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：bdf6a6b5-7da5-41e9-b6da-a06c3010eda1、0d17485d-2544-48d6-bdfd-c7feae9fddc9、2e1dd7e4-a6e4-4fe4-b40d-88bad52e1d55

## 案件级人工意见

- 状态：草稿
- 对应修订：3
- 填写人（手工输入，身份未验证）：未填写
- 说明：未填写
- 记录时间：未记录

### 主体：HSBC UK BANK PLC

## AI 核查简报

AI 摘要（待律师核对）：
GLEIF确认HSBC UK BANK PLC（21380081EP12LC86CB82）及其直接/最终母公司HSBC HOLDINGS PLC（MLU0ZO3ML4LN2LL2TL39）均为GB存续实体；后者母公司关系查询返回404缺口。台账检索中：本主体仅有同名/近似名线索，无 exact-LEI 命中；母公司有一件 exact-LEI 已结案事项，身份可据 LEI 确认，但范围和保密义务待律师复核。

引用调用：97356faf-cdd0-45c7-bee8-7179ba9b933f、5efb5ed0-e0fc-470a-b24a-3136e5dfa6f3、df8c2c59-48e3-42a9-a094-021ce614a51f、3e112a4b-9a6f-419d-b7de-f25d25a13650、1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c、c749d4bf-f860-4946-90f0-b80722dbdf8f

### 来源记录（直接由实际工具字段整理）

- 登记主体：HSBC UK BANK PLC；LEI 21380081EP12LC86CB82；辖区 GB；状态 ACTIVE。（来源调用：97356faf-cdd0-45c7-bee8-7179ba9b933f）
- 直接会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：5efb5ed0-e0fc-470a-b24a-3136e5dfa6f3）
- 最终会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：5efb5ed0-e0fc-470a-b24a-3136e5dfa6f3）
- 登记主体：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39；辖区 GB；状态 ACTIVE。（来源调用：df8c2c59-48e3-42a9-a094-021ce614a51f）
- DEMO-2026-014 · HSBC BANK PLC：仅名称匹配，身份未确认；事项「银行监管咨询（虚构）」；现有客户，进行中。（来源调用：1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c）
- DEMO-2026-027 · HSBC BANK SERVICES LIMITED：仅名称匹配，身份未确认；事项「信息技术采购咨询（虚构）」；待识别记录，进行中。（来源调用：1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c）
- DEMO-2025-038 · HSBC HOLDINGS PLC：LEI 一致；事项「集团治理专项（虚构）」；既往客户，已结案。（来源调用：c749d4bf-f860-4946-90f0-b80722dbdf8f）

### 律师待核实

- 台账 demo-1（DEMO-2026-014）客户为 HSBC BANK PLC（LEI MP6I5ZYZBEU3UXPYFY54），与本次拟委托人 HSBC UK BANK PLC 的 LEI 不同，仅同名/近似名；需核实 demo-1 的实际客户身份、委托范围，以及是否与拟设融资专项存在范围重叠或保密义务牵连。（来源调用：1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c）
- 台账 demo-3（DEMO-2026-027，HSBC BANK SERVICES LIMITED，无 LEI）为名称近似误报线索，需人工核对其真实主体身份以决定是否排除，并确认其与拟委托人的关系。（来源调用：1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c）
- 母公司 HSBC HOLDINGS PLC 在 demo-2（DEMO-2025-038，集团治理专项，已结案）为既往客户（exact-LEI）；需核实该事项的委托范围、结案后持续保密义务，以及母子公司关系在拟设融资专项中是否引发需律师评估的问题（不据此作冲突结论）。（来源调用：c749d4bf-f860-4946-90f0-b80722dbdf8f、df8c2c59-48e3-42a9-a094-021ce614a51f）

### 建议下一步

- 调取 demo-1、demo-3、demo-2 三份事项的立案表、委托书与委托范围条款及结案文件，比对拟设融资专项的服务范围，形成范围重叠分析供律师判断。（来源调用：1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c、c749d4bf-f860-4946-90f0-b80722dbdf8f）
- 请拟委托人提供其与其他 HSBC 系实体（含交易对方 HSBC BANK PLC、LEI MP6I5ZYZBEU3UXPYFY54）的关系说明及主体清单，用于逐主体 screening 与身份确认（以 exact-LEI 为准，名称近似不作为身份依据）。（来源调用：97356faf-cdd0-45c7-bee8-7179ba9b933f）
- 核实 GLEIF 对 HSBC HOLDINGS PLC 母公司关系的 404 缺口，并确认其上层是否存在需另行核查的实体；同时明确本次核查仅覆盖上述两个 LEI，其他主体须另行核查。（来源调用：3e112a4b-9a6f-419d-b7de-f25d25a13650、5efb5ed0-e0fc-470a-b24a-3136e5dfa6f3）

### 主体：HSBC BANK PLC

## AI 核查简报

AI 摘要（待律师核对）：
已按 GLEIF 核实：交易对方 HSBC BANK PLC（LEI MP6I5ZYZBEU3UXPYFY54）状态为 ACTIVE，其 GLEIF 披露的直接与最终母公司均为 HSBC HOLDINGS PLC（LEI MLU0ZO3ML4LN2LL2TL39，ACTIVE）；该母公司向上母公司查询返回 404 缺口。台账核查：交易对方以 exact-lei 命中一项进行中事项（DEMO-2026-014），另有一项同名但无 LEI 的近似记录（DEMO-2026-027）待人工排除；母公司以 exact-lei 命中一项已结案事项（DEMO-2025-038）。上述均仅为证据，不构成任何冲突或可收案结论。

引用调用：f8770493-b654-4984-af12-d0f9aca56604、0a39cc07-7531-4d1c-9b13-0f39dd0d4c39、e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb、e90f6c8b-0ff8-4706-8577-d722fd45259f、77f34b4e-2ab1-44c1-8442-c910ad46dc26、e210d7e5-87d7-4ef7-a6e7-01be0a7e7ffd

### 来源记录（直接由实际工具字段整理）

- 登记主体：HSBC BANK PLC；LEI MP6I5ZYZBEU3UXPYFY54；辖区 GB；状态 ACTIVE。（来源调用：f8770493-b654-4984-af12-d0f9aca56604）
- 直接会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：0a39cc07-7531-4d1c-9b13-0f39dd0d4c39）
- 最终会计合并母公司：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39。关系口径不等于全部法律关联。（来源调用：0a39cc07-7531-4d1c-9b13-0f39dd0d4c39）
- 登记主体：HSBC HOLDINGS PLC；LEI MLU0ZO3ML4LN2LL2TL39；辖区 GB；状态 ACTIVE。（来源调用：e90f6c8b-0ff8-4706-8577-d722fd45259f）
- DEMO-2026-014 · HSBC BANK PLC：LEI 一致；事项「银行监管咨询（虚构）」；现有客户，进行中。（来源调用：e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb）
- DEMO-2026-027 · HSBC BANK SERVICES LIMITED：仅名称匹配，身份未确认；事项「信息技术采购咨询（虚构）」；待识别记录，进行中。（来源调用：e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb）
- DEMO-2025-038 · HSBC HOLDINGS PLC：LEI 一致；事项「集团治理专项（虚构）」；既往客户，已结案。（来源调用：e210d7e5-87d7-4ef7-a6e7-01be0a7e7ffd）

### 律师待核实

- 拟委托人 HSBC UK BANK PLC 未在本次核查范围内，请确认其 LEI 与身份（本次工具仅覆盖交易对方 HSBC BANK PLC 及母公司），并确认其是否需另行单主体核查。（复核建议，尚未核实）
- 既有事项 DEMO-2026-014（银行监管咨询，进行中，委托人 HSBC BANK PLC，exact-lei）的委托范围、保密承诺是否覆盖本次融资文件专项及交易对方角色，是否需取得同意或设置信息隔离？（来源调用：e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb）
- 母公司既往已结案事项 DEMO-2025-038 的保密义务与信息使用限制，以及近似名称记录 DEMO-2026-027（无 LEI，HSBC BANK SERVICES LIMITED）是否实为同一或相关主体，均需律师人工核实。（来源调用：e210d7e5-87d7-4ef7-a6e7-01be0a7e7ffd、e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb）

### 建议下一步

- 向拟委托人及交易对方索取 LEI 与注册全称资料，并对 HSBC UK BANK PLC 启动单独单主体核查（本工具范围不允许在此处理该主体）。（复核建议，尚未核实）
- 调取 DEMO-2026-014 的委托书、业务范围与保密条款，由承办律师评估本次融资专项是否落入其范围，并记录判断依据。（来源调用：e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb）
- 补充检索 GLEIF 母公司 MLU0ZO3ML4LN2LL2TL39 上级母公司查询的 404 缺口，并索取 HSBC BANK SERVICES LIMITED 公司登记资料以排除同名误报。（来源调用：77f34b4e-2ab1-44c1-8442-c910ad46dc26、e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb）


## 活动与旧意见失效记录

- 2026-10-30T14:00:50.830Z · created · 创建案件；2 个已确认主体开始核查，0 个主体待补充身份。
- 2026-10-30T14:01:03.678Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-10-30T14:01:16.997Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。

## 实际 MCP 调用轨迹

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：972253d8-2a48-4aa7-b043-13bd7835dcaf
- 发起方：规则编排
- 时间：2026-10-30T14:00:50.829Z；耗时：1636 ms；状态：success

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
      "fetchedAt": "2026-10-30T14:00:52.465Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:50.830Z",
            "durationMs": 1635,
            "status": 200
          }
        ],
        "durationMs": 1635
      }
    ]
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：932a8f79-28a1-4ef2-b3c4-60e63e4ce659
- 发起方：规则编排
- 时间：2026-10-30T14:00:52.473Z；耗时：8 ms；状态：success

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

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：054f1399-9dcd-49c2-af8b-b836f9654dc2
- 发起方：规则编排
- 时间：2026-10-30T14:00:52.484Z；耗时：422 ms；状态：success

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
          "fetchedAt": "2026-10-30T14:00:52.885Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-10-30T14:00:52.885Z"
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
          "fetchedAt": "2026-10-30T14:00:52.886Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-10-30T14:00:52.886Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:52.485Z",
            "durationMs": 400,
            "status": 200
          }
        ],
        "durationMs": 400
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:52.486Z",
            "durationMs": 400,
            "status": 200
          }
        ],
        "durationMs": 400
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：334bc9da-ca24-421f-b5d0-783c47a0a9ab
- 发起方：规则编排
- 时间：2026-10-30T14:00:52.908Z；耗时：1 ms；状态：success

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

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：97356faf-cdd0-45c7-bee8-7179ba9b933f
- 发起方：模型工具调用
- 时间：2026-10-30T14:00:54.990Z；耗时：769 ms；状态：success

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
      "fetchedAt": "2026-10-30T14:00:55.757Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:54.991Z",
            "durationMs": 766,
            "status": 200
          }
        ],
        "durationMs": 766
      }
    ]
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：5efb5ed0-e0fc-470a-b24a-3136e5dfa6f3
- 发起方：模型工具调用
- 时间：2026-10-30T14:00:55.764Z；耗时：395 ms；状态：success

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
          "fetchedAt": "2026-10-30T14:00:56.159Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-10-30T14:00:56.159Z"
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
          "fetchedAt": "2026-10-30T14:00:56.158Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-10-30T14:00:56.158Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:55.764Z",
            "durationMs": 395,
            "status": 200
          }
        ],
        "durationMs": 395
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:55.765Z",
            "durationMs": 393,
            "status": 200
          }
        ],
        "durationMs": 393
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · gleif / get_entity

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：df8c2c59-48e3-42a9-a094-021ce614a51f
- 发起方：模型工具调用
- 时间：2026-10-30T14:00:56.164Z；耗时：412 ms；状态：success

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
      "fetchedAt": "2026-10-30T14:00:56.575Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:56.165Z",
            "durationMs": 410,
            "status": 200
          }
        ],
        "durationMs": 410
      }
    ]
  }
}
```

### HSBC UK BANK PLC · gleif / get_relationships

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：3e112a4b-9a6f-419d-b7de-f25d25a13650
- 发起方：模型工具调用
- 时间：2026-10-30T14:00:56.581Z；耗时：381 ms；状态：success

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
            "startedAt": "2026-10-30T14:00:56.582Z",
            "durationMs": 377,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 378
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:56.582Z",
            "durationMs": 379,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 379
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：1ad76c3b-0179-42b8-8aca-f2e4c0b4c91c
- 发起方：模型工具调用
- 时间：2026-10-30T14:00:56.969Z；耗时：3 ms；状态：success

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

- 核查编号：b14d9ca4-bea4-4a82-9a54-88798e63a9f6；调用编号：c749d4bf-f860-4946-90f0-b80722dbdf8f
- 发起方：模型工具调用
- 时间：2026-10-30T14:00:56.976Z；耗时：1 ms；状态：success

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

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：bdf6a6b5-7da5-41e9-b6da-a06c3010eda1
- 发起方：规则编排
- 时间：2026-10-30T14:00:50.830Z；耗时：1644 ms；状态：success

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
      "fetchedAt": "2026-10-30T14:00:52.474Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:50.832Z",
            "durationMs": 1642,
            "status": 200
          }
        ],
        "durationMs": 1642
      }
    ]
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：e0c5ae9a-2e14-401a-bacd-58bad49b77f9
- 发起方：规则编排
- 时间：2026-10-30T14:00:52.478Z；耗时：6 ms；状态：success

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

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：0d17485d-2544-48d6-bdfd-c7feae9fddc9
- 发起方：规则编排
- 时间：2026-10-30T14:00:52.487Z；耗时：12253 ms；状态：success

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
          "fetchedAt": "2026-10-30T14:00:55.473Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-10-30T14:00:55.473Z"
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
          "fetchedAt": "2026-10-30T14:01:04.738Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-10-30T14:01:04.739Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:52.488Z",
            "durationMs": 2985,
            "status": 200
          }
        ],
        "durationMs": 2985
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:00:52.490Z",
            "durationMs": 12248,
            "status": 200
          }
        ],
        "durationMs": 12248
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：2e1dd7e4-a6e4-4fe4-b40d-88bad52e1d55
- 发起方：规则编排
- 时间：2026-10-30T14:01:04.744Z；耗时：1 ms；状态：success

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

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：f8770493-b654-4984-af12-d0f9aca56604
- 发起方：模型工具调用
- 时间：2026-10-30T14:01:06.559Z；耗时：2209 ms；状态：success

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
      "fetchedAt": "2026-10-30T14:01:08.767Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:01:06.560Z",
            "durationMs": 2207,
            "status": 200
          }
        ],
        "durationMs": 2207
      }
    ]
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：0a39cc07-7531-4d1c-9b13-0f39dd0d4c39
- 发起方：模型工具调用
- 时间：2026-10-30T14:01:08.775Z；耗时：1614 ms；状态：success

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
          "fetchedAt": "2026-10-30T14:01:09.176Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-10-30T14:01:09.176Z"
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
          "fetchedAt": "2026-10-30T14:01:10.388Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-10-30T14:01:10.388Z"
      }
    ],
    "gaps": [],
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:01:08.776Z",
            "durationMs": 400,
            "status": 200
          }
        ],
        "durationMs": 400
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:01:08.776Z",
            "durationMs": 1612,
            "status": 200
          }
        ],
        "durationMs": 1612
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：e37b30d7-4973-4ce9-b9c4-c332d4c9fcfb
- 发起方：模型工具调用
- 时间：2026-10-30T14:01:10.396Z；耗时：1 ms；状态：success

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

### HSBC BANK PLC · gleif / get_entity

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：e90f6c8b-0ff8-4706-8577-d722fd45259f
- 发起方：模型工具调用
- 时间：2026-10-30T14:01:10.401Z；耗时：392 ms；状态：success

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
      "fetchedAt": "2026-10-30T14:01:10.793Z"
    },
    "network": [
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:01:10.402Z",
            "durationMs": 391,
            "status": 200
          }
        ],
        "durationMs": 391
      }
    ]
  }
}
```

### HSBC BANK PLC · gleif / get_relationships

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：77f34b4e-2ab1-44c1-8442-c910ad46dc26
- 发起方：模型工具调用
- 时间：2026-10-30T14:01:10.798Z；耗时：399 ms；状态：success

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
            "startedAt": "2026-10-30T14:01:10.799Z",
            "durationMs": 388,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 388
      },
      {
        "url": "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39/ultimate-parent",
        "attempts": [
          {
            "number": 1,
            "startedAt": "2026-10-30T14:01:10.799Z",
            "durationMs": 397,
            "status": 404,
            "error": "Error"
          }
        ],
        "durationMs": 397
      }
    ],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：b22232b1-40db-4df1-9b33-4ba9341b7f47；调用编号：e210d7e5-87d7-4ef7-a6e7-01be0a7e7ffd
- 发起方：模型工具调用
- 时间：2026-10-30T14:01:11.202Z；耗时：2 ms；状态：success

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
