import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../server/store.ts";
import { ConnectorManager, HttpError } from "../server/connectors.ts";
import {
  buildFindings,
  reviewSchema,
  runInputSchema,
  ScreeningService,
} from "../server/screening.ts";
import { matchMatters, type MatterRow } from "../server/matching.ts";
import { report } from "../server/report.ts";
import type { Entity, Run, Trace } from "../shared/types.ts";

const entity: Entity = {
  lei: "MP6I5ZYZBEU3UXPYFY54",
  name: "HSBC BANK PLC",
  jurisdiction: "GB",
  status: "ACTIVE",
  address: "London",
  sourceUrl: "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
  fetchedAt: "2026-10-27T01:00:00.000Z",
};
const row: MatterRow = {
  id: "one",
  clientName: entity.name,
  lei: "21380081EP12LC86CB82",
  matterName: "虚构事项",
  matterRef: "DEMO",
  role: "委托人",
  relationship: "现有客户",
  status: "进行中",
  partner: "虚构律师",
  note: "虚构",
};
function sampleRun(): Run {
  return {
    id: "test-run",
    matterName: "核查事项",
    prospectiveClient: "虚构客户",
    partyRole: "对方当事人",
    entity,
    mode: "rules",
    status: "completed",
    createdAt: entity.fetchedAt,
    findings: buildFindings(
      entity,
      matchMatters([{ ...row, lei: entity.lei }], entity.name, entity.lei),
      ["trace"],
    ),
    relations: [],
    traces: [],
    gaps: ["仅演示台账"],
    summary: "待律师复核",
  };
}

test("same name with a different or missing LEI is never classified as a direct identity hit", () => {
  for (const lei of [row.lei, null]) {
    const matches = matchMatters([{ ...row, lei }], entity.name, entity.lei);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].matchType, "exact-name");
    assert.equal(buildFindings(entity, matches, [])[0].type, "similar");
  }
  assert.equal(
    buildFindings(
      entity,
      matchMatters([{ ...row, lei: entity.lei }], entity.name, entity.lei),
      [],
    )[0].type,
    "direct",
  );
});

test("corporate suffix alone cannot cause a name match; exact LEI survives a changed name", () => {
  assert.equal(
    matchMatters(
      [{ ...row, clientName: "UNRELATED SERVICES LIMITED", lei: null }],
      "OTHER COMPANY LIMITED",
    ).length,
    0,
  );
  const hits = matchMatters(
    [{ ...row, clientName: "RENAMED BANK PLC", lei: entity.lei }],
    entity.name,
    entity.lei,
  );
  assert.equal(hits[0].matchType, "exact-lei");
});

