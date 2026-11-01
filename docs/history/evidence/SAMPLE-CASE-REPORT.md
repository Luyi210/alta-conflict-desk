# 案件级收案审查记录

- 案件：澄川科技 · 跨境融资收案审查（虚构）
- 案件编号：aa8fae39-7313-49f0-ab72-69b02d92f222
- 修订：5
- 创建：2026-10-27T07:53:53.622Z；更新：2026-10-27T07:58:10.459Z
- 事项背景：演示事项：拟为澄川科技提供融资交易法律服务，核实交易对方与担保方是否命中律所既有或历史事项。委托关系与事项均为虚构。需补充拟委托人的注册资料和各方委托范围。
- 司法辖区（仅作背景）：中国香港（事项背景）
- 执行模式：规则预览，真实 MCP 调用；不代表 AI 模型实跑
- 覆盖进度：2/3 个主体来源核查完整，2 个身份已确认。

> 本原型的内部事项及律师姓名全部为虚构数据；公开企业名称与 LEI 不代表真实委托关系。系统生成核查线索和补证清单，不自动判断法律利益冲突，也不批准收案。GLEIF 母公司关系采用会计合并口径，不是完整股权、控制或法律关联图谱。未命中不等于不存在利益冲突。

## 主体清单与覆盖

### 拟委托人 · 澄川科技有限公司（虚构）

- 主体编号：6a8c59f0-b8fb-40e6-873b-197abf6abc7c
- 身份：未确认，尚未核查
- 当前核查：无

### 交易对方 · HSBC BANK PLC

- 主体编号：d1c411d2-85e3-4f70-898c-bbb14071cac3
- 身份：已选择确认；LEI MP6I5ZYZBEU3UXPYFY54
- 当前核查：be2d756e-a50b-4c9c-8e80-16b877076379 / completed
- 实际取得主体：HSBC BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54)；获取时间 2026-10-27T07:53:55.401Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent)；获取时间 2026-10-27T07:53:56.822Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent)；获取时间 2026-10-27T07:53:56.794Z。

### 担保方 · HSBC UK BANK PLC

- 主体编号：11822fc8-d4de-4da1-8f41-b3b864fe96f5
- 身份：已选择确认；LEI 21380081EP12LC86CB82
- 当前核查：01539fd7-6574-4028-8ac7-fbd4712c19e3 / completed
- 实际取得主体：HSBC UK BANK PLC
- 发现 3 条核查线索。结论仅限已列明的来源与核查范围。

**范围与缺口**

- 本次单主体核查仅覆盖所选企业及 GLEIF 披露的直接/最终母公司；其他主体须查看案件覆盖清单，事项背景字段不等于已核验身份。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

**来源**

- [所选主体登记记录](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82)；获取时间 2026-10-27T07:53:55.390Z。来源是否成功返回以调用轨迹为准。
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent)；获取时间 2026-10-27T07:53:55.879Z。
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent)；获取时间 2026-10-27T07:53:55.898Z。

## 当前阻塞项

- 「澄川科技有限公司（虚构）」身份未确认
- 5 条线索仍待复核或进一步复核
- 3 项委托范围或保密补证尚未补齐

## 补证清单（跨主体合并）

### 确认主体：澄川科技有限公司（虚构）

- 编号：identity-f27dca6b30239c89736d；种类：identity；状态：待补充（系统根据身份/来源状态管理）
- 涉及主体：澄川科技有限公司（虚构）
- 要求：请搜索并确认登记身份。未取得可靠身份前，该主体不计入已核查范围。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

### 核实委托范围 · DEMO-2026-014

- 编号：scope-4e40087843ab66349b2c；种类：scope；状态：已补齐
- 涉及主体：HSBC BANK PLC、HSBC UK BANK PLC
- 要求：核实「银行监管咨询（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。记录命中或公司关联不自动构成法律冲突。
- 核实说明：演示复核：已记录示例银行监管咨询的事项范围，实际是否冲突仍需核实完整事实。
- 材料引用（文本记录，不表示文件上传或真实性验证）：虚构材料 DEMO-INTAKE-01，第 2 页（仅演示引用，未上传）
- 更新：2026-10-27T07:54:19.284Z

### 核实委托范围 · DEMO-2025-038

- 编号：scope-057a483887f4046f45a4；种类：scope；状态：待补充
- 涉及主体：HSBC BANK PLC、HSBC UK BANK PLC
- 要求：核实「集团治理专项（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。记录命中或公司关联不自动构成法律冲突。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

