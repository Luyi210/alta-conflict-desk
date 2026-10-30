import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Run, Trace } from "../shared/types.ts";
import { evidenceFacts } from "../shared/evidence-facts.ts";
import { validateHardenedAiRun } from "../scripts/verify-ai-run.ts";

function fixture(): Run {
  const entity = {
    lei: "MP6I5ZYZBEU3UXPYFY54",
    name: "HSBC BANK PLC",
    jurisdiction: "GB",
    status: "ACTIVE",
    address: "London",
    sourceUrl: "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
    fetchedAt: "2026-10-30T12:00:00Z",
  };
  const parent = {
    ...entity,
    lei: "MLU0ZO3ML4LN2LL2TL39",
    name: "HSBC HOLDINGS PLC",
  };
  const trace = (
    connector: "gleif" | "ledger",
    lei: string,
    result: unknown,
  ): Trace => ({
    id: randomUUID(),
    connector,
    tool: connector === "gleif" ? "get_entity" : "search_matters",
    args: { lei, name: entity.name },
    status: "success",
    startedAt: entity.fetchedAt,
    durationMs: 10,
    initiator: "model",
    result,
  });
  const traces = [
    trace("gleif", entity.lei, {
      entity,
      network: [{ url: entity.sourceUrl, attempts: [{ status: 200 }] }],
    }),
    trace("ledger", entity.lei, { matches: [], synthetic: true }),
    trace("ledger", parent.lei, { matches: [], synthetic: true }),
  ];
  const ids = traces.map((t) => t.id);
  // Entire record is a fixture for verification logic, never live AI acceptance evidence.
  return {
    id: randomUUID(),
    matterName: "虚构验证测试",
    prospectiveClient: "虚构主体",
    partyRole: "拟委托人",
    context: "虚构融资范围",
    entity,
    mode: "ai",
    status: "completed",
    createdAt: entity.fetchedAt,
    completedAt: entity.fetchedAt,
    findings: [],
    relations: [
      {
        type: "direct-parent",
        entity: parent,
        sourceUrl: entity.sourceUrl,
        fetchedAt: entity.fetchedAt,
      },
    ],
    traces,
    gaps: [],
    summary: "fixture",
    modelSummary: `测试摘要\n\n引用调用：${ids.join("、")}`,
    modelExecution: {
      status: "completed",
      model: "verification-fixture",
      rounds: 2,
      toolCallCount: 3,
    },
    modelBrief: {
      summary: "测试摘要",
      citedTraceIds: ids,
      facts: evidenceFacts(traces),
      questions: [{ text: "待核实范围", traceIds: [] }],
      nextSteps: [{ text: "取得材料", traceIds: [] }],
    },
  };
}
test("hardened verifier accepts a complete fixture and rejects missing parent citation, fabricated fact cards and failed network receipts", () => {
  assert.equal(validateHardenedAiRun(fixture()).hardenedVerified, true);
  for (const kind of ["parent", "facts", "network", "body", "context"]) {
    const run = fixture();
    if (kind === "parent") {
      run.modelBrief!.citedTraceIds.pop();
      run.modelSummary = `测试摘要\n\n引用调用：${run.modelBrief!.citedTraceIds.join("、")}`;
    }
    if (kind === "facts") run.modelBrief!.facts![0].text = "模型虚构的来源事实";
    if (kind === "network")
      (run.traces[0].result as any).network[0].attempts[0].status = 503;
    if (kind === "body")
      (run.traces[0].result as any).network[0].attempts[0].error =
        "TimeoutError";
    if (kind === "context") run.context = "";
    assert.throws(
      () => validateHardenedAiRun(run),
      assert.AssertionError,
      kind,
    );
  }
});

test("hardened verifier distinguishes an explicit missing-parent 404 from an unreported source failure", () => {
  const run = fixture();
  const trace: Trace = {
    ...run.traces[0],
    id: randomUUID(),
    tool: "get_relationships",
    args: { lei: run.relations[0].entity.lei },
    result: {
      relations: [],
      gaps: ["母公司查询：GLEIF HTTP 404，未提供该关系"],
      network: [
        {
          url: `${run.relations[0].entity.sourceUrl}/direct-parent`,
          attempts: [{ status: 404 }],
        },
      ],
    },
  };
  run.traces.push(trace);
  run.modelExecution!.toolCallCount++;
  run.modelBrief!.facts = evidenceFacts(run.traces);
  assert.equal(validateHardenedAiRun(run).hardenedVerified, true);
  (trace.result as { gaps: string[] }).gaps = [];
  assert.throws(() => validateHardenedAiRun(run), /覆盖缺口/);
});
