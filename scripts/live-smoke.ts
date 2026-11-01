import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createBackend } from "../server/app.ts";
import type { Run, Entity, AppStatus } from "../shared/types.ts";

const dir = mkdtempSync(join(tmpdir(), "conflict-live-"));
const backend = createBackend(dir);
const server = backend.app.listen(0, "127.0.0.1");
await new Promise<void>((r) => server.once("listening", r));
const address = server.address();
if (!address || typeof address === "string") throw new Error("No HTTP address");
const base = `http://127.0.0.1:${address.port}`;
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    ...(body !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${data.error}`);
  return data as T;
}
try {
  const status = await api<AppStatus>("/api/status");
  assert.equal(status.ledger.synthetic, true);
  for (const id of ["gleif", "ledger"]) {
    await api(`/api/connectors/${id}/connect`, {});
    await api(`/api/connectors/${id}/test`, {});
  }
  console.log(
    "PASS real MCP initialize, tools/list and health tool calls for both connectors",
  );
  const search = await api<{ entities: Entity[] }>(
    "/api/entities?q=HSBC%20BANK%20PLC",
  );
  const entity = search.entities.find((e) => e.lei === "MP6I5ZYZBEU3UXPYFY54");
  assert.ok(entity, "Public entity must be returned by live GLEIF");
  const exactSearch = await api<{ entities: Entity[] }>(
    `/api/entities?q=${entity.lei}`,
  );
  assert.equal(exactSearch.entities[0]?.lei, entity.lei);
  let run = await api<Run>("/api/runs", {
    matterName: "实时验收 · 虚构跨境融资事项",
    prospectiveClient: "澄川科技有限公司（虚构）",
    partyRole: "交易对方",
    entity,
    mode: "rules",
  });
  const deadline = Date.now() + 150000;
  while (run.status === "running" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 400));
    run = await api<Run>(`/api/runs/${run.id}`);
  }
  assert.notEqual(run.status, "running", "Run timed out");
  assert.notEqual(run.status, "failed", run.error);
  assert.ok(
    run.findings.some((f) => f.type === "direct"),
    "Exact entity match",
  );
  assert.ok(
    run.findings.some((f) => f.type === "similar"),
    "Ambiguous name match",
  );
  if (run.relations.length)
    assert.ok(
      run.findings.some((f) => f.type === "related"),
      "Public parent matched to synthetic matter",
    );
  const ambiguous = run.findings.find((f) => f.type === "similar")!;
  run = await api<Run>(`/api/runs/${run.id}/findings/${ambiguous.id}/review`, {
    review: "dismissed",
    note: "演示复核：此记录无同一 LEI，补充登记信息后确认系不同主体。",
  });
  assert.equal(
    (await api<Run>(`/api/runs/${run.id}`)).findings.find(
      (f) => f.id === ambiguous.id,
    )?.review,
    "dismissed",
  );
  const download = await fetch(base + `/api/runs/${run.id}/report`);
  assert.equal(download.status, 200);
  assert.match(await download.text(), /实际 MCP 调用轨迹/);
  await api("/api/connectors/ledger/disconnect", {});
  const disabled = await fetch(base + "/api/connectors/ledger/test", {
    method: "POST",
  });
  assert.equal(disabled.status, 409);
  const artifact = {
    verifiedAt: new Date().toISOString(),
    mode: "rules",
    realMcp: true,
    syntheticLedger: true,
    publicEntity: run.entity,
    status: run.status,
    findingTypes: run.findings.map((f) => f.type),
    relations: run.relations,
    gaps: run.gaps,
    calls: run.traces.map((t) => ({
      connector: t.connector,
      tool: t.tool,
      initiator: t.initiator,
      durationMs: t.durationMs,
      status: t.status,
      args: t.args,
      error: t.error,
    })),
    reviewPersisted: true,
    downloadVerified: true,
    disconnectEnforced: true,
    aiVerified: false,
  };
  mkdirSync(resolve("docs/history/evidence"), { recursive: true });
  writeFileSync(
    resolve("docs/history/evidence/LIVE-VERIFICATION.json"),
    JSON.stringify(artifact, null, 2) + "\n",
  );
  console.log(JSON.stringify(artifact, null, 2));
} finally {
  await backend.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  rmSync(dir, { recursive: true, force: true });
}