### 核实既往保密义务 · DEMO-2025-038

- 编号：confidentiality-057a483887f4046f45a4；种类：confidentiality；状态：待补充
- 涉及主体：HSBC BANK PLC、HSBC UK BANK PLC
- 要求：核实「集团治理专项（虚构）」已取得的保密信息及相关义务；请填写核实说明与材料引用，不在此表披露保密内容。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

### 核实委托范围 · DEMO-2026-027

- 编号：scope-f09377ae7b9dc48c545f；种类：scope；状态：待补充
- 涉及主体：HSBC UK BANK PLC
- 要求：核实「信息技术采购咨询（虚构）」涉及的身份、委托范围及与本事项的关系，记录材料引用。当前仅名称相似，须先确认是否同一主体。
- 核实说明：未填写
- 材料引用（文本记录，不表示文件上传或真实性验证）：未填写
- 更新：尚未补录

## 核查线索与人工复核

### HSBC BANK PLC · 同一主体出现在既有事项

- 核查 / 线索编号：be2d756e-a50b-4c9c-8e80-16b877076379 / 9121cbbc-b2a6-41b3-bb29-d4d667636761
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：exact-lei；线索类型：direct
- 说明：LEI 与虚构台账 DEMO-2026-014 完全一致。请核实委托范围与在办义务。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：cfd84bc2-0535-477f-8164-7102092312e3、e75579f2-ef70-4b04-86f8-fd1ebb8dcbe8

### HSBC BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：be2d756e-a50b-4c9c-8e80-16b877076379 / 359ea810-c85f-418d-9349-bb0a5e816bcb
- 涉及实体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：已排除此线索；演示排除：仅测试人工复核保存。虚构台账中的服务公司名称与已确认银行实体不同；实际业务需另查注册资料。
- 复核时间：2026-10-27T07:58:10.438Z
- 证据调用编号：cfd84bc2-0535-477f-8164-7102092312e3、e75579f2-ef70-4b04-86f8-fd1ebb8dcbe8

### HSBC BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：be2d756e-a50b-4c9c-8e80-16b877076379 / 3641cefe-0397-4d8d-8781-39764a31a2e5
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：cfd84bc2-0535-477f-8164-7102092312e3、9ddf657a-3752-489a-9846-7bc5267f2b61、54e12aa5-32e3-4b74-afed-a874c762f4d9

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：01539fd7-6574-4028-8ac7-fbd4712c19e3 / 4297945c-6a4f-4fc3-949c-d935e340c827
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：银行监管咨询（虚构） / DEMO-2026-014
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK PLC 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：0f949a7f-61ec-4fb4-bb1b-b18c36cd8053、7b875f89-9865-45a9-8382-a701656638fc

### HSBC UK BANK PLC · 近似/同名记录，身份待确认

- 核查 / 线索编号：01539fd7-6574-4028-8ac7-fbd4712c19e3 / 6d136536-9c22-4904-b5db-47260a6913b7
- 涉及实体：HSBC UK BANK PLC / 21380081EP12LC86CB82
- 虚构事项：信息技术采购咨询（虚构） / DEMO-2026-027
- 匹配依据：similar-name；线索类型：similar
- 说明：仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：0f949a7f-61ec-4fb4-bb1b-b18c36cd8053、7b875f89-9865-45a9-8382-a701656638fc

### HSBC UK BANK PLC · 公开母公司出现在既有事项

- 核查 / 线索编号：01539fd7-6574-4028-8ac7-fbd4712c19e3 / 8ca363b8-9742-4d93-89c1-3613e574001d
- 涉及实体：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39
- 虚构事项：集团治理专项（虚构） / DEMO-2025-038
- 匹配依据：exact-lei；线索类型：related
- 说明：公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。
- 人工复核：待复核；尚未填写理由
- 复核时间：尚未复核
- 证据调用编号：0f949a7f-61ec-4fb4-bb1b-b18c36cd8053、85049dd9-6887-440e-903f-1769c31d8e48、53480b23-c913-49af-9ae1-972a01a68612

## 案件级人工意见

- 状态：草稿
- 对应修订：5
- 填写人（手工输入，身份未验证）：未填写
- 说明：未填写
- 记录时间：未记录

## 活动与旧意见失效记录

