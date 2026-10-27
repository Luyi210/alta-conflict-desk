import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createBackend } from "../server/app.ts";
import type { CaseView, Entity } from "../shared/types.ts";

// All review notes below are software acceptance fixtures in an isolated temporary database.
// They are neither real legal assessments nor assertions about the named companies' engagements.
const dir = mkdtempSync(join(tmpdir(), "conflict-case-live-"));
const backend = createBackend(dir);
const server = backend.app.listen(0, "127.0.0.1");
await new Promise<void>((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const address = server.address();
if (!address || typeof address === "string") throw new Error("No HTTP address");
const base = `http://127.0.0.1:${address.port}`;
async function request(path: string, body?: unknown) {
  return fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    ...(body !== undefined
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await request(path, body);
  const result = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${result.error}`);
  return result as T;
}
async function finished(id: string) {
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    const file = await api<CaseView>(`/api/cases/${id}`);
    if (file.status !== "running") return file;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Case run timed out");
}
try {
  for (const id of ["gleif", "ledger"])
    await api(`/api/connectors/${id}/connect`, {});
  const entities: Entity[] = [];
  for (const lei of ["MP6I5ZYZBEU3UXPYFY54", "21380081EP12LC86CB82"]) {
    const found = await api<{ entities: Entity[] }>(`/api/entities?q=${lei}`);
    assert.equal(
      found.entities[0]?.lei,
      lei,
      "Real GLEIF identity must resolve before case creation",
    );
    entities.push(found.entities[0]);
  }
  let file = await api<CaseView>("/api/cases", {
    name: "多主体实时验收 · 虚构融资事项",
    context:
      "两个公众企业仅作为检索标识，委托、交易与人工意见全部为虚构软件验收数据。",
    jurisdiction: "软件验收背景，不执行法律判断",
    mode: "rules",
    parties: [
      {
        id: "client",
        name: entities[0].name,
        role: "拟委托人",
        confirmed: true,
        entity: entities[0],
      },
      {
        id: "counterparty",
        name: "待确认交易对方（虚构场景）",
        role: "交易对方",
        confirmed: false,
      },
    ],
  });
  file = await finished(file.id);
  const identity = file.tasks.find((t) => t.kind === "identity");
  assert.ok(identity);
  assert.equal(
    (
      await request(`/api/cases/${file.id}/tasks/${identity.id}`, {
        status: "resolved",
        note: "验收脚本尝试跳过身份",
        reference: "无",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/api/cases/${file.id}/decision`, {
        status: "review-recorded",
        note: "验收脚本验证阻塞",
        reviewer: "虚构验收员",
      })
    ).status,
    409,
  );
  const beforeResolveRevision = file.revision;
  file = await api<CaseView>(
    `/api/cases/${file.id}/parties/counterparty/resolve`,
    { confirmed: true, entity: entities[1] },
  );
  assert.ok(file.revision > beforeResolveRevision);
  file = await finished(file.id);
  assert.equal(file.progress.confirmed, 2);
  assert.equal(
    file.progress.completed,
    2,
    JSON.stringify(
      file.runs.map((r) => ({
        status: r.status,
        gaps: r.gaps,
        error: r.error,
      })),
    ),
  );
  assert.ok(
    file.tasks.some((t) => t.kind === "scope" && t.partyIds.length === 2),
    "The same fictional ledger matter must be merged across actual public parent matches",
  );
  const sharedTasks = file.tasks
    .filter((t) => t.partyIds.length === 2)
    .map((t) => ({ id: t.id, kind: t.kind, partyIds: t.partyIds }));
  const previousRunIds = file.runs.map((r) => r.id);
  const actualCalls = file.runs.flatMap((r) =>
    r.traces.map((t) => ({
      runId: r.id,
      connector: t.connector,
      tool: t.tool,
      args: t.args,
      initiator: t.initiator,
      status: t.status,
      durationMs: t.durationMs,
    })),
  );
  assert.ok(
    actualCalls.some(
      (t) =>
        t.connector === "gleif" &&
        t.tool === "get_relationships" &&
        t.status === "success",
    ),
  );
  assert.ok(
    actualCalls.some(
      (t) =>
        t.connector === "ledger" &&
        t.tool === "search_matters" &&
        t.status === "success",
    ),
  );
  console.log(
    "PASS real multi-party MCP screening, source coverage, identity guard and deduplicated evidence tasks",
  );

  for (const run of file.runs)
    for (const finding of run.findings)
      await api(`/api/runs/${run.id}/findings/${finding.id}/review`, {
        review: "dismissed",
        note: "软件验收模拟人工复核：仅用于测试状态流转，不是实际律师意见。所有事项均为虚构。",
      });
  file = await api<CaseView>(`/api/cases/${file.id}`);
  for (const task of file.tasks.filter((t) => !t.systemManaged))
    file = await api<CaseView>(`/api/cases/${file.id}/tasks/${task.id}`, {
      status: "resolved",
      note: "软件验收模拟补证说明；未核实任何真实委托或义务。",
      reference: "虚构验收材料 CASE-DEMO-01（仅文本引用）",
    });
  assert.equal(file.blockers.length, 0);
  file = await api<CaseView>(`/api/cases/${file.id}/decision`, {
    status: "review-recorded",
    note: "软件验收记录完备，不构成实际法律意见或收案批准。",
    reviewer: "虚构验收员",
  });
  assert.equal(file.status, "recorded");
  const recordedRevision = file.revision;
  const reportResponse = await request(`/api/cases/${file.id}/report`);
  assert.equal(reportResponse.status, 200);
  const markdown = await reportResponse.text();
  assert.match(markdown, /实际 MCP 调用轨迹/);
  assert.match(markdown, /跨主体合并/);
  assert.match(markdown, /身份未验证/);

  const sourceRun = file.runs.find((r) => r.findings.length)!;
  await api(
    `/api/runs/${sourceRun.id}/findings/${sourceRun.findings[0].id}/review`,
    {
      review: "pending",
      note: "软件验收：模拟复核意见改变，验证旧案件意见失效。",
    },
  );
  file = await api<CaseView>(`/api/cases/${file.id}`);
  assert.equal(file.decision.status, "draft");
  assert.ok(file.revision > recordedRevision);
  assert.ok(file.activity.some((a) => a.type === "decision-invalidated"));
  const oldCounterpartyRun = file.parties.find(
    (p) => p.id === "counterparty",
  )!.runId;
  file = await api<CaseView>(
    `/api/cases/${file.id}/parties/counterparty/retry`,
    {},
  );
  assert.notEqual(
    file.parties.find((p) => p.id === "counterparty")!.runId,
    oldCounterpartyRun,
  );
  file = await finished(file.id);
  for (const runId of previousRunIds)
    assert.equal((await request(`/api/runs/${runId}`)).status, 200);
  assert.equal(file.decision.status, "draft");
  console.log(
    "PASS simulated manual evidence/review, report download, child-review invalidation and retry preserving old runs",
  );

  const artifact = {
    verifiedAt: new Date().toISOString(),
    mode: "rules",
    realMcp: true,
    aiVerified: false,
    syntheticLedger: true,
    simulatedHumanReviews: true,
    publicEntities: entities.map((e) => ({
      name: e.name,
      lei: e.lei,
      sourceUrl: e.sourceUrl,
      fetchedAt: e.fetchedAt,
    })),
    sharedTasks,
    identityGuard: true,
    finalDecisionGuard: true,
    reportDownloaded: true,
    reviewChangeInvalidatedDecision: true,
    retryPreservedHistory: true,
    actualCalls,
    finalCaseStatus: file.status,
    finalDecision: file.decision.status,
  };
  const output = resolve(
    process.env.CASE_VERIFICATION_OUTPUT || "docs/CASE-LIVE-VERIFICATION.json",
  );
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(artifact, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        artifact: output,
        calls: actualCalls.length,
        sharedTasks: sharedTasks.length,
        aiVerified: false,
      },
      null,
      2,
    ),
  );
} finally {
  await backend.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  rmSync(dir, { recursive: true, force: true });
}
