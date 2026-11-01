import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.ts";
import { CaseService } from "../server/cases.ts";
import { MaterialService } from "../server/material-service.ts";
import { ConnectorManager } from "../server/connectors.ts";
import { IssueService } from "../server/issue-service.ts";
import { AssistantService } from "../server/assistant-service.ts";
import { validateAssistantOutput } from "../server/assistant-model.ts";
import type { AssistantRun } from "../shared/assistant.ts";
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
  const assistant = new AssistantService(cases, materials, issues, connectors);
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
    assistant,
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
      await assistant.close();
      await materials.close();
      await connectors.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function modelFixture(
  targetIssueId: string | null = null,
  onFinal?: () => void,
) {
  const originalFetch = globalThis.fetch;
  const env = {
    key: process.env.MODEL_API_KEY,
    model: process.env.MODEL_NAME,
    base: process.env.MODEL_BASE_URL,
  };
  process.env.MODEL_API_KEY = "test-placeholder";
  process.env.MODEL_NAME = "test-model";
  process.env.MODEL_BASE_URL = "http://127.0.0.1:9/v1";
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const body = JSON.parse(String(options?.body));
    const input = JSON.parse(body.messages[1].content);
    const reads = body.messages
      .filter((m: any) => m.role === "tool")
      .map((m: any) => JSON.parse(m.content));
    if (!reads.length)
      return Response.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: input.materials.flatMap((m: any) =>
                Array.from({ length: m.pageCount }, (_, n) => ({
                  id: `${m.id}:${n}`,
                  type: "function",
                  function: {
                    name: "read_material_page",
                    arguments: JSON.stringify({ versionId: m.id, page: n + 1 }),
                  },
                })),
              ),
            },
          },
        ],
      });
    onFinal?.();
    const citations = reads
      .filter((r: any) => r.data.page === 1)
      .map((r: any) => ({
        versionId: r.data.material.id,
        page: r.data.page,
        quote,
        traceId: r.traceId,
      }));
    return Response.json({
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              summary: "测试核实路径：先索取签署文件，仍待律师判断。",
              actions: [0, 1, 2].map((n) => ({
                title: `待核实问题 ${n}`,
                priority: n ? "next" : "first",
                reason: "材料列有范围排除，需核对本次授权。",
                missing: "请补充已签署的委托范围文件",
                request: "烦请提供已签署的委托协议，以核实融资文件的授权范围。",
                category: "scope",
                partyIds: ["client"],
                targetIssueId: n === 0 ? targetIssueId : null,
                citations,
              })),
            }),
          },
        },
      ],
    });
  };
  return {
    calls: () => calls,
    restore() {
      globalThis.fetch = originalFetch;
      for (const [key, value] of Object.entries({
        MODEL_API_KEY: env.key,
        MODEL_NAME: env.model,
        MODEL_BASE_URL: env.base,
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    },
  };
}

test("assistant runs real materials MCP with a mock provider, preserves notes, applies idempotently and rejects stale/cross-case adoption", async () => {
  const f = fixture();
  const issue = f.createIssue();
  f.issues.update(f.a.id, issue.id, {
    title: issue.title,
    category: issue.category,
    partyIds: ["client"],
    owner: "测试律师",
    missing: "原待补项",
    note: "原律师记录必须保留",
    status: "reviewing",
    expectedRevision: f.cases.get(f.a.id).revision,
    issueRevision: issue.revision,
  });
  const mock = modelFixture(issue.id);
  try {
    const m = await f.materials.upload(f.a.id, "授权材料", pdf);
    const other = await f.materials.upload(f.b.id, "其他案件材料", pdf);
    await f.connectors.connect("documents");
    const start = (versionIds = [m.id]) =>
      f.assistant.start(f.a.id, {
        versionIds,
        question: "准备补证请求",
        expectedRevision: f.cases.get(f.a.id).revision,
      });
    assert.throws(() => start(), /未获 AI 授权/);
    assert.throws(() => start([other.id]), /本案/);
    f.materials.permit(f.a.id, m.id, true);
    const r = start();
    assert.throws(() => start(), /仍在运行/);
    await f.assistant.close();
    const run = f.assistant.snapshot(f.a.id).runs[0];
    assert.equal(run.status, "completed", run.error);
    assert.equal(mock.calls(), 2);
    assert.equal(run.traces.length, 2);
    assert.ok(
      run.traces.every(
        (t) => t.initiator === "model" && t.status === "success",
      ),
    );
    assert.equal(run.actions.length, 3);
    const raw = { summary: run.summary, actions: structuredClone(run.actions) };
    raw.actions[0].citations[0].quote = "Fabricated quotation must be rejected";
    assert.throws(() => validateAssistantOutput(raw, run), /引用/);
    raw.actions = structuredClone(run.actions);
    raw.actions[0].targetIssueId = randomUUID();
    assert.throws(() => validateAssistantOutput(raw, run), /范围以外/);
    raw.actions = structuredClone(run.actions);
    raw.actions[0].partyIds = ["outsider"];
    assert.throws(() => validateAssistantOutput(raw, run), /本案以外/);
    raw.actions = structuredClone(run.actions);
    raw.actions[0].citations[0].traceId = randomUUID();
    assert.throws(() => validateAssistantOutput(raw, run), /引用/);
    const input = (index: number) => ({
      index,
      expectedRevision: f.cases.get(f.a.id).revision,
      missing: "律师编辑后的待补项",
      request: "律师编辑后的补证请求正文。",
    });
    assert.throws(() => f.assistant.apply(f.b.id, r.id, input(0)), /本案/);
    const saved = f.assistant.apply(f.a.id, r.id, input(0));
    assert.equal(
      saved.snapshot.runs[0].adoptedDrafts?.[0].request,
      "律师编辑后的补证请求正文。",
    );
    assert.equal(saved.issueId, issue.id);
    const applied = f.issues.list(f.a.id).find((i) => i.id === issue.id)!;
    assert.equal(applied.status, "reviewing");
    assert.match(applied.note, /原律师记录必须保留/);
    assert.match(applied.note, /律师编辑后的补证请求正文/);
    assert.match(applied.missing, /原待补项/);
    assert.equal(applied.citations.length, 1);
    assert.equal(applied.reviews.length, 0);
    const revision = f.cases.get(f.a.id).revision;
    assert.equal(f.assistant.apply(f.a.id, r.id, input(0)).issueId, issue.id);
    assert.equal(f.cases.get(f.a.id).revision, revision);
    const second = f.assistant.apply(f.a.id, r.id, input(1));
    assert.notEqual(second.issueId, issue.id);
    assert.equal(f.issues.list(f.a.id).length, 2);
    f.cases.materialsChanged(f.a.id, "另一个窗口更新材料");
    assert.throws(() => f.assistant.apply(f.a.id, r.id, input(2)), /已变化/);
    assert.equal(f.cases.get(f.a.id).decision.status, "draft");
    const restarted = new AssistantService(
      f.cases,
      f.materials,
      f.issues,
      f.connectors,
    );
    assert.equal(restarted.snapshot(f.a.id).runs[0].applications[0], issue.id);
  } finally {
    mock.restore();
    await f.close();
  }
});

test("revoking material permission while a model response is in flight prevents saving generated actions", async () => {
  const f = fixture();
  const m = await f.materials.upload(f.a.id, "待撤权材料", pdf);
  const mock = modelFixture(null, () =>
    f.materials.permit(f.a.id, m.id, false),
  );
  try {
    await f.connectors.connect("documents");
    f.materials.permit(f.a.id, m.id, true);
    f.assistant.start(f.a.id, {
      versionIds: [m.id],
      question: "核实材料",
      expectedRevision: f.cases.get(f.a.id).revision,
    });
    await f.assistant.close();
    const run = f.assistant.snapshot(f.a.id).runs[0];
    assert.equal(run.status, "failed");
    assert.equal(run.actions.length, 0);
    assert.equal(run.traces.length, 2);
    assert.match(run.error || "", /授权/);
  } finally {
    mock.restore();
    await f.close();
  }
});

test("assistant recovers interrupted work and leaves immutable prior issue opinions intact when adopting a draft", async () => {
  const f = fixture();
  try {
    const issue = f.createIssue(),
      m = await f.materials.upload(f.a.id, "材料", pdf);
    f.cite(issue.id, m.id);
    f.update(f.issues.list(f.a.id)[0]);
    const before = structuredClone(f.issues.list(f.a.id)[0].reviews);
    f.issues.adoptAssistant(
      f.a.id,
      "assistant:test:0",
      {
        title: "后续待核实",
        priority: "next",
        category: "scope",
        reason: "测试",
        missing: "补充材料",
        request: "请提供补充协议。",
        targetIssueId: issue.id,
        partyIds: ["client"],
        citations: [{ versionId: m.id, page: 1, quote, traceId: randomUUID() }],
      },
      f.cases.get(f.a.id).revision,
    );
    assert.deepEqual(f.issues.list(f.a.id)[0].reviews, before);
    assert.equal(f.issues.list(f.a.id)[0].status, "reviewing");
    const unfinished = {
      createdAt: new Date().toISOString(),
      model: "test-model",
      question: "测试中断恢复",
      versionIds: [m.id],
      rounds: 1,
      caseRevision: f.cases.get(f.a.id).revision,
      basisRevision: f.cases.get(f.a.id).revision,
      issueIds: [issue.id],
      partyIds: ["client"],
      summary: "",
      id: randomUUID(),
      caseId: f.a.id,
      status: "running",
      traces: [],
      actions: [],
      items: [],
      applications: {},
    } as AssistantRun;
    f.materials.data.db
      .prepare("INSERT INTO assistant_runs VALUES (?,?,?)")
      .run(unfinished.id, f.a.id, JSON.stringify(unfinished));
    const recovered = new AssistantService(
      f.cases,
      f.materials,
      f.issues,
      f.connectors,
    ).snapshot(f.a.id).runs[0];
    assert.equal(recovered.status, "failed");
    assert.match(recovered.error || "", /重启/);
  } finally {
    await f.close();
  }
});
