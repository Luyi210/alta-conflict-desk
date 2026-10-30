import { test } from "node:test";
import assert from "node:assert/strict";
import { evidenceFacts } from "../shared/evidence-facts.ts";
import type { Trace } from "../shared/types.ts";

test("fact cards use returned evidence, ignore model prose and never upgrade a name-only match", () => {
  const trace: Trace = {
    id: "actual-ledger",
    connector: "ledger",
    tool: "search_matters",
    args: { name: "BANK", lei: "MP6I5ZYZBEU3UXPYFY54" },
    startedAt: "2026-10-30T00:00:00Z",
    durationMs: 1,
    status: "success",
    initiator: "model",
    result: {
      matches: [
        {
          id: "same",
          clientName: "SERVICES",
          matterRef: "DEMO-1",
          matterName: "虚构事项",
          relationship: "现有客户",
          status: "进行中",
          matchType: "similar-name",
        },
      ],
    },
  };
  const facts = evidenceFacts([trace]);
  assert.equal(facts.length, 1);
  assert.match(facts[0].text, /仅名称匹配，身份未确认/);
  assert.deepEqual(facts[0].traceIds, ["actual-ledger"]);
  assert.equal(evidenceFacts([{ ...trace, status: "error" }]).length, 0);
  assert.equal(evidenceFacts([{ ...trace, initiator: "rules" }]).length, 0);
  const exact: Trace = {
    ...trace,
    id: "parent-ledger",
    result: {
      matches: [
        { ...(trace.result as any).matches[0], matchType: "exact-lei" },
      ],
    },
  };
  assert.deepEqual(evidenceFacts([trace, exact])[0].traceIds, [
    "parent-ledger",
  ]);
  assert.match(evidenceFacts([trace, exact])[0].text, /LEI 一致/);
});
