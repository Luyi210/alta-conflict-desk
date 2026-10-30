import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { modelReview } from "../server/model.ts";
import { Store } from "../server/store.ts";
import { ConnectorManager } from "../server/connectors.ts";
import { ToolDeskService } from "../server/tool-desk.ts";
import type { Run, Trace } from "../shared/types.ts";

// These tests simulate provider HTTP responses and tool results; they are NOT live AI validation.
const entity = {
  lei: "MP6I5ZYZBEU3UXPYFY54",
  name: "HSBC BANK PLC",
  jurisdiction: "GB",
  status: "ACTIVE",
  address: "London",
  sourceUrl: "https://api.gleif.org/api/v1/lei-records/MP6I5ZYZBEU3UXPYFY54",
  fetchedAt: "2026-10-27T01:00:00.000Z",
};
const run: Run = {
  id: "model-unit-test",
  matterName: "虚构测试事项",
  prospectiveClient: "虚构客户",
  partyRole: "交易对方",
  entity,
  mode: "ai",
  status: "running",
  createdAt: entity.fetchedAt,
  findings: [],
  relations: [],
  traces: [],
  gaps: ["仅模拟台账"],
  summary: "",
};
type ModelCall = Parameters<typeof modelReview>[1];
type Message = {
  role: string;
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
};
const tool = (id: string, name: string, args: Record<string, unknown>) => ({
  id,
  type: "function",
  function: { name, arguments: JSON.stringify(args) },
});
const final = (ids: string[]): Message => ({
  role: "assistant",
  content: JSON.stringify({
    summary: "发现待人工核实的台账线索；尚未作出收案判断。",
    citedTraceIds: ids,
  }),
});