test("bad LEIs and unexplained dismissals are rejected at input boundary", () => {
  assert.equal(
    runInputSchema.safeParse({
      ...sampleRun(),
      entity: { ...entity, lei: "../file" },
    }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({ review: "dismissed", note: " " }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({ review: "pending", note: "" }).success,
    true,
  );
});

test("AI mode is refused when no model credential is configured", () => {
  const saved = process.env.MODEL_API_KEY;
  delete process.env.MODEL_API_KEY;
  try {
    const service = new ScreeningService(
      {} as Store,
      {
        list: () => [{ connected: true }, { connected: true }],
      } as unknown as ConnectorManager,
    );
    assert.throws(
      () => service.create({ ...sampleRun(), mode: "ai" }),
      (error: unknown) => error instanceof HttpError && error.status === 409,
    );
  } finally {
    if (saved !== undefined) process.env.MODEL_API_KEY = saved;
  }
});

test("reviews and reports retain reasons across database reopen, and interrupted runs are not reported as completed", () => {
  const dir = mkdtempSync(join(tmpdir(), "conflict-store-"));
  let store = new Store(dir);
  try {
    assert.equal(store.countLedger(), 4);
    const run = sampleRun();
    run.summary = "发现 1 条待律师复核的线索。";
    store.save(run);
    const service = new ScreeningService(store, {} as ConnectorManager);
    service.review(run.id, run.findings[0].id, "escalated", "待核实原委托范围");
    assert.match(report(store.get(run.id)!), /已标记进一步复核/);
    service.review(
      run.id,
      run.findings[0].id,
      "dismissed",
      "经核实为不同事项，继续核实其他风险",
    );
    const interrupted = {
      ...sampleRun(),
      id: "interrupted",
      status: "running" as const,
    };
    store.save(interrupted);
    store.close();
    store = new Store(dir);
    assert.equal(store.get(run.id)?.findings[0].review, "dismissed");
    const markdown = report(store.get(run.id)!);
    assert.match(markdown, /经核实为不同事项/);
    assert.match(markdown, /非 AI 推理验收/);
    assert.match(markdown, /虚构/);
    assert.match(markdown, /发现 1 条核查线索/);
    assert.doesNotMatch(markdown, /条待律师复核的线索/);
    assert.equal(store.get("interrupted")?.status, "failed");
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("real SQLite MCP lists tools, reads synthetic data, and stops calls after disconnect", async () => {
  const dir = mkdtempSync(join(tmpdir(), "conflict-mcp-"));
  const store = new Store(dir);
  const manager = new ConnectorManager(dir);
  try {
    await assert.rejects(
      manager.call("ledger", "ledger_info", {}),
      (e: unknown) => e instanceof HttpError && e.status === 409,
    );
    const connected = await manager.connect("ledger");
    assert.equal(connected.connected, true);
    assert.deepEqual(connected.tools.map((t) => t.name).sort(), [
      "ledger_info",
      "search_matters",
    ]);
    const { data, trace } = await manager.call<{
      matches: { matchType: string }[];
      synthetic: boolean;
    }>("ledger", "search_matters", { name: entity.name, lei: entity.lei });
    assert.equal(data.synthetic, true);
    assert.ok(data.matches.some((m) => m.matchType === "exact-lei"));
    assert.ok(data.matches.some((m) => m.matchType === "similar-name"));
    assert.equal(trace.status, "success");
    assert.ok(trace.durationMs >= 0);
    await assert.rejects(
      manager.call("ledger", "execute_sql", { sql: "DELETE FROM matters" }),
      (e: unknown) => e instanceof HttpError && e.status === 403,
    );
    await manager.disconnect("ledger");
    await assert.rejects(
      manager.call("ledger", "ledger_info", {}),
      (e: unknown) => e instanceof HttpError && e.status === 409,
    );
  } finally {
    await manager.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unavailable parent data yields a partial result with an explicit gap, never a fabricated relationship", async () => {
  const dir = mkdtempSync(join(tmpdir(), "conflict-gap-"));
  const store = new Store(dir);
  const fakeManager = {
    list: () => [{ connected: true }, { connected: true }],
    async call(_id: string, tool: string, args: Record<string, unknown>) {
      const data =
        tool === "get_entity"
          ? { entity }
          : tool === "search_matters"
            ? { matches: [] }
            : { relations: [], gaps: ["测试：母公司接口不可用"] };
      return {
        data,
        trace: {
          id: tool,
          connector: _id,
          tool,
          args,
          startedAt: entity.fetchedAt,
          durationMs: 1,
          status: "success",
          result: data,
        } as Trace,
      };
    },
  } as unknown as ConnectorManager;
  const service = new ScreeningService(store, fakeManager);
  try {
    const run = service.create({
      matterName: "虚构事项",
      prospectiveClient: "虚构客户",
      partyRole: "对方当事人",
      entity,
      mode: "rules",
    });
    await service.close();
    const final = store.get(run.id)!;
    assert.equal(final.status, "partial");
    assert.equal(final.relations.length, 0);
    assert.equal(final.findings.length, 0);
    assert.ok(final.gaps.includes("测试：母公司接口不可用"));
    assert.match(final.summary, /不等于无利益冲突/);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
