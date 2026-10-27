import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { ZodError } from "zod";
import { Store } from "../server/store.ts";
import { CaseService, caseInputSchema } from "../server/cases.ts";
import { createCaseRouter } from "../server/case-routes.ts";
import { caseReport } from "../server/case-report.ts";
import { buildFindings, ScreeningService } from "../server/screening.ts";
import { HttpError, type ConnectorManager } from "../server/connectors.ts";
import type {
  CaseInput,
  Entity,
  Finding,
  Run,
  RunInput,
} from "../shared/types.ts";

const entity: Entity = {
  lei: "MP6I5ZYZBEU3UXPYFY54",
  name: "HSBC BANK PLC",
  jurisdiction: "GB",
  status: "ACTIVE",
  address: "London",
  sourceUrl: "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
  fetchedAt: "2026-10-27T01:00:00.000Z",
};
const entity2: Entity = {
  ...entity,
  lei: "21380081EP12LC86CB82",
  name: "HSBC UK BANK PLC",
  sourceUrl: "https://api.gleif.org/api/v1/lei-records/21380081EP12LC86CB82",
};
const entity3: Entity = {
  ...entity,
  lei: "MLU0ZO3ML4LN2LL2TL39",
  name: "HSBC HOLDINGS PLC",
  sourceUrl: "https://api.gleif.org/api/v1/lei-records/MLU0ZO3ML4LN2LL2TL39",
};
const input = (): CaseInput => ({
  name: "虚构融资事项",
  context: "仅为软件验收的虚构事项",
  jurisdiction: "仅演示，不执行法律判断",
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
function finding(e: Entity, review: Finding["review"] = "pending") {
  const f = buildFindings(
    e,
    [
      {
        id: "same-ledger-matter",
        clientName: "虚构客户",
        lei: e.lei,
        matterName: "既往事项（虚构）",
        matterRef: "DEMO-HISTORY",
        role: "委托人",
        relationship: "既往客户",
        status: "已结案",
        partner: "虚构律师",
        matchType: "exact-lei",
        matchedName: e.name,
        note: "虚构",
      },
    ],
    ["realistic-trace-id"],
  )[0];
  f.review = review;
  f.reviewNote = review === "dismissed" ? "测试：材料核实后排除此线索" : "";
  return f;
}
function fixture(overrides: (input: RunInput) => Partial<Run> = () => ({})) {
  const dir = mkdtempSync(join(tmpdir(), "conflict-cases-"));
  const store = new Store(dir);
  const screening = {
    create(data: RunInput) {
      const run: Run = {
        id: randomUUID(),
        ...data,
        status: "completed",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        findings: [],
        relations: [],
        traces: [],
        gaps: ["测试台账为虚构"],
        summary: "已取得限定来源，不能据此批准收案",
        ...overrides(data),
      };
      store.save(run);
      return run;
    },
  } as unknown as ScreeningService;
  const cases = new CaseService(store, screening);
  return {
    dir,
    store,
    screening,
    cases,
    cleanup() {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
const statusError = (status: number) => (e: unknown) =>
  e instanceof HttpError && e.status === status;

test("case input rejects duplicate identities, duplicate party IDs, no confirmed party and more than six parties", () => {
  const base = input();
  const first = base.parties[0];
  for (const parties of [
    [{ ...first, confirmed: false }],
    [{ ...first, entity: undefined }],
    [first, { ...first, id: "another" }],
    [first, { ...first, entity: entity2 }],
    [
      first,
      ...Array.from({ length: 6 }, (_, n) => ({
        ...first,
        id: `u${n}`,
        confirmed: false,
        entity: undefined,
      })),
    ],
  ])
    assert.equal(
      caseInputSchema.safeParse({ ...base, parties }).success,
      false,
    );
  assert.equal(
    caseInputSchema.safeParse({
      ...base,
      parties: [
        first,
        {
          id: "unidentified",
          name: "身份未提供",
          role: "担保方",
          confirmed: false,
        },
      ],
    }).success,
    true,
  );
});

test("actual findings generate stable scope and confidentiality tasks shared across parties", () => {
  const f = fixture((i) => ({ findings: [finding(i.entity)] }));
  try {
    const data = input();
    data.parties.push({
      id: "opponent",
      name: entity2.name,
      role: "交易对方",
      confirmed: true,
      entity: entity2,
    });
    const view = f.cases.create(data);
    assert.equal(view.runs.length, 2);
    assert.equal(view.progress.completed, 2);
    assert.equal(view.progress.findings, 2);
    assert.equal(
      view.tasks.length,
      2,
      "One scope and one confidentiality task, not duplicates per party",
    );
    for (const task of view.tasks)
      assert.deepEqual(task.partyIds, ["client", "opponent"]);
    assert.deepEqual(
      f.cases.get(view.id).tasks.map((t) => t.id),
      view.tasks.map((t) => t.id),
    );
    assert.ok(view.blockers.some((b) => b.includes("2 条线索")));
    assert.throws(
      () =>
        f.cases.recordDecision(view.id, {
          status: "review-recorded",
          note: "材料齐备",
          reviewer: "测试律师",
        }),
      statusError(409),
    );
  } finally {
    f.cleanup();
  }
});

test("missing identity and failed or partial sources are system tasks that cannot be manually cleared", () => {
  const f = fixture(() => ({ status: "partial", gaps: ["真实来源未完成"] }));
  try {
    const data = input();
    data.parties.push({
      id: "unknown",
      name: "待查担保公司",
      role: "担保方",
      confirmed: false,
    });
    const view = f.cases.create(data);
    assert.equal(view.progress.completed, 0);
    assert.deepEqual(
      new Set(view.tasks.map((t) => t.kind)),
      new Set(["identity", "coverage"]),
    );
    for (const task of view.tasks)
      assert.throws(
        () =>
          f.cases.updateTask(view.id, task.id, {
            status: "resolved",
            note: "手动确认",
            reference: "材料编号",
          }),
        statusError(409),
      );
    assert.throws(
      () => f.cases.retryParty(view.id, "unknown"),
      statusError(409),
    );
    assert.throws(
      () =>
        f.cases.resolveParty(view.id, "unknown", { entity, confirmed: true }),
      statusError(409),
    );
    const fixed = f.cases.resolveParty(view.id, "unknown", {
      entity: entity2,
      confirmed: true,
    });
    assert.equal(fixed.progress.confirmed, 2);
    assert.equal(fixed.tasks.filter((t) => t.kind === "identity").length, 0);
    assert.equal(fixed.tasks.filter((t) => t.kind === "coverage").length, 2);
    assert.ok(fixed.revision > view.revision);
  } finally {
    f.cleanup();
  }
});

test("manual evidence requires notes and references, persists, and later review changes invalidate the total decision", () => {
  const f = fixture((i) => ({ findings: [finding(i.entity, "dismissed")] }));
  try {
    let view = f.cases.create(input());
    const stableIds = view.tasks.map((t) => t.id);
    assert.throws(
      () =>
        f.cases.updateTask(view.id, view.tasks[0].id, {
          status: "resolved",
          note: "核实",
          reference: "",
        }),
      statusError(400),
    );
    for (const task of view.tasks)
      view = f.cases.updateTask(view.id, task.id, {
        status: "resolved",
        note: "已人工核实限定事项范围",
        reference: "测试材料 A-01 第 3 页（仅文字引用）",
      });
    assert.equal(view.blockers.length, 0);
    assert.equal(view.status, "ready-for-review");
    view = f.cases.recordDecision(view.id, {
      status: "review-recorded",
      note: "演示：当前核查记录已补齐，最终收案另行决定",
      reviewer: "测试律师",
    });
    assert.equal(view.status, "recorded");
    const oldRevision = view.revision;
    const reviewService = new ScreeningService(f.store, {} as ConnectorManager);
    reviewService.review(
      view.runs[0].id,
      view.runs[0].findings[0].id,
      "pending",
      "新增材料需要重新审查",
    );
    view = f.cases.get(view.id);
    assert.equal(view.decision.status, "draft");
    assert.equal(view.revision, oldRevision + 1);
    assert.ok(
      view.activity.some(
        (a) =>
          a.type === "decision-invalidated" &&
          a.message.includes("当前核查记录已补齐"),
      ),
    );
    assert.deepEqual(
      view.tasks.map((t) => t.id),
      stableIds,
    );
    assert.ok(view.tasks.every((t) => t.reference.includes("A-01")));
    assert.equal(
      f.cases.get(view.id).revision,
      view.revision,
      "Polling cannot repeatedly invalidate unchanged evidence",
    );
    const reopened = new CaseService(f.store, f.screening);
    assert.equal(reopened.get(view.id).decision.status, "draft");
    assert.ok(reopened.get(view.id).blockers.some((b) => b.includes("待复核")));
    assert.match(caseReport(view), /实际 MCP 调用轨迹/);
    assert.match(caseReport(view), /不批准收案/);
    assert.match(caseReport(view), /身份未验证/);
  } finally {
    f.cleanup();
  }
});

test("retry retains old runs and audit, resets affected evidence and invalidates an earlier case decision", () => {
  const f = fixture((i) => ({ findings: [finding(i.entity, "dismissed")] }));
  try {
    let view = f.cases.create(input());
    for (const task of view.tasks)
      view = f.cases.updateTask(view.id, task.id, {
        status: "resolved",
        note: "说明已核对",
        reference: "旧材料第 2 页",
      });
    view = f.cases.recordDecision(view.id, {
      status: "review-recorded",
      note: "限定记录完整",
      reviewer: "测试律师",
    });
    const oldRunId = view.parties[0].runId!;
    const oldRevision = view.revision;
    const retried = f.cases.retryParty(view.id, "client");
    assert.notEqual(retried.parties[0].runId, oldRunId);
    assert.ok(f.store.get(oldRunId));
    assert.equal(f.store.list().length, 2);
    assert.equal(retried.revision, oldRevision + 1);
    assert.equal(retried.decision.status, "draft");
    assert.ok(retried.tasks.every((t) => t.status === "open"));
    assert.ok(
      retried.activity.some(
        (a) => a.type === "party-retried" && a.message.includes(oldRunId),
      ),
    );
    assert.ok(retried.activity.some((a) => a.type === "decision-invalidated"));
  } finally {
    f.cleanup();
  }
});

test("a newly resolved party reopens a previously completed shared evidence task", () => {
  const f = fixture((i) => ({ findings: [finding(i.entity, "dismissed")] }));
  try {
    const data = input();
    data.parties.push({
      id: "unknown",
      name: "未确认主体",
      role: "担保方",
      confirmed: false,
    });
    let view = f.cases.create(data);
    for (const task of view.tasks.filter((t) => !t.systemManaged))
      view = f.cases.updateTask(view.id, task.id, {
        status: "resolved",
        note: "原主体材料已核对",
        reference: "原材料 01",
      });
    view = f.cases.resolveParty(view.id, "unknown", {
      entity: entity3,
      confirmed: true,
    });
    assert.equal(view.tasks.length, 2);
    assert.ok(
      view.tasks.every((t) => t.status === "open" && t.partyIds.length === 2),
    );
  } finally {
    f.cleanup();
  }
});

test("running cases cannot be retried, and a source failure after recording invalidates the saved decision", () => {
  const f = fixture();
  try {
    let view = f.cases.create(input());
    view = f.cases.recordDecision(view.id, {
      status: "review-recorded",
      note: "空匹配也仅表示限定来源完成",
      reviewer: "测试律师",
    });
    const run = view.runs[0];
    run.status = "failed";
    run.error = "来源失效";
    f.store.save(run);
    view = f.cases.get(view.id);
    assert.equal(view.decision.status, "draft");
    assert.ok(view.tasks.some((t) => t.kind === "coverage"));
    run.status = "running";
    f.store.save(run);
    assert.throws(
      () => f.cases.retryParty(view.id, "client"),
      statusError(409),
    );
    assert.throws(
      () =>
        f.cases.resolveParty(view.id, "client", {
          entity: entity2,
          confirmed: true,
        }),
      statusError(409),
    );
  } finally {
    f.cleanup();
  }
});

test("cases survive database reopen without resetting old runs, and interrupted child runs become coverage gaps", () => {
  const f = fixture(() => ({
    status: "running",
    modelExecution: {
      status: "running",
      model: "test-only",
      toolCallCount: 1,
      rounds: 1,
    },
  }));
  let reopened: Store | undefined;
  try {
    const view = f.cases.create(input());
    f.store.close();
    reopened = new Store(f.dir);
    const service = new CaseService(reopened, f.screening);
    const saved = service.get(view.id);
    assert.equal(saved.runs[0].status, "failed");
    assert.equal(saved.runs[0].modelExecution?.status, "failed");
    assert.match(saved.runs[0].modelExecution?.error || "", /服务重启/);
    assert.ok(saved.tasks.some((t) => t.kind === "coverage"));
    assert.equal(reopened.list().length, 1);
    assert.equal(service.list()[0].id, view.id);
    assert.ok(saved.activity.some((a) => a.type === "evidence-updated"));
  } finally {
    reopened?.close();
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("case HTTP routes validate input, expose aggregate state and return a Markdown report", async () => {
  const f = fixture();
  const app = express();
  app.use(express.json());
  app.use("/api/cases", createCaseRouter(f.cases));
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res
        .status(
          error instanceof ZodError
            ? 400
            : error instanceof HttpError
              ? error.status
              : 500,
        )
        .json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
    },
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}/api/cases`;
    const bad = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input(), parties: [] }),
    });
    assert.equal(bad.status, 400);
    const made = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input()),
    });
    assert.equal(made.status, 201);
    const file = (await made.json()) as { id: string };
    const report = await fetch(`${base}/${file.id}/report`);
    assert.equal(report.status, 200);
    assert.match(report.headers.get("content-disposition") || "", /attachment/);
    assert.match(await report.text(), /非|不代表 AI 模型实跑/);
    const listing = (await (await fetch(base)).json()) as {
      cases: { id: string }[];
    };
    assert.equal(listing.cases[0].id, file.id);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    f.cleanup();
  }
});