async function withMockProvider(
  messages: Message[],
  work: () => Promise<void>,
  options: {
    baseUrl?: string;
    onRequest?: (body: Record<string, unknown>) => void;
  } = {},
) {
  const originalFetch = globalThis.fetch;
  const previous = Object.fromEntries(
    ["MODEL_API_KEY", "MODEL_NAME", "MODEL_BASE_URL"].map((key) => [
      key,
      process.env[key],
    ]),
  );
  const received: unknown[] = [];
  let responseIndex = 0;
  try {
    process.env.MODEL_API_KEY = "dummy-unit-test-key";
    process.env.MODEL_NAME = "mock-model";
    const base = options.baseUrl || "https://model.invalid/v1";
    process.env.MODEL_BASE_URL = base;
    globalThis.fetch = (async (url: URL | string, options?: RequestInit) => {
      assert.equal(String(url), `${base.replace(/\/$/, "")}/chat/completions`);
      assert.equal(
        (options?.headers as Record<string, string>).Authorization,
        "Bearer dummy-unit-test-key",
      );
      received.push(JSON.parse(options!.body as string));
      assert.ok(
        responseIndex < messages.length,
        "Unexpected additional model request",
      );
      return Response.json({
        choices: [{ message: messages[responseIndex++] }],
      });
    }) as typeof fetch;
    await work();
    assert.equal(responseIndex, messages.length);
    assert.equal(received.length, messages.length);
    for (const body of received)
      options.onRequest?.(body as Record<string, unknown>);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("mock model: a summary without actual tool calls is rejected even when it invents trace citations", async () => {
  let called = false;
  const forbiddenCall: ModelCall = async () => {
    called = true;
    throw new Error("No tool call should be attempted");
  };
  await withMockProvider(
    [final(["invented-gleif", "invented-ledger"])],
    async () => {
      await assert.rejects(
        modelReview(run, forbiddenCall),
        /未实际调用并引用两个数据源/,
      );
      assert.equal(called, false);
    },
  );
});

test("mock model: out-of-scope LEIs and unauthorized tools are blocked before the MCP boundary", async () => {
  const cases = [
    {
      request: tool("t1", "gleif_get_entity", { lei: "21380081EP12LC86CB82" }),
      message: /未授权的主体/,
    },
    {
      request: tool("t2", "ledger_execute_sql", {
        lei: entity.lei,
        sql: "DELETE FROM matters",
      }),
      message: /未授权的工具/,
    },
  ];
  for (const scenario of cases) {
    let called = false;
    const forbiddenCall: ModelCall = async () => {
      called = true;
      throw new Error("Unauthorized request reached MCP");
    };
    await withMockProvider(
      [{ role: "assistant", content: null, tool_calls: [scenario.request] }],
      async () => {
        await assert.rejects(modelReview(run, forbiddenCall), scenario.message);
        assert.equal(called, false);
      },
    );
  }
});

test("mock model: completion requires allowed GLEIF and ledger calls plus citations to their returned trace IDs", async () => {
  const calls: {
    connector: string;
    tool: string;
    args: Record<string, unknown>;
  }[] = [];
  const call: ModelCall = async <T>(
    connector: "gleif" | "ledger",
    name: string,
    args: Record<string, unknown>,
  ) => {
    calls.push({ connector, tool: name, args });
    const trace: Trace = {
      id: `trace-${connector}`,
      connector,
      tool: name,
      args,
      startedAt: entity.fetchedAt,
      durationMs: 0,
      status: "success",
      initiator: "model",
    };
    return {
      data: (connector === "gleif"
        ? { entity }
        : { matches: [], synthetic: true }) as T,
      trace,
    };
  };
  const requests = [
    tool("entity-call", "gleif_get_entity", { lei: entity.lei }),
    tool("ledger-call", "ledger_search_matters", {
      lei: entity.lei,
      name: "Untrusted model-supplied name",
    }),
  ];
  await withMockProvider(
    [
      { role: "assistant", content: null, tool_calls: requests },
      final(["trace-gleif", "trace-ledger"]),
    ],
    async () => {
      const summary = await modelReview(run, call);
      assert.deepEqual(calls, [
        { connector: "gleif", tool: "get_entity", args: { lei: entity.lei } },
        {
          connector: "ledger",
          tool: "search_matters",
          args: { lei: entity.lei, name: entity.name },
        },
      ]);
      assert.match(summary, /引用调用：trace-gleif、trace-ledger/);
      assert.match(summary, /尚未作出收案判断/);
    },
  );
});

test("mock model: malformed JSON, extra parameters, and oversized batches never reach a tool", async () => {
  const cases: { message: Message; expected: RegExp }[] = [
    {
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "bad-json",
            type: "function",
            function: { name: "gleif_get_entity", arguments: "{" },
          },
        ],
      },
      expected: /不是合法 JSON/,
    },
    {
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          tool("extra", "gleif_get_entity", {
            lei: entity.lei,
            sql: "not permitted",
          }),
        ],
      },
      expected: /输入 schema/,
    },
    {
      message: {
        role: "assistant",
        content: null,
        tool_calls: Array.from({ length: 7 }, (_, i) =>
          tool(`call-${i}`, "gleif_get_entity", { lei: entity.lei }),
        ),
      },
      expected: /超过本次核查上限/,
    },
    {
      message: { role: "assistant", content: "```json\n{}\n```" },
      expected: /可验证的 JSON/,
    },
    {
      message: {
        role: "assistant",
        content: JSON.stringify({ summary: 17, citedTraceIds: ["a", "b"] }),
      },
      expected: /输出 schema/,
    },
  ];
  for (const scenario of cases) {
    let called = false;
    const progress: NonNullable<Run["modelExecution"]>[] = [];
    await withMockProvider([scenario.message], async () => {
      await assert.rejects(
        modelReview(
          run,
          async () => {
            called = true;
            throw new Error("Must not call MCP");
          },
          { onProgress: (state) => progress.push(state) },
        ),
        scenario.expected,
      );
      assert.equal(called, false);
      assert.equal(progress.at(-1)?.status, "failed");
      assert.equal(progress.at(-1)?.toolCallCount, 0);
      assert.equal(progress.at(-1)?.rounds, 1);
    });
  }
});

test("mock model: disabled tools are excluded and missing a required source fails before any provider request", async () => {
  await withMockProvider([], async () => {
    const progress: NonNullable<Run["modelExecution"]>[] = [];
    await assert.rejects(
      modelReview(
        run,
        async () => {
          throw new Error("Must not call MCP");
        },
        {
          tools: () => [
            {
              connector: "gleif",
              name: "get_entity",
              description: "mock catalog",
              available: true,
              enabled: true,
              readOnly: true,
              inputSchema: {
                type: "object",
                properties: { lei: { type: "string" } },
                required: ["lei"],
              },
            },
            {
              connector: "ledger",
              name: "search_matters",
              description: "disabled mock catalog",
              available: true,
              enabled: false,
              readOnly: true,
              inputSchema: { type: "object" },
            },
          ],
          onProgress: (state) => progress.push(state),
        },
      ),
      /未连接或已禁用/,
    );
    assert.equal(progress.at(-1)?.status, "failed");
    assert.equal(progress.at(-1)?.rounds, 0);
    assert.equal(progress.at(-1)?.toolCallCount, 0);
  });
});

test("mock model: a failed or mismatched returned trace cannot be used as evidence", async () => {
  for (const patch of [
    { status: "error" as const },
    { connector: "ledger" as const },
    { args: { lei: "21380081EP12LC86CB82" } },
  ]) {
    await withMockProvider(
      [
        {
          role: "assistant",
          content: null,
          tool_calls: [
            tool("identity", "gleif_get_entity", { lei: entity.lei }),
          ],
        },
      ],
      async () => {
        const callback: ModelCall = async <T>() => ({
          data: { entity } as T,
          trace: {
            id: "bad-trace",
            connector: "gleif",
            tool: "get_entity",
            args: { lei: entity.lei },
            startedAt: entity.fetchedAt,
            durationMs: 0,
            status: "success",
            ...patch,
          },
        });
        await assert.rejects(
          modelReview(run, callback),
          /凭据与本次请求不一致/,
        );
      },
    );
  }
});

