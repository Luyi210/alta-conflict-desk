import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildOverview } from "../server/overview.ts";
import { createBackend } from "../server/app.ts";
import type { CaseView, Run, Trace } from "../shared/types.ts";
import type { IssueView } from "../shared/issues.ts";

const now = new Date("2026-10-31T16:30:00Z"); // Nov 1, 00:30 in Shanghai.
const matter = (
  id: string,
  status: CaseView["status"] = "needs-attention",
): CaseView => ({
  id,
  name: id,
  context: "",
  jurisdiction: "demo",
  mode: "rules",
  createdAt: "2026-10-31T16:10:00Z",
  updatedAt: now.toISOString(),
  revision: 1,
  parties: [],
  tasks: [],
  runs: [],
  blockers: [],
  activity: [],
  decision: { status: "draft", note: "", reviewer: "", revision: 1 },
  status,
  progress: {
    total: 1,
    confirmed: 1,
    completed: 1,
    findings: 3,
    pendingFindings: 3,
    openTasks: 2,
  },
});
const issue = (caseId: string, stale = false): IssueView => ({
  id: `${caseId}-issue`,
  caseId,
  revision: 1,
  title: "Verify scope",
  category: "scope",
  partyIds: [],
  owner: "",
  missing: "",
  note: "",
  status: "resolved",
  citations: [],
  reviews: [],
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  effectiveStatus: stale ? "stale" : "resolved",
  impacts: [],
});
const trace = (
  id: string,
  at: string,
  status: Trace["status"] = "success",
): Trace => ({
  id,
  connector: "documents",
  tool: "read_material_page",
  args: {},
  startedAt: at,
  durationMs: 1,
  status,
  initiator: "model",
});
const empty = () => ({
  matters: [],
  runs: [],
  manualTraces: [],
  connectors: [],
});

test("overview separates ended cases from actionable totals and counts stale resolved issues as pending", () => {
  const a = matter("a"),
    b = matter("b", "closed"),
    c = matter("c", "recorded"),
    d = matter("d");
  d.progress.confirmed = 0;
  const snapshot = buildOverview(
    {
      ...empty(),
      matters: [a, b, c, d].map((m) => ({
        matter: m,
        issues: [issue(m.id, true)],
        materials: [],
        reviews: [],
        assistants: [],
      })),
    },
    7,
    now,
  );
  assert.equal(snapshot.totals.cases, 4);
  assert.equal(snapshot.totals.active, 2);
  assert.equal(snapshot.totals.pendingFindings, 6);
  assert.equal(snapshot.totals.openTasks, 4);
  assert.equal(snapshot.totals.openIssues, 2);
  assert.equal(snapshot.totals.staleIssues, 2);
  assert.deepEqual(
    snapshot.stages.map((s) => s.count),
    [1, 0, 1, 1, 1],
  );
  assert.deepEqual(snapshot.issues.map((i) => i.caseId).sort(), ["a", "d"]);
  assert.equal(snapshot.queue.length, 4);
});

test("overview deduplicates saved traces, keeps failures, and groups Shanghai midnight within bounded windows", () => {
  const shared = trace("same", "2026-10-31T16:00:00Z");
  const records = [
    shared,
    trace("before-midnight", "2026-10-31T15:59:59Z", "error"),
    trace("window-start", "2026-10-25T16:00:00Z"),
    trace("outside", "2026-10-25T15:59:59Z"),
    trace("future", "2026-11-01T01:00:00Z"),
  ];
  const run = { traces: records } as Run;
  const snapshot = buildOverview(
    { ...empty(), runs: [run], manualTraces: [shared] },
    7,
    now,
  );
  assert.equal(snapshot.tools.total, 3);
  assert.equal(snapshot.tools.errors, 1);
  assert.equal(snapshot.tools.success, 2);
  assert.equal(snapshot.trend.length, 7);
  assert.equal(snapshot.trend[0].date, "2026-10-26");
  assert.equal(snapshot.trend.at(-1)?.date, "2026-11-01");
  assert.equal(snapshot.trend.at(-1)?.calls, 1);
  assert.equal(snapshot.trend.at(-2)?.errors, 1);
  assert.equal(
    buildOverview({ ...empty(), runs: [run] }, 30, now).tools.total,
    4,
  );
  const zero = buildOverview(empty(), 7, now);
  assert.equal(zero.tools.total, 0);
  assert.ok(zero.trend.every((d) => d.calls === 0));
  assert.equal(zero.totals.active, 0);
});

test("overview HTTP rejects unsupported periods and can render an empty workspace without external calls", async () => {
  const dir = mkdtempSync(join(tmpdir(), "alta-overview-"));
  const backend = createBackend(dir);
  const server = backend.app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/overview`;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.totals.cases, 0);
    assert.equal(data.trend.length, 7);
    assert.equal(data.tools.total, 0);
    assert.equal((await fetch(`${base}?days=30`)).status, 200);
    assert.equal((await fetch(`${base}?days=365`)).status, 400);
    assert.ok(backend.connectors.list().every((c) => !c.connected));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    await backend.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
