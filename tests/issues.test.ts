import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { unzipSync, strFromU8 } from "fflate";
import { Store } from "../server/store.ts";
import { CaseService } from "../server/cases.ts";
import { MaterialService } from "../server/material-service.ts";
import { ConnectorManager } from "../server/connectors.ts";
import { IssueService } from "../server/issue-service.ts";
import { buildMemo } from "../server/memo.ts";
import type { ScreeningService } from "../server/screening.ts";
import type { Run, RunInput } from "../shared/types.ts";
import type { ReviewIssue } from "../shared/issues.ts";
const pdf = readFileSync(
  new URL("../examples/pdf/fictional-engagement-original.pdf", import.meta.url),
);
const revised = readFileSync(
  new URL("../examples/pdf/fictional-engagement-updated.pdf", import.meta.url),
);
const quote =
  "Financing documentation and transaction negotiations are excluded.";
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "alta-issues-")),
    store = new Store(dir),
    connectors = new ConnectorManager(dir);
  const screening = {
    create(input: RunInput) {
      const r: Run = {
        ...input,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        status: "completed",
        findings: [],
        relations: [],
        traces: [],
        gaps: [],
        summary: "Test identity fixture",
      };
      store.save(r);
      return r;
    },
  } as ScreeningService;
  const cases = new CaseService(store, screening),
    materials = new MaterialService(dir, cases, connectors, store),
    issues = new IssueService(cases, materials);
  const create = () =>
    cases.create({
      name: "问题工作台测试（虚构）",
      context: "拟提供融资文件服务，仅用于测试",
      jurisdiction: "测试",
      mode: "rules",
      parties: [
        {
          id: "client",
          name: "HSBC BANK PLC",
          role: "拟委托人",
          confirmed: true,
          entity: {
            name: "HSBC BANK PLC",
            lei: "MP6I5ZYZBEU3UXPYFY54",
            jurisdiction: "GB",
            status: "ACTIVE",
            address: "London",
            sourceUrl: "https://api.gleif.org/example",
            fetchedAt: new Date().toISOString(),
          },
        },
      ],
    });
  const a = create(),
    b = create();
  const createIssue = () =>
    issues.create(a.id, {
      title: "融资文件是否属于委托范围",
      category: "scope",
      expectedRevision: cases.get(a.id).revision,
    }).issues[0];
  const cite = (id: string, versionId: string, text = quote) =>
    issues.addCitation(a.id, id, {
      versionId,
      page: 1,
      quote: text,
      relation: "support",
      expectedRevision: cases.get(a.id).revision,
    });
  const update = (i: ReviewIssue, overrides: object = {}) =>
    issues.update(a.id, i.id, {
      title: i.title,
      category: i.category,
      owner: "测试律师",
      missing: "",
      note: "虚构测试：已核对当前原文，仍需按实际事项独立判断。",
      status: "resolved",
      partyIds: ["client"],
      expectedRevision: cases.get(a.id).revision,
      issueRevision: i.revision,
      ...overrides,
    });
  return {
    dir,
    store,
    cases,
    materials,
    issues,
    connectors,
    a,
    b,
    createIssue,
    cite,
    update,
    async close() {
      await materials.close();
      await connectors.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("issue export uses readable status and keeps user text inside its section", async () => {
  const f = fixture();
  try {
    f.issues.create(f.a.id, {
      title: "范围核实\n## 伪造结论",
      category: "scope",
      expectedRevision: f.cases.get(f.a.id).revision,
    });
    const markdown = f.issues.markdown(f.a.id);
    assert.match(markdown, /状态：待核实/);
    assert.doesNotMatch(markdown, /状态：open/);
    assert.doesNotMatch(markdown, /\n## 伪造结论/);
    assert.match(markdown, /范围核实 \\#\\# 伪造结论/);
  } finally {
    await f.close();
  }
});

test("issue boundaries reject cross-case sources, forged quotes and stale writes; unresolved issues block completion", async () => {
  const f = fixture();
  try {
    const i = f.createIssue(),
      a = await f.materials.upload(f.a.id, "本案材料", pdf),
      other = await f.materials.upload(f.b.id, "其他案件", pdf);
    assert.throws(() => f.cite(i.id, other.id), /本案/);
    assert.throws(
      () => f.cite(i.id, a.id, "这不是 PDF 中的连续原文内容"),
      /连续原文/,
    );
    assert.throws(() => f.issues.update(f.b.id, i.id, {}));
    assert.throws(() => f.update(i), /原文依据/);
    assert.throws(
      () => f.issues.create(f.a.id, { title: "过期写入", expectedRevision: 1 }),
      /已更新/,
    );
    assert.ok(f.cases.get(f.a.id).blockers.some((b) => b.includes("审查问题")));
    assert.throws(
      () =>
        f.cases.recordDecision(f.a.id, {
          status: "review-recorded",
          reviewer: "测试律师",
          note: "测试记录完整性门禁",
          expectedRevision: f.cases.get(f.a.id).revision,
        }),
      /尚不完备/,
    );
    f.cite(i.id, a.id);
    const now = f.issues.list(f.a.id)[0];
    assert.throws(
      () => f.update(now, { partyIds: ["outside"] }),
      /必须属于本案/,
    );
    assert.throws(() => f.update(now, { missing: "仍需签署件" }), /待补信息/);
    f.update(now);
    assert.equal(f.issues.list(f.a.id)[0].effectiveStatus, "resolved");
    assert.equal(f.cases.get(f.a.id).blockers.length, 0);
  } finally {
    await f.close();
  }
});
test("replacement reopens issue impact and keeps prior opinions; re-review requires latest citation and explicit acknowledgement", async () => {
  const f = fixture();
  try {
    const i = f.createIssue(),
      old = await f.materials.upload(f.a.id, "原版", pdf);
    f.cite(i.id, old.id);
    f.update(f.issues.list(f.a.id)[0]);
    f.cases.recordDecision(f.a.id, {
      status: "review-recorded",
      reviewer: "测试律师",
      note: "测试状态，非收案批准",
      expectedRevision: f.cases.get(f.a.id).revision,
    });
    const next = await f.materials.upload(f.a.id, "新版", revised, old.id);
    let current = f.issues.list(f.a.id)[0];
    assert.equal(current.effectiveStatus, "stale");
    assert.equal(current.reviews.length, 1);
    assert.equal(current.impacts[0].from.id, old.id);
    assert.equal(current.impacts[0].to.id, next.id);
    assert.equal(f.cases.get(f.a.id).decision.status, "draft");
    assert.throws(() => f.update(current), /逐份核对/);
    assert.throws(
      () => f.update(current, { acknowledgedVersionIds: [next.id] }),
      /新版|最新版本/,
    );
    f.cite(
      i.id,
      next.id,
      "The firm advises on regulatory filings and financing documentation.",
    );
    current = f.issues.list(f.a.id)[0];
    f.update(current, { acknowledgedVersionIds: [next.id] });
    current = f.issues.list(f.a.id)[0];
    assert.equal(current.effectiveStatus, "resolved");
    assert.equal(current.reviews.length, 2);
    assert.equal(current.reviews[0].basis.length, 1);
    assert.equal(current.reviews[1].basis.length, 2);
    const third = await f.materials.upload(f.a.id, "再次更新", pdf, next.id);
    current = f.issues.list(f.a.id)[0];
    assert.equal(current.effectiveStatus, "stale");
    assert.equal(current.impacts[0].from.id, next.id);
    assert.equal(current.impacts[0].to.id, third.id);
    const restored = new IssueService(f.cases, f.materials);
    assert.equal(restored.list(f.a.id)[0].reviews.length, 2);
  } finally {
    await f.close();
  }
});
test("version comparison reads actual scoped MCP pages and attributes affected issues without treating differences as legal conclusions", async () => {
  const f = fixture();
  try {
    const i = f.createIssue(),
      old = await f.materials.upload(f.a.id, "原版", pdf);
    f.cite(i.id, old.id);
    const next = await f.materials.upload(f.a.id, "新版", revised, old.id);
    await f.connectors.connect("documents");
    const result = await f.issues.compare(f.a.id, old.id, next.id);
    assert.equal(result.traces.length, 4);
    assert.ok(
      result.traces.every(
        (t) => t.initiator === "user" && t.status === "success",
      ),
    );
    assert.deepEqual(result.affectedIssueIds, [i.id]);
    assert.ok(
      result.pages[0].changes.some(
        (c) => c.removed && c.value.includes("excluded"),
      ),
    );
    assert.ok(
      result.pages[0].changes.some(
        (c) => c.added && c.value.includes("financing documentation"),
      ),
    );
    await assert.rejects(
      () => f.issues.compare(f.b.id, old.id, next.id),
      /本案/,
    );
    await assert.rejects(
      () => f.issues.compare(f.a.id, next.id, old.id),
      /由旧到新/,
    );
    assert.equal(f.issues.list(f.a.id)[0].effectiveStatus, "stale");
  } finally {
    await f.close();
  }
});
test("AI suggestions require a completed same-case source and are imported idempotently with real citations", async () => {
  const f = fixture();
  try {
    const old = await f.materials.upload(f.a.id, "原版", pdf),
      review = {
        id: randomUUID(),
        caseId: f.a.id,
        createdAt: new Date().toISOString(),
        status: "completed" as const,
        model: "mock-test",
        question: "范围",
        versionIds: [old.id],
        traces: [],
        rounds: 2,
        items: [
          {
            question: "是否排除融资文件服务？",
            citations: [
              { versionId: old.id, page: 1, quote, traceId: randomUUID() },
            ],
          },
        ],
      };
    f.materials.data.saveReview(review);
    const create = () =>
      f.issues.create(f.a.id, {
        reviewId: review.id,
        itemIndex: 0,
        expectedRevision: f.cases.get(f.a.id).revision,
      });
    const first = create();
    assert.equal(first.issues.length, 1);
    assert.equal(first.issues[0].citations[0].quote, quote);
    assert.equal(create().issues.length, 1);
    assert.throws(
      () =>
        f.issues.create(f.b.id, {
          reviewId: review.id,
          itemIndex: 0,
          expectedRevision: f.cases.get(f.b.id).revision,
        }),
      /本案/,
    );
  } finally {
    await f.close();
  }
});
test("editable Word memo preserves pending issues, version fingerprints and historical opinions without changing case state", async () => {
  const f = fixture();
  try {
    const i = f.createIssue(),
      old = await f.materials.upload(f.a.id, "委托书原版", pdf);
    f.cite(i.id, old.id);
    f.update(f.issues.list(f.a.id)[0]);
    await f.materials.upload(f.a.id, "委托书修订版", revised, old.id);
    const before = f.cases.get(f.a.id);
    const bytes = await buildMemo(before, f.issues.snapshot(f.a.id));
    const zip = unzipSync(new Uint8Array(bytes)),
      xml = strFromU8(zip["word/document.xml"]);
    assert.ok(xml.includes("收案审查备忘录"));
    assert.ok(xml.includes("材料变化待复核"));
    assert.ok(xml.includes("旧版依据"));
    assert.ok(xml.includes(old.sha256));
    assert.ok(xml.includes(quote));
    assert.ok(xml.includes("人工意见历史"));
    assert.ok(!zip["word/media/image1.png"]);
    assert.equal(f.cases.get(f.a.id).revision, before.revision);
  } finally {
    await f.close();
  }
});