test("mock model HTTP + real SQLite MCP: allowed tool flow records real local evidence and completion counters (GLEIF response mocked)", async () => {
  // This is protocol/integration validation, NOT a successful external AI run.
  const dir = mkdtempSync(join(tmpdir(), "alta-model-mcp-test-"));
  const store = new Store(dir);
  const connectors = new ConnectorManager(dir);
  const desk = new ToolDeskService(store, connectors);
  try {
    await connectors.connect("ledger");
    await connectors.connect("gleif"); // tools/list only, no public network request.
    const responses: Message[] = [
      {
        role: "assistant",
        content: null,
        tool_calls: [
          tool("identity", "gleif_get_entity", { lei: entity.lei }),
          tool("ledger", "ledger_search_matters", {
            name: "Model invented name",
            lei: entity.lei,
          }),
        ],
      },
      final([]),
    ];
    const traces: Trace[] = [];
    const progress: NonNullable<Run["modelExecution"]>[] = [];
    const callback: ModelCall = async <T>(
      connector: "gleif" | "ledger",
      name: string,
      args: Record<string, unknown>,
    ) => {
      const result =
        connector === "ledger"
          ? await connectors.call<T>(connector, name, args, "model")
          : {
              data: { entity } as T,
              trace: {
                id: "MOCK-GLEIF-TRACE",
                connector,
                tool: name,
                args,
                startedAt: entity.fetchedAt,
                durationMs: 0,
                status: "success" as const,
                initiator: "model" as const,
              },
            };
      traces.push(result.trace);
      responses[1] = final(traces.map((trace) => trace.id));
      return result;
    };
    await withMockProvider(responses, async () => {
      const summary = await modelReview(run, callback, {
        tools: () => connectors.catalog(),
        validateCall: (connector, name, args) =>
          connectors.validateCall(connector, name, args),
        onProgress: (state) => progress.push(state),
      });
      assert.match(summary, /MOCK-GLEIF-TRACE/);
      assert.equal(traces.length, 2);
      const ledgerTrace = traces.find((trace) => trace.connector === "ledger")!;
      assert.equal(ledgerTrace.args.name, entity.name);
      assert.equal(
        (ledgerTrace.result as { synthetic: boolean }).synthetic,
        true,
      );
      assert.ok(
        (ledgerTrace.result as { matches: unknown[] }).matches.length > 0,
      );
      assert.deepEqual(progress.at(-1), {
        status: "completed",
        model: "mock-model",
        toolCallCount: 2,
        rounds: 2,
      });
      assert.match(summary, new RegExp(ledgerTrace.id));
    });
  } finally {
    await desk.close();
    await connectors.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("mock provider HTTP: only the exact DeepSeek host disables thinking on every tool round", async () => {
  // Every response and tool result in this test is mocked; this is not live AI validation.
  for (const baseUrl of [
    "https://api.deepseek.com",
    "https://api.deepseek.com/v1",
    "https://model.invalid/v1",
    "https://api.deepseek.com.proxy.invalid/v1",
  ]) {
    const requests: Record<string, unknown>[] = [];
    const callback: ModelCall = async <T>(
      connector: "gleif" | "ledger",
      name: string,
      args: Record<string, unknown>,
    ) => ({
      data: (connector === "gleif"
        ? { entity }
        : { matches: [], synthetic: true }) as T,
      trace: {
        id: `mock-${connector}`,
        connector,
        tool: name,
        args,
        startedAt: entity.fetchedAt,
        durationMs: 0,
        status: "success",
        initiator: "model",
      },
    });
    await withMockProvider(
      [
        {
          role: "assistant",
          content: null,
          tool_calls: [
            tool("identity", "gleif_get_entity", { lei: entity.lei }),
            tool("ledger", "ledger_search_matters", {
              lei: entity.lei,
              name: entity.name,
            }),
          ],
        },
        final(["mock-gleif", "mock-ledger"]),
      ],
      async () => {
        const summary = await modelReview(run, callback);
        assert.match(summary, /引用调用：mock-gleif、mock-ledger/);
      },
      { baseUrl, onRequest: (body) => requests.push(body) },
    );
    assert.deepEqual(
      requests.map((body) => body.tool_choice),
      ["required", "auto"],
    );
    for (const body of requests) {
      if (new URL(baseUrl).hostname === "api.deepseek.com") {
        assert.deepEqual(body.thinking, { type: "disabled" });
      } else {
        assert.equal(
          Object.hasOwn(body, "thinking"),
          false,
          `Unexpected provider-specific setting for ${baseUrl}`,
        );
      }
    }
  }
});

test("structured briefs carry matter context and validate every item citation against actual model calls", async () => {
  for (const forged of [false, true]) {
    let published: Run["modelBrief"];
    const contextRun = {
      ...run,
      context: "虚构融资中担保范围仅限本次交易",
      jurisdiction: "香港（背景）",
    };
    const callback: ModelCall = async <T>(
      connector: "gleif" | "ledger",
      name: string,
      args: Record<string, unknown>,
    ) => ({
      data: (connector === "gleif" ? { entity } : { matches: [] }) as T,
      trace: {
        id: `brief-${connector}`,
        connector,
        tool: name,
        args,
        startedAt: entity.fetchedAt,
        durationMs: 0,
        status: "success",
        initiator: "model",
      },
    });
    const result: Message = {
      role: "assistant",
      content: JSON.stringify({
        summary: "已核实登记身份，仍需确认担保范围。",
        citedTraceIds: ["brief-gleif", "brief-ledger"],
        facts: [
          {
            text: "登记来源返回所选身份",
            traceIds: [forged ? "made-up" : "brief-gleif"],
          },
        ],
        questions: [{ text: "担保范围是否与既有事项相关？", traceIds: [] }],
        nextSteps: [{ text: "核对本次融资委托范围说明", traceIds: [] }],
      }),
    };
    await withMockProvider(
      [
        {
          role: "assistant",
          content: null,
          tool_calls: [
            tool("b1", "gleif_get_entity", { lei: entity.lei }),
            tool("b2", "ledger_search_matters", {
              lei: entity.lei,
              name: entity.name,
            }),
          ],
        },
        result,
      ],
      async () => {
        const action = () =>
          modelReview(contextRun, callback, {
            onBrief: (brief) => {
              published = brief;
            },
          });
        if (forged) {
          await assert.rejects(action, /模型分项引用/);
          assert.equal(published, undefined);
        } else {
          await action();
          assert.ok(
            published?.facts?.some((fact) => fact.text.includes(entity.lei)),
          );
          assert.ok(
            !published?.facts?.some(
              (fact) => fact.text === "登记来源返回所选身份",
            ),
          );
          assert.equal(published?.nextSteps?.length, 1);
        }
      },
      {
        onRequest: (body) => {
          const messages = body.messages as { role: string; content: string }[];
          const context = JSON.parse(
            messages.find((m) => m.role === "user")!.content,
          );
          assert.equal(context.matterContext, contextRun.context);
          assert.equal(context.jurisdictionContext, contextRun.jurisdiction);
          assert.equal(context.prospectiveClient, contextRun.prospectiveClient);
        },
      },
    );
  }
});

test("parent evidence must be fetched and cited before a model brief can complete", async () => {
  const parent = {
    ...entity,
    name: "HSBC HOLDINGS PLC",
    lei: "MLU0ZO3ML4LN2LL2TL39",
  };
  const scopedRun: Run = {
    ...run,
    relations: [
      {
        type: "direct-parent",
        entity: parent,
        sourceUrl: entity.sourceUrl,
        fetchedAt: entity.fetchedAt,
      },
    ],
  };
  const calls: string[] = [];
  const callback: ModelCall = async <T>(
    connector: "gleif" | "ledger",
    name: string,
    args: Record<string, unknown>,
  ) => {
    const id = `${connector}-${args.lei}`;
    calls.push(id);
    return {
      data: {} as T,
      trace: {
        id,
        connector,
        tool: name,
        args,
        startedAt: entity.fetchedAt,
        durationMs: 0,
        status: "success",
        initiator: "model",
      },
    };
  };
  await withMockProvider(
    [
      {
        role: "assistant",
        content: null,
        tool_calls: [
          tool("p1", "gleif_get_entity", { lei: entity.lei }),
          tool("p2", "ledger_search_matters", {
            lei: entity.lei,
            name: entity.name,
          }),
        ],
      },
      final([`gleif-${entity.lei}`, `ledger-${entity.lei}`]),
      {
        role: "assistant",
        content: null,
        tool_calls: [
          tool("p3", "ledger_search_matters", {
            lei: parent.lei,
            name: parent.name,
          }),
        ],
      },
      final([
        `gleif-${entity.lei}`,
        `ledger-${entity.lei}`,
        `ledger-${parent.lei}`,
      ]),
    ],
    async () => {
      const summary = await modelReview(scopedRun, callback);
      assert.equal(calls.length, 3);
      assert.ok(summary.includes(`ledger-${parent.lei}`));
    },
  );
});
