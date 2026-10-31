import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.ts";
import { CaseService } from "../server/cases.ts";
import { ConnectorManager, HttpError } from "../server/connectors.ts";
import { MaterialService } from "../server/material-service.ts";
import { extractPdf } from "../server/material-store.ts";
import { ToolDeskService } from "../server/tool-desk.ts";
import { buildFindings, type ScreeningService } from "../server/screening.ts";
import { validateMaterialOutput } from "../server/material-model.ts";
import { explainMatch } from "../shared/match-explanation.ts";
import type { Entity, LedgerMatch, RunInput, Run } from "../shared/types.ts";
const original = readFileSync(
  new URL("../output/pdf/fictional-engagement-original.pdf", import.meta.url),
);
const updated = readFileSync(
  new URL("../output/pdf/fictional-engagement-updated.pdf", import.meta.url),
);
const entity: Entity = {
  lei: "MP6I5ZYZBEU3UXPYFY54",
  name: "HSBC BANK PLC",
  jurisdiction: "GB",
  status: "ACTIVE",
  address: "London",
  sourceUrl: "https://api.gleif.org/example",
  fetchedAt: new Date().toISOString(),
};
const row: LedgerMatch = {
  id: "test-matter",
  clientName: entity.name,
  lei: entity.lei,
  matterName: "虚构事项",
  matterRef: "DEMO-TEST",
  role: "委托人",
  relationship: "现有客户",
  status: "进行中",
  partner: "演示律师",
  matchType: "exact-lei",
  matchedName: entity.name,
  note: "虚构",
};
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "alta-materials-"));
  const store = new Store(dir);
  const connectors = new ConnectorManager(dir);
  const screening = {
    create(input: RunInput) {
      const r: Run = {
        ...input,
        id: randomUUID(),
        status: "completed",
        createdAt: new Date().toISOString(),
        findings: buildFindings(entity, [row], []),
        relations: [],
        traces: [],
        gaps: [],
        summary: "mock identity screening; materials MCP remains real",
      };
      store.save(r);
      return r;
    },
  } as unknown as ScreeningService;
  const cases = new CaseService(store, screening);
  const desk = new ToolDeskService(store, connectors);
  const service = new MaterialService(dir, cases, connectors, store);
  const create = () =>
    cases.create({
      name: "材料测试（虚构）",
      context: "仅测试",
      jurisdiction: "测试",
      mode: "rules",
      parties: [
        {
          id: "client",
          name: entity.name,
          role: "拟委托人",
          confirmed: true,
          entity,
        },
      ],
    });
  const a = create(),
    b = create();
  return {
    dir,
    store,
    connectors,
    cases,
    desk,
    service,
    a,
    b,
    async close() {
      await service.close();
      await desk.close();
      await connectors.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
test("identity explanation distinguishes conflicting LEIs, unknown jurisdiction, and parent comparison", () => {
  const f = buildFindings(
    entity,
    [{ ...row, lei: "21380081EP12LC86CB82", matchType: "exact-name" }],
    [],
  )[0];
  const e = explainMatch(f);
  assert.equal(e.rows[0].state, "different");
  assert.equal(e.rows[1].state, "same");
  assert.equal(e.rows[2].state, "missing");
  assert.match(e.summary, /不能按同一主体/);
  f.match.lei = null;
  assert.match(explainMatch(f).summary, /缺少 LEI/);
  f.relation = {
    type: "direct-parent",
    entity: { ...entity, name: "Parent", lei: "MLU0ZO3ML4LN2LL2TL39" },
    sourceUrl: entity.sourceUrl,
    fetchedAt: entity.fetchedAt,
  };
  f.match.lei = f.relation.entity.lei;
  assert.equal(explainMatch(f).rows[0].state, "same");
  assert.equal(explainMatch(f).subject, "Parent");
  assert.match(explainMatch(f).relation, /比对的是已披露母公司/);
});
test("actual PDF extraction preserves page boundaries and rejects non-PDF input", async () => {
  const p = await extractPdf(original);
  assert.equal(p.length, 2);
  assert.match(
    p[0],
    /Financing documentation and transaction negotiations are excluded/,
  );
  assert.match(p[1], /remains confidential/);
  assert.throws(() => extractPdf(Buffer.from("not a pdf")), /有效的 PDF/);
  await assert.rejects(extractPdf(Buffer.from("%PDF-invalid")), /无法解析/);
});
test("real materials MCP enforces case binding, per-version model grant, revocation and global tool policy", async () => {
  const f = fixture();
  try {
    const m = await f.service.upload(f.a.id, "虚构 PDF", original);
    await f.connectors.connect("documents");
    assert.deepEqual(
      f.connectors
        .get("documents")
        .tools.map((t) => t.name)
        .sort(),
      ["materials_info", "read_material_page"],
    );
    const result = await f.service.read(f.a.id, m.id, 1);
    assert.equal(result.trace.connector, "documents");
    assert.match(result.data.text, /regulatory filings only/);
    await assert.rejects(f.service.read(f.b.id, m.id, 1), /本案中不存在/);
    await assert.rejects(f.service.read(f.a.id, m.id, 1, true), /未获 AI 授权/);
    assert.throws(
      () =>
        f.desk.create({
          connector: "documents",
          tool: "read_material_page",
          args: { caseId: f.a.id, versionId: m.id, page: 1, access: "user" },
        }),
      /绑定的案件/,
    );
    await assert.rejects(
      f.connectors.call(
        "documents",
        "read_material_page",
        { caseId: f.a.id, versionId: m.id, page: 1, access: "user" },
        "model",
        { caseId: f.a.id, model: true },
      ),
      /绑定的案件/,
    );
    f.service.permit(f.a.id, m.id, true);
    assert.equal(
      (await f.service.read(f.a.id, m.id, 2, true)).trace.initiator,
      "model",
    );
    f.service.permit(f.a.id, m.id, false);
    await assert.rejects(f.service.read(f.a.id, m.id, 2, true), /授权已撤回/);
    f.desk.permission({
      connector: "documents",
      tool: "read_material_page",
      enabled: false,
    });
    await assert.rejects(f.service.read(f.a.id, m.id, 1), /已禁用/);
    await f.connectors.disconnect("documents");
    assert.throws(
      () => f.service.start(f.a.id, { versionIds: [m.id], question: "测试" }),
      HttpError,
    );
  } finally {
    await f.close();
  }
});
test("replacement keeps PDF bytes, page text and saved quotes immutable; linked tasks reopen and old decision is retained as draft", async () => {
  const f = fixture();
  try {
    const a = await f.service.upload(f.a.id, "委托范围", original);
    const file = f.cases.get(f.a.id);
    const task = file.tasks.find((t) => t.kind === "scope")!;
    const quote = "The firm advises on banking regulatory filings only.";
    assert.throws(
      () =>
        f.service.record(f.a.id, {
          versionId: a.id,
          page: 2,
          quote,
          note: "无原文",
          expectedRevision: file.revision,
        }),
      /连续原文/,
    );
    assert.throws(
      () =>
        f.service.record(f.b.id, {
          versionId: a.id,
          page: 1,
          quote,
          note: "跨案件",
          expectedRevision: f.cases.get(f.b.id).revision,
        }),
      /本案中不存在/,
    );
    const evidence = f.service.record(f.a.id, {
      versionId: a.id,
      page: 1,
      quote,
      note: "旧版明确限定服务范围，仍需核对签署件。",
      taskId: task.id,
      expectedRevision: file.revision,
    });
    f.cases.updateTask(f.a.id, task.id, {
      status: "resolved",
      note: "软件验证",
      reference: "原文记录 " + evidence.id,
    });
    f.cases.recordDecision(f.a.id, {
      status: "needs-information",
      note: "材料范围待确认",
      reviewer: "测试律师",
    });
    f.service.permit(f.a.id, a.id, true);
    const b = await f.service.upload(f.a.id, "委托范围修订", updated, a.id);
    assert.equal(b.version, 2);
    assert.equal(b.documentId, a.documentId);
    assert.notEqual(b.sha256, a.sha256);
    assert.equal(f.service.data.get(f.a.id, a.id).modelAllowed, false);
    assert.equal(b.modelAllowed, false);
    assert.deepEqual(f.service.data.bytes(f.a.id, a.id), original);
    assert.match(f.service.data.page(f.a.id, a.id, 1).text, /filings only/);
    assert.match(
      f.service.data.page(f.a.id, b.id, 1).text,
      /filings and financing/,
    );
    const now = f.cases.get(f.a.id);
    assert.equal(now.tasks.find((t) => t.id === task.id)?.status, "open");
    assert.equal(now.decision.status, "draft");
    assert.equal(now.decision.note, "材料范围待确认");
    assert.equal(f.service.data.evidence(f.a.id)[0].versionId, a.id);
    assert.match(f.service.report(f.a.id), /已有新版本，引用仍绑定旧版/);
  } finally {
    await f.close();
  }
});
test("model uses actual scoped MCP pages; fabricated quotes and unrelated trace IDs are rejected", async () => {
  const f = fixture();
  const fetchBefore = globalThis.fetch;
  const env = {
    key: process.env.MODEL_API_KEY,
    name: process.env.MODEL_NAME,
    base: process.env.MODEL_BASE_URL,
  };
  try {
    process.env.MODEL_API_KEY = "unit-test-only";
    process.env.MODEL_NAME = "mock-material-model";
    process.env.MODEL_BASE_URL = "https://material-model.invalid";
    const m = await f.service.upload(f.a.id, "虚构材料", original);
    await f.connectors.connect("documents");
    f.service.permit(f.a.id, m.id, true);
    let calls = 0;
    globalThis.fetch = (async (_url, options) => {
      const body = JSON.parse(options!.body as string);
      calls++;
      assert.equal(
        body.tools[0].function.parameters.properties.versionId.enum[0],
        m.id,
      );
      if (calls === 1)
        return Response.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [1, 2].map((page) => ({
                  id: "call-" + page,
                  type: "function",
                  function: {
                    name: "read_material_page",
                    arguments: JSON.stringify({ versionId: m.id, page }),
                  },
                })),
              },
            },
          ],
        });
      const payload = JSON.parse(
        body.messages.find((x: any) => x.role === "tool").content,
      );
      return Response.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                items: [
                  {
                    question: "是否已取得签署版本核实范围？",
                    citations: [
                      {
                        versionId: m.id,
                        page: 1,
                        quote:
                          "The firm advises on banking regulatory filings only.",
                        traceId: payload.traceId,
                      },
                    ],
                  },
                ],
              }),
            },
          },
        ],
      });
    }) as typeof fetch;
    f.service.start(f.a.id, { versionIds: [m.id], question: "核实服务范围" });
    const deadline = Date.now() + 10000;
    while (
      f.service.snapshot(f.a.id).reviews[0].status === "running" &&
      Date.now() < deadline
    )
      await new Promise((r) => setTimeout(r, 20));
    const r = f.service.snapshot(f.a.id).reviews[0];
    assert.equal(r.status, "completed", r.error);
    assert.equal(r.traces.length, 2);
    assert.equal(calls, 2);
    assert.throws(
      () =>
        validateMaterialOutput(
          {
            items: [
              {
                question: "伪造引用",
                citations: [
                  {
                    ...r.items[0].citations[0],
                    quote: "The firm approves all financing work.",
                  },
                ],
              },
            ],
          },
          r,
        ),
      /未能对应/,
    );
    assert.throws(
      () =>
        validateMaterialOutput(
          {
            items: [
              {
                question: "串用来源",
                citations: [
                  { ...r.items[0].citations[0], traceId: randomUUID() },
                ],
              },
            ],
          },
          r,
        ),
      /未能对应/,
    );
    calls = 0;
    const validFetch = globalThis.fetch;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      const result = await validFetch(...args);
      if (calls === 2) f.service.permit(f.a.id, m.id, false);
      return result;
    }) as typeof fetch;
    f.service.start(f.a.id, {
      versionIds: [m.id],
      question: "验证撤回后不发布新结果",
    });
    while (
      f.service.snapshot(f.a.id).reviews[0].status === "running" &&
      Date.now() < deadline
    )
      await new Promise((r) => setTimeout(r, 20));
    const revoked = f.service.snapshot(f.a.id).reviews[0];
    assert.equal(revoked.status, "failed");
    assert.equal(revoked.items.length, 0);
    assert.match(revoked.error!, /授权已撤回/);
  } finally {
    globalThis.fetch = fetchBefore;
    for (const [k, v] of Object.entries({
      MODEL_API_KEY: env.key,
      MODEL_NAME: env.name,
      MODEL_BASE_URL: env.base,
    })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    await f.close();
  }
});
