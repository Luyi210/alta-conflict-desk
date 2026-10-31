import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ConnectorId, ToolExecution, ToolInfo } from "../shared/types.ts";
import {
  ConnectorManager,
  HttpError,
  ToolError,
  connectorIds,
} from "./connectors.ts";
import { Store } from "./store.ts";

export const toolCallSchema = z
  .object({
    connector: z.enum(["gleif", "ledger", "documents"]),
    tool: z.string().min(1).max(100),
    args: z.record(z.string(), z.unknown()),
  })
  .strict();
export const toolPermissionSchema = z
  .object({
    connector: z.enum(["gleif", "ledger", "documents"]),
    tool: z.string().min(1).max(100),
    enabled: z.boolean(),
  })
  .strict();

export class ToolDeskService {
  private jobs = new Set<Promise<void>>();
  private closing = false;
  constructor(
    private store: Store,
    private connectors: ConnectorManager,
  ) {
    store.db.exec(`
      CREATE TABLE IF NOT EXISTS tool_permissions (connector TEXT NOT NULL, tool TEXT NOT NULL, enabled INTEGER NOT NULL, PRIMARY KEY(connector, tool));
      CREATE TABLE IF NOT EXISTS tool_catalog (connector TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS tool_executions (id TEXT PRIMARY KEY, createdAt TEXT NOT NULL, data TEXT NOT NULL);
    `);
    connectors.setToolPolicy((connector, tool) => {
      const row = store.db
        .prepare(
          "SELECT enabled FROM tool_permissions WHERE connector=? AND tool=?",
        )
        .get(connector, tool) as { enabled: number } | undefined;
      return row?.enabled !== 0;
    });
    connectors.setDiscoveryObserver((connector, tools) => {
      store.db
        .prepare("INSERT OR REPLACE INTO tool_catalog VALUES (?, ?)")
        .run(connector, JSON.stringify(tools));
    });
    for (const connector of connectorIds) {
      const row = store.db
        .prepare("SELECT data FROM tool_catalog WHERE connector=?")
        .get(connector) as { data: string } | undefined;
      if (row)
        connectors.restoreDiscovered(
          connector,
          JSON.parse(row.data) as ToolInfo[],
        );
      // Also supports construction after a connector was already connected.
      const tools = connectors.get(connector).tools;
      if (tools.length)
        store.db
          .prepare("INSERT OR REPLACE INTO tool_catalog VALUES (?, ?)")
          .run(connector, JSON.stringify(tools));
    }
    for (const execution of this.listCalls()) {
      if (execution.status === "queued" || execution.status === "running") {
        execution.status = "error";
        execution.error = "服务重启中断了调用，结果未知；可创建一次新的重试。";
        execution.completedAt = new Date().toISOString();
        this.save(execution);
        store.audit("tool-execution-interrupted", { id: execution.id });
      }
    }
  }
  snapshot() {
    return { tools: this.connectors.catalog(), calls: this.listCalls() };
  }
  private listCalls(): ToolExecution[] {
    return (
      this.store.db
        .prepare(
          "SELECT data FROM tool_executions ORDER BY createdAt DESC, rowid DESC",
        )
        .all() as { data: string }[]
    ).map((row) => JSON.parse(row.data));
  }
  private save(execution: ToolExecution) {
    this.store.db
      .prepare("INSERT OR REPLACE INTO tool_executions VALUES (?, ?, ?)")
      .run(execution.id, execution.createdAt, JSON.stringify(execution));
  }
  get(id: string): ToolExecution {
    const row = this.store.db
      .prepare("SELECT data FROM tool_executions WHERE id=?")
      .get(id) as { data: string } | undefined;
    if (!row) throw new HttpError(404, "工具调用不存在");
    return JSON.parse(row.data);
  }
  permission(input: z.infer<typeof toolPermissionSchema>) {
    const parsed = toolPermissionSchema.parse(input);
    if (
      !this.connectors
        .catalog()
        .some((t) => t.connector === parsed.connector && t.name === parsed.tool)
    )
      throw new HttpError(404, "未发现该工具，请先连接对应 MCP 服务");
    this.store.db
      .prepare("INSERT OR REPLACE INTO tool_permissions VALUES (?, ?, ?)")
      .run(parsed.connector, parsed.tool, Number(parsed.enabled));
    this.store.audit("tool-permission", parsed);
    return { tools: this.connectors.catalog() };
  }
  create(
    input: z.infer<typeof toolCallSchema>,
    retryOf?: string,
  ): ToolExecution {
    if (this.closing) throw new HttpError(503, "服务正在关闭，请稍后重试");
    const parsed = toolCallSchema.parse(input);
    this.connectors.validateCall(parsed.connector, parsed.tool, parsed.args);
    const execution: ToolExecution = {
      id: randomUUID(),
      ...structuredClone(parsed),
      status: "queued",
      createdAt: new Date().toISOString(),
      ...(retryOf ? { retryOf } : {}),
    };
    this.save(execution);
    this.store.audit("tool-execution-created", {
      id: execution.id,
      connector: execution.connector,
      tool: execution.tool,
      retryOf,
    });
    // Defer work until after the 201 response. Calls are read-only and cannot be falsely "cancelled".
    const job = new Promise<void>((resolve) => setImmediate(resolve))
      .then(() => this.execute(execution))
      .finally(() => this.jobs.delete(job));
    this.jobs.add(job);
    return structuredClone(execution);
  }
  private async execute(execution: ToolExecution) {
    execution.status = "running";
    this.save(execution);
    try {
      // Re-check connection, permissions, and schema in the shared gateway at execution time.
      const result = await this.connectors.call(
        execution.connector,
        execution.tool,
        execution.args,
        "user",
      );
      execution.trace = result.trace;
      execution.status = "success";
    } catch (error) {
      execution.status = "error";
      execution.error = error instanceof Error ? error.message : "工具调用失败";
      if (error instanceof ToolError) execution.trace = error.trace;
    } finally {
      execution.completedAt = new Date().toISOString();
      this.save(execution);
      this.store.audit("tool-execution-finished", {
        id: execution.id,
        status: execution.status,
        traceId: execution.trace?.id,
        error: execution.error,
      });
    }
  }
  retry(id: string) {
    const previous = this.get(id);
    if (previous.status !== "error")
      throw new HttpError(409, "仅失败调用可以重试；正在执行的请求请等待结果");
    return this.create(
      {
        connector: previous.connector,
        tool: previous.tool,
        args: previous.args,
      },
      previous.id,
    );
  }
  async close() {
    this.closing = true;
    await Promise.allSettled(this.jobs);
  }
}
