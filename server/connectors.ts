import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import type { JsonSchemaValidator } from "@modelcontextprotocol/sdk/validation";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { gleifNodeNetworkArgs } from "../mcp/network-policy.ts";
import type {
  CatalogTool,
  Connector,
  ConnectorId,
  ToolInfo,
  Trace,
} from "../shared/types.ts";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export class ToolError extends Error {
  constructor(
    message: string,
    public trace: Trace,
  ) {
    super(message);
  }
}
export const connectorIds: ConnectorId[] = ["gleif", "ledger", "documents"];
const allowedTools: Record<ConnectorId, string[]> = {
  gleif: ["search_entities", "get_entity", "get_relationships"],
  ledger: ["ledger_info", "search_matters"],
  documents: ["materials_info", "read_material_page"],
};
const root = fileURLToPath(new URL("../", import.meta.url));
type Entry = {
  state: Connector;
  client?: Client;
  transport?: StdioClientTransport;
  changing: boolean;
  validators?: Map<string, JsonSchemaValidator<Record<string, unknown>>>;
};
export class ConnectorManager {
  private schemaValidator = new AjvJsonSchemaValidator();
  private enabled: (id: ConnectorId, tool: string) => boolean = () => true;
  private discovered: (id: ConnectorId, tools: ToolInfo[]) => void = () => {};
  private casePolicy: (
    caseId: string,
    versionId: string,
    model: boolean,
  ) => void = () => {
    throw new HttpError(403, "材料访问策略尚未配置");
  };
  private entries: Record<ConnectorId, Entry> = {
    documents: {
      state: {
        id: "documents",
        name: "案件材料与原文",
        connected: false,
        status: "disconnected",
        tools: [],
      },
      changing: false,
    },
    gleif: {
      state: {
        id: "gleif",
        name: "GLEIF 企业主体",
        connected: false,
        status: "disconnected",
        tools: [],
      },
      changing: false,
    },
    ledger: {
      state: {
        id: "ledger",
        name: "律所客户与事项台账",
        connected: false,
        status: "disconnected",
        tools: [],
      },
      changing: false,
    },
  };
  constructor(
    private dir: string,
    private audit: (kind: string, data: unknown) => void = () => {},
  ) {}
  list() {
    return connectorIds.map((id) => this.get(id));
  }
  get(id: ConnectorId): Connector {
    const state = structuredClone(this.entry(id).state);
    state.tools = state.tools.map((tool) => ({
      ...tool,
      enabled: this.enabled(id, tool.name),
    }));
    return state;
  }
  // One shared policy protects user, rule-engine, model, and connection-test calls.
  setToolPolicy(check: (id: ConnectorId, tool: string) => boolean) {
    this.enabled = check;
  }
  setDiscoveryObserver(observer: (id: ConnectorId, tools: ToolInfo[]) => void) {
    this.discovered = observer;
  }
  setCasePolicy(
    policy: (caseId: string, versionId: string, model: boolean) => void,
  ) {
    this.casePolicy = policy;
  }
  restoreDiscovered(id: ConnectorId, tools: ToolInfo[]) {
    const e = this.entry(id);
    if (!e.state.connected)
      e.state.tools = structuredClone(tools).filter((tool) =>
        allowedTools[id].includes(tool.name),
      );
  }
  catalog(): CatalogTool[] {
    return this.list().flatMap((connector) =>
      connector.tools
        .filter((tool) => tool.inputSchema)
        .map((tool) => ({
          ...tool,
          connector: connector.id,
          enabled: tool.enabled !== false,
          available: connector.connected && !this.entry(connector.id).changing,
          readOnly: tool.readOnly === true,
          inputSchema: tool.inputSchema!,
        })),
    );
  }
  validateCall(
    id: ConnectorId,
    tool: string,
    args: Record<string, unknown>,
    scope?: { caseId: string; model: boolean },
  ) {
    if (id === "documents" && tool !== "materials_info") {
      if (
        !scope ||
        args.caseId !== scope.caseId ||
        args.access !== (scope.model ? "model" : "user")
      )
        throw new HttpError(403, "材料工具只能在已绑定的案件内调用");
      this.casePolicy(scope.caseId, String(args.versionId), scope.model);
    }
    const e = this.entry(id);
    if (!allowedTools[id].includes(tool))
      throw new HttpError(403, "该 MCP 工具未获授权");
    if (!e.client || !e.state.connected || e.changing)
      throw new HttpError(409, `${e.state.name}尚未连接`);
    if (!e.state.tools.some((item) => item.name === tool))
      throw new HttpError(404, "MCP 服务未提供该工具");
    if (!this.enabled(id, tool))
      throw new HttpError(403, `工具 ${tool} 已禁用，请先在工具台启用`);
    const validate = e.validators?.get(tool);
    if (!validate)
      throw new HttpError(409, "尚未取得工具输入 schema，请重新连接 MCP");
    const result = validate(args);
    if (!result.valid)
      throw new HttpError(
        400,
        `工具参数不符合 MCP schema：${result.errorMessage}`,
      );
  }
  private entry(id: ConnectorId) {
    if (!connectorIds.includes(id)) throw new HttpError(404, "未知连接器");
    return this.entries[id];
  }
  async connect(id: ConnectorId) {
    const e = this.entry(id);
    if (e.changing) throw new HttpError(409, "连接器正在切换状态，请稍后重试");
    if (e.client && e.state.connected) return this.get(id);
    e.changing = true;
    try {
      const env: Record<string, string> = { DATA_DIR: resolve(this.dir) };
      for (const key of [
        "PATH",
        "HOME",
        "PUBLIC_API_TIMEOUT_MS",
        "HTTPS_PROXY",
        "HTTP_PROXY",
        "NO_PROXY",
        "NODE_USE_ENV_PROXY",
      ])
        if (process.env[key]) env[key] = process.env[key]!;
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [
          ...(id === "gleif" ? gleifNodeNetworkArgs : []),
          "--import",
          "tsx",
          resolve(root, "mcp", `${id}.ts`),
        ],
        cwd: root,
        env,
        stderr: "pipe",
      });
      const client = new Client({
        name: "conflict-desk-host",
        version: "0.1.0",
      });
      e.transport = transport;
      e.client = client;
      await client.connect(transport, { timeout: 15000 });
      const tools = await client.listTools();
      const discoveredTools = tools.tools.filter((t) =>
        allowedTools[id].includes(t.name),
      );
      e.validators = new Map(
        discoveredTools.map((tool) => [
          tool.name,
          this.schemaValidator.getValidator<Record<string, unknown>>(
            tool.inputSchema,
          ),
        ]),
      );
      e.state = {
        ...e.state,
        connected: true,
        status: "connected",
        error: undefined,
        tools: discoveredTools.map((t) => ({
          name: t.name,
          description: t.description || "",
          inputSchema: structuredClone(t.inputSchema),
          readOnly: t.annotations?.readOnlyHint === true,
        })),
      };
      this.discovered(id, structuredClone(e.state.tools));
      this.audit("mcp-connect", {
        connector: id,
        tools: e.state.tools.map((t) => t.name),
        transport: "stdio",
      });
      return this.get(id);
    } catch (err) {
      await e.client?.close().catch(() => {});
      await e.transport?.close().catch(() => {});
      e.client = undefined;
      e.transport = undefined;
      e.state = {
        ...e.state,
        connected: false,
        status: "error",
        error: (err as Error).message,
      };
      throw new HttpError(502, `MCP 连接失败：${(err as Error).message}`);
    } finally {
      e.changing = false;
    }
  }
  async disconnect(id: ConnectorId) {
    const e = this.entry(id);
    if (e.changing) throw new HttpError(409, "连接器正在切换状态，请稍后重试");
    e.changing = true;
    e.state = {
      ...e.state,
      connected: false,
      status: "disconnected",
      error: undefined,
    };
    const client = e.client;
    const transport = e.transport;
    e.client = undefined;
    e.transport = undefined;
    try {
      await client?.close();
      await transport?.close();
      this.audit("mcp-disconnect", { connector: id });
    } finally {
      e.changing = false;
    }
    return this.get(id);
  }
  async call<T>(
    id: ConnectorId,
    tool: string,
    args: Record<string, unknown>,
    initiator: Trace["initiator"] = "user",
    scope?: { caseId: string; model: boolean },
  ): Promise<{ data: T; trace: Trace }> {
    const e = this.entry(id);
    this.validateCall(id, tool, args, scope);
    const started = Date.now();
    const trace: Trace = {
      id: randomUUID(),
      connector: id,
      tool,
      args: structuredClone(args),
      startedAt: new Date(started).toISOString(),
      durationMs: 0,
      status: "success",
      initiator,
    };
    try {
      const output = await e.client!.callTool(
        { name: tool, arguments: args },
        undefined,
        { timeout: 65000 },
      );
      const content = output.content as Array<{ type: string; text?: string }>;
      const text = content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text || "")
        .join("\n");
      if (output.isError) throw new Error(text || "MCP 工具返回错误");
      const data = JSON.parse(text || "{}") as T;
      // Recheck grants after the MCP return, including revocation during an in-flight call.
      if (id === "documents" && tool !== "materials_info")
        this.validateCall(id, tool, args, scope);
      trace.durationMs = Date.now() - started;
      trace.result = data;
      this.audit("mcp-tool-call", trace);
      return { data, trace };
    } catch (error) {
      trace.durationMs = Date.now() - started;
      trace.status = "error";
      trace.error = (error as Error).message;
      this.audit("mcp-tool-call", trace);
      throw new ToolError(trace.error, trace);
    }
  }
  async test(id: ConnectorId) {
    const e = this.entry(id);
    try {
      await this.call(
        id,
        id === "gleif"
          ? "get_entity"
          : id === "documents"
            ? "materials_info"
            : "ledger_info",
        id === "gleif" ? { lei: "MP6I5ZYZBEU3UXPYFY54" } : {},
      );
      e.state.lastTestAt = new Date().toISOString();
      e.state.status = "connected";
      e.state.error = undefined;
      return this.get(id);
    } catch (err) {
      e.state.error = (err as Error).message;
      if (e.state.connected) e.state.status = "error";
      throw err;
    }
  }
  async close() {
    for (const id of connectorIds) await this.disconnect(id).catch(() => {});
  }
}
