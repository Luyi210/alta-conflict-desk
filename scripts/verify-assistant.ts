import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MaterialStore } from "../server/material-store.ts";
import { validateAssistantOutput } from "../server/assistant-model.ts";
import type { AssistantRun } from "../shared/assistant.ts";
import type { ReviewIssue } from "../shared/issues.ts";
import type { MaterialPage } from "../shared/materials.ts";

// Only reads saved local records. No .env, provider or network access.
const [caseId, output] = process.argv.slice(2);
if (!caseId)
  throw new Error("用法：npm run verify:assistant -- <caseId> [输出JSON路径]");
const dir = resolve(process.env.DATA_DIR || "data");
const store = new MaterialStore(dir, true);
const cases = new DatabaseSync(resolve(dir, "app.sqlite"), { readOnly: true });
try {
  const row = cases.prepare("SELECT data FROM cases WHERE id=?").get(caseId) as
    | { data: string }
    | undefined;
  assert.ok(row, "案件不存在");
  const matter = JSON.parse(row.data);
  const runs: AssistantRun[] = (
    store.db
      .prepare(
        "SELECT data FROM assistant_runs WHERE caseId=? ORDER BY rowid DESC",
      )
      .all(caseId) as { data: string }[]
  ).map((r) => JSON.parse(r.data));
  assert.ok(
    runs.some((r) => r.status === "completed"),
    "尚无成功运行",
  );
  const issues: ReviewIssue[] = (
    store.db
      .prepare("SELECT data FROM review_issues WHERE caseId=?")
      .all(caseId) as { data: string }[]
  ).map((r) => JSON.parse(r.data));
  for (const run of runs.filter((r) => r.status === "completed")) {
    validateAssistantOutput(
      { summary: run.summary, actions: run.actions },
      run,
    );
    for (const id of run.versionIds) {
      const m = store.get(caseId, id);
      assert.equal(
        createHash("sha256").update(store.bytes(caseId, id)).digest("hex"),
        m.sha256,
      );
      for (let page = 1; page <= m.pageCount; page++) {
        const trace = run.traces.find(
          (t) =>
            t.status === "success" &&
            t.initiator === "model" &&
            t.tool === "read_material_page" &&
            t.args.caseId === caseId &&
            t.args.versionId === id &&
            t.args.page === page,
        );
        assert.ok(trace, "每个选定页面必须有实际模型读取记录");
        const actual = trace.result as MaterialPage;
        assert.equal(actual.text, store.page(caseId, id, page).text);
        assert.equal(actual.material.sha256, m.sha256);
      }
    }
    for (const [index, id] of Object.entries(run.applications)) {
      const issue = issues.find((i) => i.id === id);
      assert.ok(issue, "采用的审查问题必须属于本案");
      assert.ok(
        issue?.assistantApplications?.includes(`assistant:${run.id}:${index}`),
      );
      const draft = run.adoptedDrafts?.[index];
      assert.ok(draft, "采用后的编辑文字应独立保存");
      // Current notes may subsequently be edited by a lawyer; the immutable adoption snapshot remains.
      assert.ok(draft.missing.length >= 2 && draft.request.length >= 2);
      for (const c of run.actions[Number(index)].citations)
        assert.ok(
          issue.citations.some(
            (i) =>
              i.versionId === c.versionId &&
              i.page === c.page &&
              i.quote === c.quote,
          ),
        );
    }
  }
  const result = {
    verifiedAt: new Date().toISOString(),
    caseId,
    caseRevision: matter.revision,
    decisionStatus: matter.decision.status,
    verificationBasis:
      "Read-only saved application records: actual model-initiated page receipts, immutable PDF hashes/text, quote and case boundaries, edited adoption snapshots. Not legal correctness or provider billing verification.",
    newModelRequests: 0,
    attempts: runs.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      model: r.model,
      rounds: r.rounds,
      formatRetries: r.formatRetries || 0,
      formatIssues: r.formatIssues,
      error: r.error,
      modelCalls: r.traces.filter((t) => t.initiator === "model").length,
      caseRevision: r.caseRevision,
      basisRevision: r.basisRevision,
      summary: r.summary,
      actions: r.actions,
      applications: r.applications,
      adoptedDrafts: r.adoptedDrafts,
      receipts: r.traces.map((t) => ({
        id: t.id,
        tool: t.tool,
        initiator: t.initiator,
        status: t.status,
        versionId: t.args.versionId,
        page: t.args.page,
      })),
    })),
  };
  if (output)
    writeFileSync(resolve(output), JSON.stringify(result, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        verified: true,
        completedRuns: runs.filter((r) => r.status === "completed").length,
        failedRuns: runs.filter((r) => r.status === "failed").length,
        adoptedActions: runs.reduce(
          (n, r) => n + Object.keys(r.applications).length,
          0,
        ),
        output: output || null,
      },
      null,
      2,
    ),
  );
} finally {
  store.close();
  cases.close();
}
