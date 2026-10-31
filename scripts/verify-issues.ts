import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MaterialStore } from "../server/material-store.ts";
import {
  validateMaterialOutput,
  verifyQuote,
} from "../server/material-model.ts";
import type { CaseFile } from "../shared/types.ts";
import type { ReviewIssue } from "../shared/issues.ts";

// Read-only saved-record verification. Does not load .env or call any provider.
const caseId = process.argv[2],
  output = process.argv[3];
if (!caseId)
  throw new Error("用法：npm run verify:issues -- <caseId> [输出JSON路径]");
const dir = resolve(process.env.DATA_DIR || "data");
const db = new DatabaseSync(resolve(dir, "app.sqlite"), { readOnly: true });
const store = new MaterialStore(dir, true);
try {
  const row = db.prepare("SELECT data FROM cases WHERE id=?").get(caseId) as
    | { data: string }
    | undefined;
  assert.ok(row, "案件不存在");
  const matter: CaseFile = JSON.parse(row.data);
  const issues: ReviewIssue[] = (
    store.db
      .prepare(
        "SELECT data FROM review_issues WHERE caseId=? ORDER BY rowid DESC",
      )
      .all(caseId) as { data: string }[]
  ).map((r) => JSON.parse(r.data));
  assert.ok(issues.length, "尚未建立审查问题");
  const materials = store.list(caseId);
  for (const m of materials)
    assert.equal(
      createHash("sha256").update(store.bytes(caseId, m.id)).digest("hex"),
      m.sha256,
    );
  for (const issue of issues) {
    assert.equal(issue.caseId, caseId);
    assert.ok(
      issue.partyIds.every((id) => matter.parties.some((p) => p.id === id)),
    );
    for (const citation of [
      ...issue.citations,
      ...issue.reviews.flatMap((r) => r.basis),
    ])
      assert.ok(
        verifyQuote(
          store.page(caseId, citation.versionId, citation.page).text,
          citation.quote,
        ),
        "当前及历史引用必须来自本案原文",
      );
    for (const review of issue.reviews) {
      assert.ok(
        review.reviewer && review.note.length >= 10 && review.basis.length,
      );
      for (const version of review.versions) {
        const original = store.get(caseId, version.versionId);
        assert.equal(original.sha256, version.sha256);
        assert.equal(original.documentId, version.documentId);
      }
    }
  }
  const attempts = store
    .reviews(caseId)
    .filter(
      (r) =>
        r.versionIds.length >= 2 &&
        new Set(r.versionIds.map((id) => store.get(caseId, id).documentId))
          .size === 1,
    );
  for (const review of attempts.filter((r) => r.status === "completed"))
    validateMaterialOutput({ items: review.items }, review);
  const result = {
    verifiedAt: new Date().toISOString(),
    caseId,
    caseRevision: matter.revision,
    verificationBasis:
      "Read-only local records: same-case current/historical quotes, immutable PDF hashes, opinion version snapshots and validated completed comparison outputs. Not legal validation or provider billing verification.",
    newModelRequests: 0,
    decisionStatus: matter.decision.status,
    issues,
    comparisonAttempts: attempts.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      status: r.status,
      model: r.model,
      rounds: r.rounds,
      formatRetries: r.formatRetries || 0,
      modelToolCalls: r.traces.filter((t) => t.initiator === "model").length,
      questions: r.items.length,
      error: r.error,
    })),
  };
  if (output)
    writeFileSync(resolve(output), JSON.stringify(result, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        caseId,
        issues: issues.length,
        citations: issues.reduce((n, i) => n + i.citations.length, 0),
        opinionHistory: issues.reduce((n, i) => n + i.reviews.length, 0),
        comparisonAttempts: result.comparisonAttempts,
        output: output || "未导出",
      },
      null,
      2,
    ),
  );
} finally {
  store.close();
  db.close();
}
