import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  History,
  LoaderCircle,
  Network,
  Play,
  Plug,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { api, post } from "./api";
import type {
  CatalogTool,
  ConnectorId,
  ToolExecution,
  Trace,
} from "../shared/types";
import "./tool-desk.css";

type Props = {
  onError: (message: string) => void;
  onTrace: (trace: Trace) => void;
  onConnections: () => void;
};
type Schema = Record<string, unknown>;
type Draft = Record<string, string>;
type Catalog = { tools: CatalogTool[]; calls: ToolExecution[] };

const sources: Record<ConnectorId, string> = {
  gleif: "GLEIF 企业身份",
  ledger: "律所事项台账",
};
// These labels explain discovered tools; they never add tools to the catalog.
const labels: Record<string, { title: string; purpose: string }> = {
  search_entities: {
    title: "查找企业身份",
    purpose: "用名称或 LEI 找到候选企业，供律师核实是否为同一主体。",
  },
  get_entity: {
    title: "核验企业登记",
    purpose: "按已知 LEI 读取企业登记名称、状态及司法辖区。",
  },
  get_relationships: {
    title: "查看母公司关系",
    purpose: "查询公开的直接及最终会计合并母公司，补充关联主体线索。",
  },
  ledger_info: {
    title: "检查台账范围",
    purpose: "查看本地台账记录数量、数据来源及只读权限。",
  },
  search_matters: {
    title: "比对律所事项",
    purpose: "用企业名称和 LEI 比对本地事项，寻找需要人工复核的记录。",
  },
};
const fieldNames: Record<string, string> = {
  query: "企业名称或 LEI",
  lei: "LEI 企业身份编码",
  name: "已核实的企业名称",
};
const statusNames = {
  queued: "已提交",
  running: "执行中",
  success: "已返回",
  error: "调用失败",
};
const HSBC_LEI = "MP6I5ZYZBEU3UXPYFY54";
const keyOf = (tool: { connector: ConnectorId; name: string }) =>
  `${tool.connector}:${tool.name}`;
const titleOf = (name: string) => labels[name]?.title || name;
const isPending = (call: ToolExecution) =>
  call.status === "queued" || call.status === "running";
const objectValue = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const fieldsOf = (schema: Schema): [string, Schema][] =>
  objectValue(schema.properties)
    ? Object.entries(schema.properties).map(([name, value]) => [
        name,
        objectValue(value) ? value : {},
      ])
    : [];
const isRequired = (schema: Schema, name: string) =>
  Array.isArray(schema.required) && schema.required.includes(name);
const formatted = (value: unknown) => JSON.stringify(value, null, 2) ?? "null";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "请求未完成，请稍后重试。";
const inputSummary = (args: Record<string, unknown>) => {
  const values = [args.query, args.name, args.lei].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return values.length
    ? [...new Set(values)].join(" · ")
    : Object.keys(args).length
      ? "展开结果查看输入参数"
      : "无需输入参数";
};
const stamp = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

function defaultsFor(tool: CatalogTool): Draft {
  return Object.fromEntries(
    fieldsOf(tool.inputSchema).map(([name, field]) => [
      name,
      field.default === undefined
        ? ""
        : typeof field.default === "string"
          ? field.default
          : JSON.stringify(field.default),
    ]),
  );
}

function parseDraft(tool: CatalogTool, draft: Draft) {
  const args: Record<string, unknown> = {};
  for (const [name, field] of fieldsOf(tool.inputSchema)) {
    const value = draft[name] ?? "";
    if (value.trim() === "") continue;
    if (field.type === "number" || field.type === "integer") {
      args[name] = Number(value);
    } else if (field.type === "boolean") {
      args[name] = value === "true";
    } else if (field.type === "string") {
      args[name] = value.trim();
    } else {
      try {
        args[name] = JSON.parse(value);
      } catch {
        throw new Error(`${fieldNames[name] || name} 需要填写有效的 JSON。`);
      }
    }
  }
  return args;
}

function parseJson(value: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(
      'JSON 格式不正确，请使用双引号并检查逗号，例如 {"query":"HSBC"}。',
    );
  }
  if (!objectValue(parsed))
    throw new Error("参数必须是 JSON 对象，不能是数组或单个值。");
  return parsed;
}

