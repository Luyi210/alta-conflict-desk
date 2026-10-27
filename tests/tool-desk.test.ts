import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ConnectorManager, HttpError } from "../server/connectors.ts";
import { Store } from "../server/store.ts";
import { ToolDeskService } from "../server/tool-desk.ts";
import type { ToolExecution } from "../shared/types.ts";

const lei = "MP6I5ZYZBEU3UXPYFY54";
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "alta-tool-desk-"));
  const store = new Store(dir);
  const connectors = new ConnectorManager(dir, (kind, data) =>
    store.audit(kind, data),
  );
  const desk = new ToolDeskService(store, connectors);
  return {
    dir,
    store,
    connectors,
    desk,
    async close() {
      await desk.close();
      await connectors.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
async function completed(desk: ToolDeskService, id: string) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const execution = desk.get(id);
    if (execution.status === "success" || execution.status === "error")
      return execution;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Local MCP test exceeded 5 seconds");
}

test("real SQLite MCP: catalog uses discovered schemas; one permission blocks every initiator and persists after restart", async () => {
  const f = fixture();
  try {
    assert.deepEqual(f.desk.snapshot().tools, []);
    await f.connectors.connect("ledger");
    const tool = f.desk
      .snapshot()
      .tools.find((t) => t.name === "search_matters")!;
    assert.equal(tool.available, true);
    assert.equal(tool.readOnly, true);
    assert.equal(
      (tool.inputSchema.properties as Record<string, { minLength?: number }>)
        .name.minLength,
      2,
    );
    assert.throws(
      () =>
        f.desk.create({
          connector: "ledger",
          tool: "search_matters",
          args: { name: "x" },
        }),
      /MCP schema/,
    );
    assert.throws(
      () =>
        f.desk.create({
          connector: "ledger",
          tool: "search_matters",
          args: { name: "HSBC", lei: "bad" },
        }),
      /MCP schema/,
    );
    assert.throws(
      () =>
        f.desk.create({ connector: "ledger", tool: "execute_sql", args: {} }),
      /未获授权/,
    );
    f.desk.permission({
      connector: "ledger",
      tool: "search_matters",
      enabled: false,
    });
    for (const initiator of ["user", "rules", "model"] as const) {
      await assert.rejects(
        f.connectors.call(
          "ledger",
          "search_matters",
          { name: "HSBC", lei },
          initiator,
        ),
        (error: unknown) => error instanceof HttpError && error.status === 403,
      );
    }
    assert.equal(
      f.desk.snapshot().tools.find((t) => t.name === "search_matters")!.enabled,
      false,
    );
    await f.desk.close();
    await f.connectors.close();
    f.store.close();
    const reopenedStore = new Store(f.dir);
    const reopenedConnectors = new ConnectorManager(f.dir);
    const reopenedDesk = new ToolDeskService(reopenedStore, reopenedConnectors);
    try {
      const cached = reopenedDesk
        .snapshot()
        .tools.find((t) => t.name === "search_matters")!;
      assert.equal(cached.available, false);
      assert.equal(cached.enabled, false);
      assert.deepEqual(cached.inputSchema, tool.inputSchema);
      await reopenedConnectors.connect("ledger");
      await assert.rejects(
        reopenedConnectors.call(
          "ledger",
          "search_matters",
          { name: "HSBC", lei },
          "rules",
        ),
        /已禁用/,
      );
      reopenedDesk.permission({
        connector: "ledger",
        tool: "search_matters",
        enabled: true,
      });
      assert.equal(
        (
          await reopenedConnectors.call(
            "ledger",
            "search_matters",
            { name: "HSBC", lei },
            "rules",
          )
        ).trace.status,
        "success",
      );
      await reopenedConnectors.disconnect("ledger");
      assert.equal(reopenedDesk.snapshot().tools.length, 2);
      assert.ok(reopenedDesk.snapshot().tools.every((t) => !t.available));
      await assert.rejects(
        reopenedConnectors.call("ledger", "ledger_info", {}),
        /尚未连接/,
      );
    } finally {
      await reopenedDesk.close();
      await reopenedConnectors.close();
      reopenedStore.close();
    }
  } finally {
    // The first store was closed to simulate a real restart.
    await f.desk.close();
    await f.connectors.close();
    try {
      f.store.close();
    } catch {
      /* already closed */
    }
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("real SQLite MCP: async executions retain actual output/errors; retry creates a new linked execution", async () => {
  const f = fixture();
  try {
    await f.connectors.connect("ledger");
    const queued = f.desk.create({
      connector: "ledger",
      tool: "ledger_info",
      args: {},
    });
    assert.equal(queued.status, "queued");
    const successful = await completed(f.desk, queued.id);
    assert.equal(successful.status, "success");
    assert.equal(successful.trace?.initiator, "user");
    assert.equal(
      (successful.trace?.result as { synthetic: boolean }).synthetic,
      true,
    );
    assert.throws(() => f.desk.retry(successful.id), /仅失败调用/);
    const ledger = new DatabaseSync(join(f.dir, "ledger.sqlite"));
    try {
      ledger.exec("ALTER TABLE matters RENAME TO unavailable_matters");
      const broken = await completed(
        f.desk,
        f.desk.create({ connector: "ledger", tool: "ledger_info", args: {} })
          .id,
      );
      assert.equal(broken.status, "error");
      assert.equal(broken.trace?.status, "error");
      assert.match(broken.error!, /matters/);
      ledger.exec("ALTER TABLE unavailable_matters RENAME TO matters");
      const retry = f.desk.retry(broken.id);
      assert.notEqual(retry.id, broken.id);
      assert.equal(retry.retryOf, broken.id);
      assert.equal((await completed(f.desk, retry.id)).status, "success");
      assert.equal(f.desk.get(broken.id).status, "error");
      assert.ok(
        f.desk
          .snapshot()
          .calls.some(
            (call) =>
              call.id === successful.id &&
              call.trace?.id === successful.trace?.id,
          ),
      );
    } finally {
      ledger.close();
    }
  } finally {
    await f.close();
  }
});

test("queued calls recheck permission before execution; the blocked request creates no fake MCP trace", async () => {
  const f = fixture();
  try {
    await f.connectors.connect("ledger");
    const queued = f.desk.create({
      connector: "ledger",
      tool: "ledger_info",
      args: {},
    });
    f.desk.permission({
      connector: "ledger",
      tool: "ledger_info",
      enabled: false,
    });
    const blocked = await completed(f.desk, queued.id);
    assert.equal(blocked.status, "error");
    assert.match(blocked.error!, /已禁用/);
    assert.equal(blocked.trace, undefined);
    f.desk.permission({
      connector: "ledger",
      tool: "ledger_info",
      enabled: true,
    });
    assert.equal(
      (await completed(f.desk, f.desk.retry(queued.id).id)).status,
      "success",
    );
  } finally {
    await f.close();
  }
});

test("restart marks interrupted jobs as failed and retains prior successful calls", async () => {
  const f = fixture();
  try {
    const interrupted: ToolExecution = {
      id: "interrupted",
      connector: "ledger",
      tool: "ledger_info",
      args: {},
      status: "running",
      createdAt: new Date().toISOString(),
    };
    f.store.db
      .prepare("INSERT INTO tool_executions VALUES (?, ?, ?)")
      .run(interrupted.id, interrupted.createdAt, JSON.stringify(interrupted));
    const recovered = new ToolDeskService(f.store, f.connectors);
    try {
      const call = recovered.get(interrupted.id);
      assert.equal(call.status, "error");
      assert.match(call.error!, /重启中断/);
      assert.equal(call.trace, undefined);
      assert.ok(call.completedAt);
    } finally {
      await recovered.close();
    }
  } finally {
    await f.close();
  }
});

test("real SQLite MCP server also rejects malformed arguments when the host validation is bypassed", async () => {
  const f = fixture();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", resolve("mcp/ledger.ts")],
    cwd: process.cwd(),
    env: { PATH: process.env.PATH || "", DATA_DIR: f.dir },
    stderr: "pipe",
  });
  const client = new Client({ name: "server-schema-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const output = await client.callTool({
      name: "search_matters",
      arguments: { name: "x", lei: "bad" },
    });
    assert.equal(output.isError, true);
    assert.match(JSON.stringify(output.content), /validation|Invalid|invalid/);
  } finally {
    await client.close();
    await transport.close();
    await f.close();
  }
});
