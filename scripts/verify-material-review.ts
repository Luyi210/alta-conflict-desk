import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { MaterialStore } from "../server/material-store.ts";
import {
  validateMaterialOutput,
  verifyQuote,
} from "../server/material-model.ts";
import type { MaterialPage } from "../shared/materials.ts";

// Read-only local verification: no .env, network requests or model calls.
const caseId = process.argv[2];
const output = process.argv[3];
if (!caseId)
  throw new Error(
    "用法：npm run verify:materials -- <caseId> [输出JSON路径]；仅核验本机已完成的材料复核，不调用模型。",
  );
const store = new MaterialStore(resolve(process.env.DATA_DIR || "data"), true);
try {
  const materials = store.list(caseId);
  const reviews = store.reviews(caseId).filter((r) => r.status === "completed");
  assert.ok(reviews.length, "本案无已完成的材料模型记录");
  for (const m of materials)
    assert.equal(
      createHash("sha256").update(store.bytes(caseId, m.id)).digest("hex"),
      m.sha256,
      "文件哈希与版本记录不符",
    );
  for (const r of reviews) {
    assert.ok(
      r.rounds >= 2 && !/mock|dummy/i.test(r.model),
      "需实际模型的多轮工具记录",
    );
    validateMaterialOutput({ items: r.items }, r);
    for (const t of r.traces) {
      assert.equal(t.initiator, "model");
      assert.equal(t.connector, "documents");
      assert.equal(t.tool, "read_material_page");
      assert.equal(t.status, "success");
      const page = t.result as MaterialPage;
      const actual = store.page(caseId, page.material.id, page.page);
      assert.equal(page.text, actual.text, "工具结果必须与持久化原文一致");
      assert.equal(page.material.sha256, actual.material.sha256);
    }
    for (const id of r.versionIds) {
      const material = store.get(caseId, id);
      for (let page = 1; page <= material.pageCount; page++)
        assert.ok(
          r.traces.some((t) => t.args.versionId === id && t.args.page === page),
          "必须读取全部选定页",
        );
    }
  }
  const evidence = store.evidence(caseId);
  for (const e of evidence)
    assert.ok(
      verifyQuote(store.page(caseId, e.versionId, e.page).text, e.quote),
    );
  const result = {
    verifiedAt: new Date().toISOString(),
    caseId,
    verificationBasis:
      "Read-only validation of saved application records, model-initiated MCP results, page quotes and immutable PDF hashes. Not provider billing verification or legal validation.",
    newModelRequests: 0,
    completedReviews: reviews.length,
    modelToolCalls: reviews.reduce((n, r) => n + r.traces.length, 0),
    verifiedQuestions: reviews.reduce((n, r) => n + r.items.length, 0),
    materials,
    evidence,
    reviews,
  };
  if (output)
    writeFileSync(resolve(output), JSON.stringify(result, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        caseId,
        reviews: result.completedReviews,
        modelToolCalls: result.modelToolCalls,
        questions: result.verifiedQuestions,
        versions: materials.length,
        evidence: evidence.length,
        output: output || "未导出",
      },
      null,
      2,
    ),
  );
} finally {
  store.close();
}
