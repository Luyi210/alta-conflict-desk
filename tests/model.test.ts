import { test } from "node:test";
import assert from "node:assert/strict";
import { modelReview } from "../server/model.ts";
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
    process.env.MODEL_BASE_URL = "https://model.invalid/v1";
    globalThis.fetch = (async (url: URL | string, options?: RequestInit) => {
      assert.equal(String(url), "https://model.invalid/v1/chat/completions");
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
    assert.ok(received.length > 0);
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
