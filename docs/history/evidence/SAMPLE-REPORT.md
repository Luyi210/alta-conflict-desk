# 收案前主体与潜在利益冲突核查记录

- 核查编号：b8a40da7-f3bc-475e-9592-ad8a2a7e2bac
- 事项：澄川科技 · 跨境融资项目
- 拟委托人（背景字段，本次未核查）：澄川科技有限公司（虚构）
- 选定主体：HSBC BANK PLC / MP6I5ZYZBEU3UXPYFY54
- 主体角色：交易对方
- 模式：规则预览（非 AI 推理验收）
- 状态：completed
- 开始：2026-10-27T06:31:24.135Z
- 完成：2026-10-27T06:31:28.020Z

> 内部委托台账全部为虚构演示数据；公众企业名称与 LEI 不表示真实委托关系。本报告记录筛查线索，不作是否收案的法律决定。

## 结果

发现 3 条核查线索。结论仅限已列明的来源与核查范围。

## 范围与未覆盖项

- 核查仅覆盖选定对方主体及 GLEIF 披露的直接/最终母公司；拟委托人字段仅为事项背景，尚未执行其主体核查。
- GLEIF 仅覆盖注册 LEI 的实体；母公司关系为会计合并口径，不等于所有法律关联关系。
- 内部台账全部为虚构演示记录；匹配线索不构成法律利益冲突结论，未命中不等于可接受委托。

## 主体与公开关系来源

- [选定主体原始记录](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54)；获取于 2026-10-27T06:31:26.222Z
- 直接母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent)；获取于 2026-10-27T06:31:26.780Z
- 最终母公司：HSBC HOLDINGS PLC / MLU0ZO3ML4LN2LL2TL39；[公开关系](https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent)；获取于 2026-10-27T06:31:27.996Z

## 核查线索与律师复核

### 1. 同一主体出现在既有事项

LEI 与虚构台账 DEMO-2026-014 完全一致。请核实委托范围与在办义务。

- 对应主体：HSBC BANK PLC
- 虚构内部记录：HSBC BANK PLC / DEMO-2026-014
- 虚构事项：银行监管咨询（虚构）
- 匹配依据：exact-lei
- 复核状态：待复核
- 复核理由：尚未填写
- 最近复核时间：尚未复核
- 证据调用编号：c73e43d5-47de-4a38-9c95-87b53122cc56、a1c5556b-ffa9-47a1-b071-9c1673225d68

### 2. 近似/同名记录，身份待确认

仅名称匹配，尚不能确认与 HSBC BANK SERVICES LIMITED 为同一主体。请补充登记信息。

- 对应主体：HSBC BANK PLC
- 虚构内部记录：HSBC BANK SERVICES LIMITED / DEMO-2026-027
- 虚构事项：信息技术采购咨询（虚构）
- 匹配依据：similar-name
- 复核状态：排除此线索
- 复核理由：演示复核：该台账明确为构造的近似名称测试记录，排除本条演示命中；不代表真实客户身份核验。
- 最近复核时间：2026-10-27T06:32:20.533Z
- 证据调用编号：c73e43d5-47de-4a38-9c95-87b53122cc56、a1c5556b-ffa9-47a1-b071-9c1673225d68

### 3. 公开母公司出现在既有事项

公开直接母公司与虚构台账 LEI 一致。关联本身不自动构成法律冲突。

- 对应主体：HSBC HOLDINGS PLC
- 虚构内部记录：HSBC HOLDINGS PLC / DEMO-2025-038
- 虚构事项：集团治理专项（虚构）
- 匹配依据：exact-lei
- 复核状态：待复核
- 复核理由：尚未填写
- 最近复核时间：尚未复核
- 证据调用编号：c73e43d5-47de-4a38-9c95-87b53122cc56、255086f1-4f4a-4a5d-8366-1d7a512c1aa5、502ff527-ad6d-4bde-a8b7-9bb2ada8b2bd

## 实际 MCP 调用轨迹

### gleif / get_entity

- 调用编号：c73e43d5-47de-4a38-9c95-87b53122cc56
- 发起方：规则编排
- 开始：2026-10-27T06:31:24.136Z
- 耗时：2088 ms
- 状态：success

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
      "fetchedAt": "2026-10-27T06:31:26.222Z"
    }
  }
}
```

### ledger / search_matters

- 调用编号：a1c5556b-ffa9-47a1-b071-9c1673225d68
- 发起方：规则编排
- 开始：2026-10-27T06:31:26.227Z
- 耗时：8 ms
- 状态：success

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

### gleif / get_relationships

- 调用编号：255086f1-4f4a-4a5d-8366-1d7a512c1aa5
- 发起方：规则编排
- 开始：2026-10-27T06:31:26.237Z
- 耗时：1777 ms
- 状态：success

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
          "fetchedAt": "2026-10-27T06:31:26.780Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/direct-parent",
        "fetchedAt": "2026-10-27T06:31:26.780Z"
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
          "fetchedAt": "2026-10-27T06:31:27.996Z"
        },
        "sourceUrl": "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54/ultimate-parent",
        "fetchedAt": "2026-10-27T06:31:27.996Z"
      }
    ],
    "gaps": [],
    "coverage": "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。"
  }
}
```

### ledger / search_matters

- 调用编号：502ff527-ad6d-4bde-a8b7-9bb2ada8b2bd
- 发起方：规则编排
- 开始：2026-10-27T06:31:28.016Z
- 耗时：2 ms
- 状态：success

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
Alta Conflict Desk · 独立本地原型。请结合适用司法辖区的职业规范、完整委托关系和保密义务，由有权律师作最终判断。