// Immediate form feedback follows the discovered schema. The server remains
// authoritative and validates the complete schema before every MCP call.
function validateArgs(tool: CatalogTool, args: Record<string, unknown>) {
  const schema = tool.inputSchema;
  for (const name of Array.isArray(schema.required) ? schema.required : []) {
    if (typeof name === "string" && !(name in args)) {
      throw new Error(`请填写${fieldNames[name] || name}。`);
    }
  }
  const fields = fieldsOf(schema);
  if (schema.additionalProperties === false) {
    const known = new Set(fields.map(([name]) => name));
    const unknown = Object.keys(args).find((name) => !known.has(name));
    if (unknown)
      throw new Error(
        `工具不接受参数「${unknown}」，请按下方实际参数定义填写。`,
      );
  }
  for (const [name, field] of fields) {
    if (!(name in args)) continue;
    const value = args[name];
    const label = fieldNames[name] || name;
    const type = field.type;
    const correctType =
      typeof type !== "string" ||
      (type === "integer"
        ? typeof value === "number" && Number.isInteger(value)
        : type === "array"
          ? Array.isArray(value)
          : type === "object"
            ? objectValue(value)
            : type === "null"
              ? value === null
              : typeof value === type);
    if (!correctType) throw new Error(`${label} 的类型应为 ${String(type)}。`);
    if (Array.isArray(field.enum) && !field.enum.includes(value)) {
      throw new Error(`${label} 不在允许的选项中。`);
    }
    if (typeof value === "string") {
      if (typeof field.minLength === "number" && value.length < field.minLength)
        throw new Error(`${label} 至少需要 ${field.minLength} 个字符。`);
      if (typeof field.maxLength === "number" && value.length > field.maxLength)
        throw new Error(`${label} 最多允许 ${field.maxLength} 个字符。`);
      if (typeof field.pattern === "string") {
        try {
          if (!new RegExp(field.pattern).test(value)) {
            throw new Error(
              `${label} 格式不匹配${name === "lei" ? "，应为 20 位大写字母或数字" : "工具要求"}。`,
            );
          }
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      }
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error(`${label} 必须是有效数字。`);
      if (typeof field.minimum === "number" && value < field.minimum)
        throw new Error(`${label} 不能小于 ${field.minimum}。`);
      if (typeof field.maximum === "number" && value > field.maximum)
        throw new Error(`${label} 不能大于 ${field.maximum}。`);
    }
  }
}

function ExecutionBadge({ call }: { call: ToolExecution }) {
  return (
    <span
      className={`badge ${call.status === "success" ? "green" : call.status === "error" ? "red" : "amber"}`}
    >
      {isPending(call) ? (
        <LoaderCircle size={13} className="spin" />
      ) : call.status === "success" ? (
        <Check size={13} />
      ) : (
        <CircleAlert size={13} />
      )}
      {statusNames[call.status]}
    </span>
  );
}

export default function ToolDesk({ onError, onTrace, onConnections }: Props) {
  const [tools, setTools] = useState<CatalogTool[]>([]);
  const [calls, setCalls] = useState<ToolExecution[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [draft, setDraft] = useState<Draft>({});
  const [json, setJson] = useState("{}");
  const [mode, setMode] = useState<"form" | "json">("form");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [pollError, setPollError] = useState("");
  const [focusedCallId, setFocusedCallId] = useState("");
  const requestLock = useRef(false);
  const permissionLock = useRef(false);
  const selected = tools.find((tool) => keyOf(tool) === selectedKey);
  const pendingIds = calls
    .filter(isPending)
    .map((call) => call.id)
    .join(",");
  const busy = submitting || Boolean(pendingIds);
  const focusedCall = calls.find((call) => call.id === focusedCallId);
  const currentCall =
    focusedCall?.connector === selected?.connector &&
    focusedCall?.tool === selected?.name
      ? focusedCall
      : calls.find(
          (call) =>
            call.connector === selected?.connector &&
            call.tool === selected?.name,
        );

  function mergeCall(call: ToolExecution) {
    setCalls((previous) =>
      [call, ...previous.filter((item) => item.id !== call.id)].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const data = await api<Catalog>("/tool-desk");
      setTools(data.tools);
      setCalls(data.calls);
      setLoadError("");
      setPollError("");
      setSelectedKey((current) =>
        data.tools.some((tool) => keyOf(tool) === current)
          ? current
          : data.tools[0]
            ? keyOf(data.tools[0])
            : "",
      );
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft(defaultsFor(selected));
    setJson(formatted(parseDraft(selected, defaultsFor(selected))));
    setMode("form");
    setFormError("");
  }, [selectedKey]);

  useEffect(() => {
    if (!pendingIds) return;
    let disposed = false;
    let inFlight = false;
    async function poll() {
      if (inFlight || disposed) return;
      inFlight = true;
      const results = await Promise.allSettled(
        pendingIds
          .split(",")
          .map((id) =>
            api<ToolExecution>(`/tool-desk/calls/${encodeURIComponent(id)}`),
          ),
      );
      if (!disposed) {
        let failure = "";
        for (const result of results) {
          if (result.status === "fulfilled") mergeCall(result.value);
          else
            failure = `暂时无法更新调用状态：${errorMessage(result.reason)}。后台调用可能仍在执行，请勿重复提交。`;
        }
        setPollError(failure);
      }
      inFlight = false;
    }
    const timer = window.setInterval(() => void poll(), 1000);
    void poll();
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [pendingIds]);

  function changeMode(next: "form" | "json") {
    if (!selected || mode === next) return;
    try {
      if (next === "json") setJson(formatted(parseDraft(selected, draft)));
      else {
        const args = parseJson(json);
        const supported = new Set(
          fieldsOf(selected.inputSchema).map(([name]) => name),
        );
        const unknown = Object.keys(args).find((name) => !supported.has(name));
        if (unknown) {
          throw new Error(
            `表单中没有参数「${unknown}」，请在 JSON 模式中调整后再切换。`,
          );
        }
        setDraft(
          Object.fromEntries(
            Object.entries(args).map(([key, value]) => [
              key,
              typeof value === "string" ? value : JSON.stringify(value),
            ]),
          ),
        );
      }
      setMode(next);
      setFormError("");
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  function fillExample() {
    if (!selected) return;
    const example: Record<string, unknown> =
      selected.name === "search_entities"
        ? { query: "HSBC BANK PLC" }
        : selected.name === "search_matters"
          ? { name: "HSBC BANK PLC", lei: HSBC_LEI }
          : selected.name === "get_entity" ||
              selected.name === "get_relationships"
            ? { lei: HSBC_LEI }
            : {};
    setDraft(
      Object.fromEntries(
        Object.entries(example).map(([key, value]) => [key, String(value)]),
      ),
    );
    setJson(formatted(example));
    setFormError("");
  }

  async function execute(event: FormEvent) {
    event.preventDefault();
    if (
      !selected ||
      requestLock.current ||
      busy ||
      !selected.available ||
      !selected.enabled
    )
      return;
    let args: Record<string, unknown>;
    try {
      args = mode === "form" ? parseDraft(selected, draft) : parseJson(json);
      validateArgs(selected, args);
    } catch (error) {
      setFormError(errorMessage(error));
      return;
    }
    requestLock.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      const call = await post<ToolExecution>("/tool-desk/calls", {
        connector: selected.connector,
        tool: selected.name,
        args,
      });
      mergeCall(call);
      setFocusedCallId(call.id);
    } catch (error) {
      const message = errorMessage(error);
      setFormError(message);
      onError(message);
    } finally {
      requestLock.current = false;
      setSubmitting(false);
    }
  }

  async function retry(call: ToolExecution) {
    if (requestLock.current || busy) return;
    requestLock.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      const next = await post<ToolExecution>(
        `/tool-desk/calls/${encodeURIComponent(call.id)}/retry`,
      );
      mergeCall(next);
      setSelectedKey(`${next.connector}:${next.tool}`);
      setFocusedCallId(next.id);
    } catch (error) {
      const message = errorMessage(error);
      setFormError(message);
      onError(message);
    } finally {
      requestLock.current = false;
      setSubmitting(false);
    }
  }

  async function togglePermission() {
    if (!selected || permissionLock.current) return;
    permissionLock.current = true;
    setSavingPermission(true);
    setFormError("");
    try {
      const data = await post<{ tools: CatalogTool[] }>(
        "/tool-desk/permissions",
        {
          connector: selected.connector,
          tool: selected.name,
          enabled: !selected.enabled,
        },
      );
      setTools(data.tools);
    } catch (error) {
      const message = errorMessage(error);
      setFormError(message);
      onError(message);
    } finally {
      permissionLock.current = false;
      setSavingPermission(false);
    }
  }

  const fields = selected ? fieldsOf(selected.inputSchema) : [];
  const preview = (() => {
    if (!selected) return "{}";
    try {
      return formatted(parseDraft(selected, draft));
    } catch {
      return "填写完整有效参数后显示。";
    }
  })();

  return (
    <div className="tool-desk page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CONNECTED TOOLS</div>
          <h1>工具调用台</h1>
          <p>
            先核对数据来源，再独立验证一项查询。每次调用都保留参数、结果与来源。
          </p>
        </div>
        <button className="btn secondary" onClick={onConnections}>
          <Plug size={16} />
          管理连接器
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="td-intro">
        <div>
          <ShieldCheck size={19} />
          <span>
            <strong>真实 MCP 调用</strong>
            手动测试已接入工具，便于核查数据范围及排查失败。
          </span>
        </div>
        <span className="td-intro-note">
          此处为人工发起；AI 执行需另行配置模型。
        </span>
      </div>

      {loadError && (
        <div className="td-error" role="alert">
          <CircleAlert size={17} />
          <div>
            <strong>工具列表未能更新</strong>
            <p>{loadError}</p>
          </div>
          <button
            className="btn secondary"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            重试加载
          </button>
        </div>
      )}
      {pollError && (
        <div className="td-error" role="alert">
          <CircleAlert size={17} />
          <p>{pollError}</p>
          <button
            className="btn secondary"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            刷新状态
          </button>
        </div>
      )}

      {loading ? (
        <div className="panel td-empty">
          <LoaderCircle size={25} className="spin" />
          <h2>读取已发现的工具</h2>
          <p>从后端读取 MCP 工具及其实际参数定义。</p>
        </div>
      ) : tools.length === 0 ? (
        <div className="panel td-empty">
          <Plug size={30} />
          <h2>连接数据源后，工具将在这里出现</h2>
          <p>
            进入接入管理，连接 GLEIF 或本地律所台账。工具名称和参数由 MCP
            服务实际返回。
          </p>
          <button className="btn primary" onClick={onConnections}>
            去连接数据源
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="td-layout">
          <aside className="panel td-catalog" aria-label="已发现工具列表">
            <div className="td-catalog-heading">
              <div>
                <span className="td-overline">选择查询能力</span>
                <h2>已发现 {tools.length} 项工具</h2>
              </div>
              <button
                className="td-refresh"
                onClick={() => void refresh()}
                disabled={refreshing}
                title="刷新工具目录"
                aria-label="刷新工具目录"
              >
                <RefreshCw size={16} className={refreshing ? "spin" : ""} />
              </button>
            </div>
            {(["gleif", "ledger"] as const).map((connector) => {
              const group = tools.filter(
                (tool) => tool.connector === connector,
              );
              return (
                <div className="td-source" key={connector}>
                  <div className="td-source-heading">
                    {connector === "gleif" ? (
                      <Network size={15} />
                    ) : (
                      <BookOpen size={15} />
                    )}
                    <span>{sources[connector]}</span>
                  </div>
                  {group.length ? (
                    group.map((tool) => (
                      <button
                        key={keyOf(tool)}
                        className={`td-tool ${selectedKey === keyOf(tool) ? "selected" : ""}`}
                        onClick={() => setSelectedKey(keyOf(tool))}
                        aria-pressed={selectedKey === keyOf(tool)}
                      >
                        <div>
                          <strong>{titleOf(tool.name)}</strong>
                          <span
                            className={`td-dot ${tool.available && tool.enabled ? "on" : ""}`}
                          />
                        </div>
                        <span>
                          {!tool.available
                            ? "来源未连接"
                            : !tool.enabled
                              ? "已暂停使用"
                              : tool.readOnly
                                ? "只读查询"
                                : "非只读工具"}
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    ))
                  ) : (
                    <button className="td-source-empty" onClick={onConnections}>
                      尚未发现工具，去连接
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              );
            })}
            <div className="td-catalog-foot">
              <Plug size={14} />
              <span>工具目录来自 MCP 发现；连接状态由后端提供。</span>
            </div>
          </aside>

          {selected && (
            <section className="panel td-workbench" aria-label="工具参数与执行">
              <div className="td-tool-heading">
                <div className="td-tool-icon">
                  {selected.connector === "gleif" ? (
                    <Network size={23} />
                  ) : (
                    <BookOpen size={23} />
                  )}
                </div>
                <div>
                  <div className="td-overline">
                    {sources[selected.connector]}
                  </div>
                  <h2>{titleOf(selected.name)}</h2>
                  <p>
                    {labels[selected.name]?.purpose || selected.description}
                  </p>
                </div>
              </div>
              <div className="td-policy">
                <div>
                  <strong>
                    {selected.enabled ? "已允许使用" : "已暂停使用"}
                  </strong>
                  <p>
                    此设置适用于后续手动、规则和 AI 调用；已发起的请求继续执行。
                  </p>
                </div>
                <button
                  className={`td-switch ${selected.enabled ? "on" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={selected.enabled}
                  aria-label={`允许使用${titleOf(selected.name)}`}
                  onClick={() => void togglePermission()}
                  disabled={savingPermission}
                >
                  <span>
                    {savingPermission ? (
                      <LoaderCircle size={12} className="spin" />
                    ) : null}
                  </span>
                </button>
              </div>

              {!selected.available && (
                <div className="td-source-warning">
                  <Plug size={17} />
                  <div>
                    <strong>来源未连接</strong>
                    <p>这里显示上次发现的参数。重新连接后才能调用。</p>
                  </div>
                  <button className="btn secondary" onClick={onConnections}>
                    去连接
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              <form className="td-form" onSubmit={execute} noValidate>
                <div className="td-form-heading">
                  <div>
                    <SlidersHorizontal size={16} />
                    <h3>查询条件</h3>
                  </div>
                  <div className="td-mode" aria-label="参数编辑方式">
                    <button
                      type="button"
                      className={mode === "form" ? "active" : ""}
                      onClick={() => changeMode("form")}
                      disabled={busy}
                    >
                      表单
                    </button>
                    <button
                      type="button"
                      className={mode === "json" ? "active" : ""}
                      onClick={() => changeMode("json")}
                      disabled={busy}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                {mode === "json" ? (
                  <div className="td-field">
                    <label htmlFor="td-json">调用参数（JSON 对象）</label>
                    <textarea
                      id="td-json"
                      className="td-code-input"
                      spellCheck={false}
                      value={json}
                      onChange={(event) => {
                        setJson(event.target.value);
                        setFormError("");
                      }}
                      disabled={busy}
                      rows={6}
                    />
                    <p className="td-field-note">
                      按下方 MCP 参数定义填写，提交前会检查格式和必填参数。
                    </p>
                  </div>
                ) : fields.length ? (
                  fields.map(([name, field]) => {
                    const id = `td-field-${name}`;
                    const common = {
                      id,
                      disabled: busy,
                      value: draft[name] ?? "",
                      onChange: (event: { target: { value: string } }) => {
                        setDraft((current) => ({
                          ...current,
                          [name]: event.target.value,
                        }));
                        setFormError("");
                      },
                      "aria-required": isRequired(selected.inputSchema, name),
                    };
                    return (
                      <div className="td-field" key={name}>
                        <label htmlFor={id}>
                          {fieldNames[name] ||
                            (typeof field.title === "string"
                              ? field.title
                              : name)}
                          {isRequired(selected.inputSchema, name) ? (
                            <span className="td-required">必填</span>
                          ) : (
                            <span className="td-optional">选填</span>
                          )}
                        </label>
                        {Array.isArray(field.enum) ? (
                          <select {...common}>
                            <option value="">请选择</option>
                            {field.enum.map((value) => (
                              <option key={String(value)} value={String(value)}>
                                {String(value)}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "boolean" ? (
                          <select {...common}>
                            <option value="">请选择</option>
                            <option value="true">是</option>
                            <option value="false">否</option>
                          </select>
                        ) : field.type === "string" ||
                          field.type === "number" ||
                          field.type === "integer" ? (
                          <input
                            {...common}
                            type={field.type === "string" ? "text" : "number"}
                            step={field.type === "integer" ? 1 : "any"}
                            spellCheck={false}
                            autoComplete="off"
                            placeholder={
                              name === "lei"
                                ? "20 位 LEI，例如 MP6I5ZYZBEU3UXPYFY54"
                                : name === "query" || name === "name"
                                  ? "例如 HSBC BANK PLC"
                                  : "请填写查询参数"
                            }
                          />
                        ) : (
                          <textarea
                            {...common}
                            rows={3}
                            className="td-code-input"
                            placeholder="请输入有效 JSON"
                          />
                        )}
                        {typeof field.description === "string" && (
                          <p className="td-field-note">{field.description}</p>
                        )}
                        {name === "lei" && (
                          <p className="td-field-note">
                            LEI 用于区分同名企业；可先使用「查找企业身份」核实。
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="td-no-args">
                    <Check size={17} />
                    <div>
                      <strong>无需填写查询条件</strong>
                      <p>该工具的实际参数定义不要求输入字段，可直接执行。</p>
                    </div>
                  </div>
                )}

                {Boolean(labels[selected.name]) && fields.length > 0 && (
                  <button
                    className="td-example"
                    type="button"
                    onClick={fillExample}
                    disabled={busy}
                  >
                    填入 HSBC 公开企业示例
                    <ArrowRight size={13} />
                  </button>
                )}
                <div className="td-data-note">
                  <ShieldCheck size={15} />
                  <p>
                    {selected.connector === "gleif"
                      ? "查询名称或 LEI 将发送至 GLEIF 公开服务。仅覆盖已登记 LEI 的主体；母公司信息指会计合并关系。"
                      : "仅检索本机隔离的虚构律所台账；不代表任何真实客户关系，也不覆盖完整律所记录。"}
                  </p>
                </div>
                {formError && (
                  <div className="td-inline-error" role="alert">
                    <CircleAlert size={16} />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="td-submit-row">
                  <span>
                    {!selected.enabled
                      ? "请先启用此工具"
                      : !selected.available
                        ? "请先连接数据源"
                        : busy
                          ? "已有调用正在处理，请等待结果"
                          : selected.readOnly
                            ? "只读调用，结果需人工核实"
                            : "执行前请核对参数和工具说明"}
                  </span>
                  <button
                    className="btn primary"
                    type="submit"
                    disabled={
                      busy ||
                      savingPermission ||
                      !selected.enabled ||
                      !selected.available
                    }
                  >
                    {busy ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : (
                      <Play size={15} />
                    )}
                    {busy ? "调用处理中" : "执行查询"}
                  </button>
                </div>
              </form>

              <details className="td-technical">
                <summary>
                  <Code2 size={15} />
                  技术参数与 MCP 定义
                  <ChevronRight size={14} />
                </summary>
                <div className="td-technical-body">
                  <p>
                    工具标识：
                    <code>
                      {selected.connector} / {selected.name}
                    </code>
                  </p>
                  <p>{selected.description}</p>
                  <h4>实际发现的 inputSchema</h4>
                  <pre>{formatted(selected.inputSchema)}</pre>
                  <h4>待提交参数</h4>
                  <pre>{mode === "json" ? json : preview}</pre>
                </div>
              </details>

              {currentCall && (
                <div
                  className={`td-result ${currentCall.status}`}
                  aria-live="polite"
                >
                  <div className="td-result-heading">
                    <h3>
                      {isPending(currentCall)
                        ? "正在等待工具返回"
                        : "最近一次调用"}
                    </h3>
                    <ExecutionBadge call={currentCall} />
                  </div>
                  <p className="td-call-meta">
                    {stamp(currentCall.createdAt)} ·{" "}
                    {currentCall.trace
                      ? `${currentCall.trace.durationMs} ms`
                      : "耗时将在调用完成后记录"}
                    {currentCall.retryOf
                      ? ` · 重试自 ${currentCall.retryOf.slice(0, 8)}`
                      : ""}
                  </p>
                  {isPending(currentCall) ? (
                    <p>
                      {currentCall.status === "queued"
                        ? "后端已接收请求，即将通过 MCP 执行。"
                        : "MCP 工具正在执行。返回结果后，此处将自动更新。"}
                    </p>
                  ) : currentCall.status === "error" ? (
                    <p className="td-result-error">
                      {currentCall.error ||
                        currentCall.trace?.error ||
                        "调用未完成，请查看追踪记录。"}
                    </p>
                  ) : (
                    <p>
                      工具已实际返回数据。此状态只表示调用完成，不代表完成法律判断。
                    </p>
                  )}
                  <div className="td-result-actions">
                    {currentCall.trace && (
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => onTrace(currentCall.trace!)}
                      >
                        查看参数与原始结果
                        <ArrowRight size={14} />
                      </button>
                    )}
                    {currentCall.status === "error" && (
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => void retry(currentCall)}
                        disabled={
                          busy || !selected.available || !selected.enabled
                        }
                      >
                        <RefreshCw size={14} />
                        使用原参数重试
                      </button>
                    )}
                  </div>
                  <span className="td-record-id">记录 {currentCall.id}</span>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <section className="panel td-history" aria-label="手动工具调用记录">
        <div className="td-history-heading">
          <div>
            <History size={18} />
            <h2>手动调用记录</h2>
            <span className="badge">{calls.length} 条</span>
          </div>
          <p>保留失败与重试记录，原始结果可逐条追溯。</p>
        </div>
        {calls.length === 0 ? (
          <div className="td-history-empty">
            <Clock3 size={22} />
            <div>
              <strong>还没有手动调用</strong>
              <p>
                选择一个已连接的工具，填写查询条件后执行。规则及 AI
                流程的调用记录在对应核查详情中查看。
              </p>
            </div>
          </div>
        ) : (
          <div className="td-history-list">
            {calls.map((call) => {
              const tool = tools.find(
                (item) =>
                  item.connector === call.connector && item.name === call.tool,
              );
              return (
                <div className="td-history-row" key={call.id}>
                  <div className="td-history-tool">
                    <span className="td-history-icon">
                      {call.connector === "gleif" ? (
                        <Network size={18} />
                      ) : (
                        <BookOpen size={18} />
                      )}
                    </span>
                    <div>
                      <strong>{titleOf(call.tool)}</strong>
                      <p>
                        {sources[call.connector]} · {stamp(call.createdAt)}
                      </p>
                      <p
                        className="td-history-input"
                        title={inputSummary(call.args)}
                      >
                        {inputSummary(call.args)}
                      </p>
                      {call.retryOf && (
                        <span className="td-retry-label">
                          重试记录 · 原调用 {call.retryOf.slice(0, 8)}
                        </span>
                      )}
                      {call.status === "error" && (
                        <p className="td-history-error">
                          {call.error || call.trace?.error || "调用失败"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="td-history-status">
                    <ExecutionBadge call={call} />
                    <span>
                      {call.trace ? `${call.trace.durationMs} ms` : "等待返回"}
                    </span>
                  </div>
                  <div className="td-history-actions">
                    {call.trace && (
                      <button
                        className="btn secondary"
                        onClick={() => onTrace(call.trace!)}
                      >
                        查看结果
                        <ArrowRight size={13} />
                      </button>
                    )}
                    {call.status === "error" && (
                      <button
                        className="btn secondary"
                        onClick={() => void retry(call)}
                        disabled={busy || !tool?.available || !tool?.enabled}
                        title={
                          !tool?.available
                            ? "请先连接数据源"
                            : !tool?.enabled
                              ? "请先启用工具"
                              : "保留原记录并创建新的调用"
                        }
                      >
                        <RefreshCw size={13} />
                        重试
                      </button>
                    )}
                    {isPending(call) && (
                      <span className="td-polling">自动更新中</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