- 2026-10-27T07:53:53.626Z · created · 创建案件；2 个已确认主体开始核查，1 个主体待补充身份。
- 2026-10-27T07:53:56.791Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-10-27T07:53:58.005Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-10-27T07:54:19.284Z · task-updated · 补证「核实委托范围 · DEMO-2026-014」更新为已补齐；说明：演示复核：已记录示例银行监管咨询的事项范围，实际是否冲突仍需核实完整事实。；材料引用：虚构材料 DEMO-INTAKE-01，第 2 页（仅演示引用，未上传）。
- 2026-10-27T07:55:03.385Z · decision-recorded · 人工审查状态：needs-information；填写人：演示律师（身份未验证）；说明：演示意见：拟委托人身份材料和既往事项范围尚未补齐，保留待补状态，未作出收案决定。。此记录不批准收案，也不发送通知。
- 2026-10-27T07:58:10.457Z · decision-invalidated · 旧审查状态 needs-information（修订 4，填写人 演示律师，说明 演示意见：拟委托人身份材料和既往事项范围尚未补齐，保留待补状态，未作出收案决定。）已失效：子核查结果、来源或律师复核发生变化，请按当前资料重新审查。
- 2026-10-27T07:58:10.458Z · evidence-updated · 子核查结果、来源或律师复核发生变化，请按当前资料重新审查。

## 实际 MCP 调用轨迹

### HSBC BANK PLC · gleif / get_entity

- 核查编号：be2d756e-a50b-4c9c-8e80-16b877076379；调用编号：cfd84bc2-0535-477f-8164-7102092312e3
- 发起方：规则编排
- 时间：2026-10-27T07:53:53.624Z；耗时：1780 ms；状态：success

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
      "fetchedAt": "2026-10-27T07:53:55.401Z"
    }
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：be2d756e-a50b-4c9c-8e80-16b877076379；调用编号：e75579f2-ef70-4b04-86f8-fd1ebb8dcbe8
- 发起方：规则编排
- 时间：2026-10-27T07:53:55.406Z；耗时：2 ms；状态：success

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

- 核查编号：be2d756e-a50b-4c9c-8e80-16b877076379；调用编号：9ddf657a-3752-489a-9846-7bc5267f2b61
- 发起方：规则编排
- 时间：2026-10-27T07:53:55.410Z；耗时：1412 ms；状态：success

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
          "fetchedAt": "2026-10-27T07:53:56.822Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-10-27T07:53:56.822Z"
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
          "fetchedAt": "2026-10-27T07:53:56.794Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-10-27T07:53:56.794Z"
      }
    ],
    "gaps": [],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC BANK PLC · ledger / search_matters

- 核查编号：be2d756e-a50b-4c9c-8e80-16b877076379；调用编号：54e12aa5-32e3-4b74-afed-a874c762f4d9
- 发起方：规则编排
- 时间：2026-10-27T07:53:56.825Z；耗时：1 ms；状态：success

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

- 核查编号：01539fd7-6574-4028-8ac7-fbd4712c19e3；调用编号：0f949a7f-61ec-4fb4-bb1b-b18c36cd8053
- 发起方：规则编排
- 时间：2026-10-27T07:53:53.626Z；耗时：1765 ms；状态：success

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
      "fetchedAt": "2026-10-27T07:53:55.390Z"
    }
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：01539fd7-6574-4028-8ac7-fbd4712c19e3；调用编号：7b875f89-9865-45a9-8382-a701656638fc
- 发起方：规则编排
- 时间：2026-10-27T07:53:55.394Z；耗时：7 ms；状态：success

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

- 核查编号：01539fd7-6574-4028-8ac7-fbd4712c19e3；调用编号：85049dd9-6887-440e-903f-1769c31d8e48
- 发起方：规则编排
- 时间：2026-10-27T07:53:55.403Z；耗时：518 ms；状态：success

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
          "fetchedAt": "2026-10-27T07:53:55.879Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/direct-parent",
        "fetchedAt": "2026-10-27T07:53:55.879Z"
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
          "fetchedAt": "2026-10-27T07:53:55.898Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82/ultimate-parent",
        "fetchedAt": "2026-10-27T07:53:55.898Z"
      }
    ],
    "gaps": [],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### HSBC UK BANK PLC · ledger / search_matters

- 核查编号：01539fd7-6574-4028-8ac7-fbd4712c19e3；调用编号：53480b23-c913-49af-9ae1-972a01a68612
- 发起方：规则编排
- 时间：2026-10-27T07:53:55.924Z；耗时：1 ms；状态：success

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

---
Alta Conflict Desk · 独立本地原型。适用职业规范、实际委托范围、完整主体名单、保密义务及最终是否收案均由有权律师核实和判断。
