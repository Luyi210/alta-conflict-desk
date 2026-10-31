import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FolderClock,
  GitBranch,
  History,
  Info,
  Link2,
  LoaderCircle,
  Network,
  Plug,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Unplug,
  X,
  AlertTriangle,
} from "lucide-react";
import { api, post } from "./api";
import CaseWorkspace, { caseState } from "./CaseWorkspace";
import CaseResults from "./CaseResults";
import MatterDashboard from "./MatterDashboard";
import { useAppRoute, type Page, type CaseTab } from "./navigation";
import ToolDesk from "./ToolDesk";
import ReviewBrief from "./ReviewBrief";
import MatchExplanation from "./MatchExplanation";
import "./materials.css";
import { useReviewDraft } from "./useReviewDraft";
import type {
  AppStatus,
  CaseView,
  Connector,
  ConnectorId,
  Entity,
  Finding,
  Run,
  Trace,
} from "../shared/types";

const cn = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");
const stamp = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))
    : "尚未测试";
const typeLabel = {
  direct: "主体一致",
  related: "关联主体",
  similar: "名称近似",
};
const reviewLabel = {
  pending: "待复核",
  escalated: "待进一步复核",
  dismissed: "已排除",
  retained: "已复核 · 保留问题",
};
const statusLabel = {
  running: "核查中",
  completed: "待人工判断",
  partial: "部分完成",
  failed: "核查失败",
};
const connectorInfo = {
  documents: {
    eyebrow: "CASE EVIDENCE",
    name: "案件材料与原文",
    description: "按案件读取 PDF 版本与页码，原文引用可核对；AI 需逐版本授权。",
    scope: "本机 PDF · 本案范围 · 版本留存",
    auth: "本地进程 · 案件与版本授权",
    icon: LedgerMark,
  },
  gleif: {
    eyebrow: "PUBLIC ENTITY DATA",
    name: "GLEIF 企业身份",
    description:
      "查询法人身份、LEI 编码与公开母公司关系，为名称匹配增加可靠的身份依据。",
    scope: "全球已登记 LEI 主体 · 公开数据",
    auth: "公开 API · 无需密钥",
    icon: GlobeMark,
  },
  ledger: {
    eyebrow: "PRIVATE MATTER RECORDS",
    name: "律所客户与事项台账",
    description:
      "在本地客户及事项记录中检索潜在线索。使用隔离的虚构台账，演示律师的复核过程。",
    scope: "本机 SQLite · 虚构演示数据",
    auth: "本地进程 · 只读访问",
    icon: LedgerMark,
  },
};
function GlobeMark() {
  return <Network size={26} strokeWidth={1.4} />;
}
function LedgerMark() {
  return <BookOpen size={26} strokeWidth={1.4} />;
}
function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Spinner({ text = "处理中" }: { text?: string }) {
  return (
    <>
      <LoaderCircle className="spin" size={16} />
      {text}
    </>
  );
}
function Empty({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default function App() {
  const { route, go } = useAppRoute();
  const page = route.page;
  const [routeLoading, setRouteLoading] = useState(
    Boolean(route.caseId || route.runId),
  );
  const [routeError, setRouteError] = useState(false);
  const [status, setStatus] = useState<AppStatus>();
  const [runs, setRuns] = useState<Run[]>([]);
  const [cases, setCases] = useState<CaseView[]>([]);
  const [activeCase, setActiveCase] = useState<CaseView>();
  const [activeRun, setActiveRun] = useState<Run>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [trace, setTrace] = useState<Trace>();
  const [modelHelp, setModelHelp] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  async function refresh() {
    const [s, h, c] = await Promise.all([
      api<AppStatus>("/status"),
      api<{ runs: Run[] }>("/runs"),
      api<{ cases: CaseView[] }>("/cases"),
    ]);
    setStatus(s);
    setRuns(h.runs);
    setCases(c.cases);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
    return () => clearTimeout(noticeTimer.current);
  }, []);
  useEffect(() => {
    if (!activeRun || activeRun.status !== "running") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await api<Run>(`/runs/${activeRun.id}`);
        if (cancelled) return;
        setActiveRun(next);
        if (next.status !== "running") {
          void refresh();
          return;
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
      if (!cancelled) timer = setTimeout(poll, 900);
    };
    timer = setTimeout(poll, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeRun?.id, activeRun?.status]);
  useEffect(() => {
    if (!activeCase || activeCase.status !== "running") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await api<CaseView>(`/cases/${activeCase.id}`);
        if (cancelled) return;
        setActiveCase(next);
        if (next.status !== "running") {
          void refresh().catch((e) => setError(e.message));
          return;
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
      if (!cancelled) timer = setTimeout(poll, 1200);
    };
    timer = setTimeout(poll, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCase?.id, activeCase?.status]);
  useEffect(() => {
    let cancelled = false;
    setActiveCase(undefined);
    setActiveRun(undefined);
    setRouteError(false);
    setError("");
    if (!route.caseId && !route.runId) {
      setRouteLoading(false);
      return;
    }
    setRouteLoading(true);
    void Promise.all([
      route.caseId
        ? api<CaseView>(`/cases/${route.caseId}`)
        : Promise.resolve(undefined),
      route.runId
        ? api<Run>(`/runs/${route.runId}`)
        : Promise.resolve(undefined),
    ])
      .then(([matter, run]) => {
        if (cancelled) return;
        if (matter && run && !matter.runs.some((r) => r.id === run.id))
          throw new Error("该核查记录不属于此案件，请从案件列表重新打开。");
        setActiveCase(matter);
        setActiveRun(run);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setRouteError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [route.caseId, route.runId]);
  const hasRunningCases = cases.some((c) => c.status === "running");
  useEffect(() => {
    if (!hasRunningCases || activeCase?.status === "running") return;
    const timer = setInterval(
      () => void refresh().catch((e) => setError(e.message)),
      3000,
    );
    return () => clearInterval(timer);
  }, [hasRunningCases, activeCase?.status]);
  function openCase(id: string, tab: CaseTab = "assistant") {
    go({ page: "workspace", caseId: id, tab });
  }
  function updateCase(value: CaseView) {
    setActiveCase(value);
    void refresh().catch((e) => setError(e.message));
  }
  async function refreshActiveCase() {
    if (activeCase)
      setActiveCase(await api<CaseView>(`/cases/${activeCase.id}`));
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page, activeCase?.id, activeRun?.id]);
  function toast(message: string) {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4500);
  }
  async function connectorAction(
    id: ConnectorId,
    action: "connect" | "test" | "disconnect",
  ) {
    setBusy(`${id}-${action}`);
    setError("");
    try {
      await post<Connector>(`/connectors/${id}/${action}`);
      await refresh();
      toast(
        action === "disconnect"
          ? "连接已断开，后续调用已停用"
          : action === "test"
            ? "真实工具调用成功，连接可用"
            : "MCP 连接成功，工具已发现",
      );
    } catch (e) {
      setError((e as Error).message);
      await refresh().catch(() => {});
    } finally {
      setBusy("");
    }
  }
  async function connectAll() {
    setBusy("connect-all");
    setError("");
    try {
      for (const id of ["gleif", "ledger"] as const)
        if (!status?.connectors.find((c) => c.id === id)?.connected)
          await post(`/connectors/${id}/connect`);
      await refresh();
      toast("两个 MCP 数据源已连接，可以开始查询主体");
    } catch (e) {
      setError((e as Error).message);
      await refresh().catch(() => {});
    } finally {
      setBusy("");
    }
  }
  function navigate(next: Page) {
    go({ page: next });
    setError("");
  }
  function openRun(id: string) {
    go({
      page: "workspace",
      runId: id,
      ...(route.caseId ? { caseId: route.caseId, tab: route.tab } : {}),
    });
  }
  const pageName = {
    workspace: "收案工作台",
    new: "新建收案审查",
    tools: "工具调用台",
    connectors: "连接器管理",
    history: "执行记录",
    about: "使用指南",
  }[page];
  useEffect(() => {
    document.title = `${activeRun && route.runId ? activeRun.entity.name : activeCase && route.caseId ? activeCase.name : pageName} · Alta Conflict Desk`;
  }, [
    pageName,
    activeCase?.name,
    activeRun?.entity.name,
    route.caseId,
    route.runId,
  ]);
  const connected = status?.connectors.filter((c) => c.connected).length ?? 0;
  const pending = runs.reduce(
    (n, r) =>
      n +
      r.findings.filter(
        (f) => f.review === "pending" || f.review === "escalated",
      ).length,
    0,
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("workspace")}
          aria-label="返回核查工作台"
        >
          <span className="brand-mark">
            a<span>.</span>
          </span>
          <span>
            alta<span className="brand-lex">lex</span>
            <small>CONFLICT DESK</small>
          </span>
        </button>
        <div className="workspace-switch">
          <span className="firm-avatar">澄</span>
          <span>
            澄明律师事务所<small>独立演示空间</small>
          </span>
          <span className="workspace-label">本地</span>
        </div>
        <button className="sidebar-create" onClick={() => navigate("new")}>
          <Plus size={16} /> 新建审查
        </button>
        <div className="nav-heading">工作空间</div>
        <nav aria-label="主导航">
          <button
            className={cn(
              "nav-item",
              (page === "workspace" || page === "new") && "active",
            )}
            onClick={() => navigate("workspace")}
          >
            <FileSearch size={18} />
            收案工作台
            <span className="nav-dot" />
          </button>
          <button
            className={cn("nav-item", page === "tools" && "active")}
            onClick={() => navigate("tools")}
          >
            <SquareTerminal size={18} />
            工具调用台
          </button>
          <button
            className={cn("nav-item", page === "connectors" && "active")}
            onClick={() => navigate("connectors")}
          >
            <Plug size={18} />
            连接器
            <span className="nav-count">
              {status ? connected : "—"}/{status?.connectors.length || 3}
            </span>
          </button>
          <button
            className={cn("nav-item", page === "history" && "active")}
            onClick={() => navigate("history")}
          >
            <FolderClock size={18} />
            执行记录
            {runs.length > 0 && (
              <span className="nav-count">{runs.length}</span>
            )}
          </button>
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={21} />
          <p>审慎接受每一份委托</p>
          <span>
            以可追溯证据支持判断，
            <br />
            让专业决定留在律师手中。
          </span>
        </div>
        <div className="sidebar-bottom">
          <button
            className={cn("nav-item", page === "about" && "active")}
            onClick={() => navigate("about")}
          >
            <CircleHelp size={18} />
            使用指南
          </button>
          <div className="user">
            <div className="user-avatar">律</div>
            <div>
              演示律师<small>本地单用户原型</small>
            </div>
            <span className="user-status" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="product-breadcrumb">
            <button onClick={() => navigate("workspace")}>工作空间</button>
            <ChevronRight size={14} />
            <span>{pageName}</span>
            {route.caseId && (
              <>
                <ChevronRight size={14} />
                <button
                  onClick={() => openCase(route.caseId!)}
                  title={activeCase?.name}
                >
                  {activeCase?.name || "案件详情"}
                </button>
              </>
            )}
            {route.runId && (
              <>
                <ChevronRight size={14} />
                <span>主体核查</span>
              </>
            )}
          </div>
          <div className="topbar-right">
            <span className="prototype-tag">本地演示空间</span>
            <button
              className="model-state"
              disabled={!status}
              onClick={() => setModelHelp(true)}
            >
              <span
                className={cn("status-dot", status?.model.configured && "on")}
              />
              {!status
                ? "读取运行状态…"
                : status.model.configured
                  ? "AI 模型已配置"
                  : "规则预览 · 模型待配置"}
              <CircleHelp size={13} />
            </button>
          </div>
        </header>
        <main id="main-content">
          {error && (
            <div className="alert error" role="alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
              <button aria-label="关闭错误" onClick={() => setError("")}>
                <X size={17} />
              </button>
            </div>
          )}
          {!status ? (
            <div className="loading-page">
              <LoaderCircle className="spin" size={25} />
              <p>正在连接本地服务…</p>
              <button
                className="btn secondary"
                onClick={() => {
                  setError("");
                  void refresh().catch((e) => setError(e.message));
                }}
              >
                重新连接
              </button>
            </div>
          ) : (
            <>
              {page === "workspace" &&
                (routeLoading ? (
                  <div className="product-loading" role="status">
                    <LoaderCircle className="spin" size={24} />
                    <h2>正在打开案件记录</h2>
                    <p>读取主体、证据与已保存的审查意见。</p>
                  </div>
                ) : routeError ? (
                  <div className="product-loading">
                    <FileSearch size={28} />
                    <h2>暂时无法打开这份记录</h2>
                    <p>可能记录不存在或本地服务暂时不可用。</p>
                    <button
                      className="btn primary"
                      onClick={() => navigate("workspace")}
                    >
                      返回收案工作台
                    </button>
                  </div>
                ) : route.runId && activeRun ? (
                  <Results
                    run={activeRun}
                    backLabel={route.caseId ? "返回案件审查" : "返回执行记录"}
                    onBack={() => {
                      if (route.caseId) openCase(route.caseId, route.tab);
                      else navigate("history");
                    }}
                    onUpdate={(r) => {
                      setActiveRun(r);
                      void refresh().catch((e) => setError(e.message));
                      void refreshActiveCase().catch((e) =>
                        setError(e.message),
                      );
                    }}
                    onTrace={setTrace}
                    onError={setError}
                    toast={toast}
                  />
                ) : route.caseId && activeCase ? (
                  <CaseResults
                    onConnectionChange={refresh}
                    key={activeCase.id}
                    value={activeCase}
                    tab={route.tab || "parties"}
                    onTabChange={(tab) => go({ ...route, tab })}
                    onBack={() => navigate("workspace")}
                    onUpdate={updateCase}
                    onOpenRun={(id) => openRun(id)}
                    onTrace={setTrace}
                    onError={setError}
                  />
                ) : (
                  <MatterDashboard
                    cases={cases}
                    status={status}
                    onNew={() => navigate("new")}
                    onOpen={openCase}
                    onConnect={connectAll}
                    connecting={busy === "connect-all"}
                    onSettings={() => navigate("connectors")}
                    onModelHelp={() => setModelHelp(true)}
                  />
                ))}
              {page === "new" && (
                <CaseWorkspace
                  status={status}
                  onBack={() => navigate("workspace")}
                  onConnect={connectAll}
                  connecting={busy === "connect-all"}
                  onSettings={() => navigate("connectors")}
                  onCreate={(value) => {
                    updateCase(value);
                    openCase(value.id);
                    toast("案件已建立，正在进行真实核查");
                  }}
                  onError={setError}
                  onTrace={setTrace}
                  onModelHelp={() => setModelHelp(true)}
                />
              )}
              {page === "tools" && (
                <ToolDesk
                  key={status.connectors
                    .map((c) => `${c.id}:${c.connected}`)
                    .join("|")}
                  onError={setError}
                  onTrace={setTrace}
                  onConnections={() => navigate("connectors")}
                />
              )}
              {page === "connectors" && (
                <div className="page-enter">
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">CONNECTIONS</div>
                      <h1>数据连接</h1>
                      <p>
                        连接公开企业身份与本地客户事项，让每条核查线索都有来处。
                      </p>
                    </div>
                    <div className="connection-total">
                      <span>{connected}</span> / {status.connectors.length}
                      <small>已连接数据源</small>
                    </div>
                  </div>
                  <div className="info-strip">
                    <ShieldCheck size={17} />
                    <span>
                      工具均为只读。案件材料另需绑定本案，AI 读取须逐版本授权。
                    </span>
                    <Badge tone="green">MCP · stdio</Badge>
                  </div>
                  <div className="connector-grid">
                    {(["gleif", "ledger", "documents"] as const).map((id) => {
                      const config = connectorInfo[id];
                      const c = status.connectors.find((c) => c.id === id);
                      return (
                        <article className="connector-card" key={id}>
                          <div className="connector-top">
                            <div className={cn("connector-logo", id)}>
                              <config.icon />
                            </div>
                            <Badge
                              tone={
                                c?.status === "error"
                                  ? "red"
                                  : c?.connected
                                    ? "green"
                                    : "muted"
                              }
                            >
                              <span
                                className={cn(
                                  "status-dot",
                                  c?.connected && c.status !== "error" && "on",
                                )}
                              />
                              {c?.status === "error"
                                ? "连接异常"
                                : c?.connected
                                  ? "已连接"
                                  : "未连接"}
                            </Badge>
                          </div>
                          <div className="eyebrow small">{config.eyebrow}</div>
                          <h2>{config.name}</h2>
                          <p>{config.description}</p>
                          <div className="connector-facts">
                            <div>
                              <span>数据范围</span>
                              <b>{config.scope}</b>
                            </div>
                            <div>
                              <span>授权方式</span>
                              <b>{config.auth}</b>
                            </div>
                            <div>
                              <span>访问权限</span>
                              <b>
                                <Check size={13} />
                                只读检索
                              </b>
                            </div>
                            <div>
                              <span>最近测试</span>
                              <b>{stamp(c?.lastTestAt)}</b>
                            </div>
                          </div>
                          {c?.error && (
                            <div className="inline-error">{c.error}</div>
                          )}
                          <details className="tools-details">
                            <summary>
                              <SquareTerminal size={15} />
                              可用工具<span>{c?.tools.length ?? 0}</span>
                              <ChevronDown size={14} />
                            </summary>
                            {c?.tools.length ? (
                              c.tools.map((t) => (
                                <div className="tool-row" key={t.name}>
                                  <code>{t.name}</code>
                                  <p>{t.description}</p>
                                </div>
                              ))
                            ) : (
                              <p className="tools-empty">
                                连接后通过 MCP 实时发现工具列表。
                              </p>
                            )}
                          </details>
                          <div className="connector-actions">
                            {c?.connected ? (
                              <>
                                <button
                                  className="btn secondary"
                                  disabled={!!busy}
                                  onClick={() =>
                                    void connectorAction(id, "test")
                                  }
                                >
                                  {busy === `${id}-test` ? (
                                    <Spinner text="测试中" />
                                  ) : (
                                    <>
                                      <CheckCheck size={16} />
                                      测试连接
                                    </>
                                  )}
                                </button>
                                <button
                                  className="btn quiet"
                                  disabled={!!busy}
                                  onClick={() =>
                                    void connectorAction(id, "disconnect")
                                  }
                                >
                                  {busy === `${id}-disconnect` ? (
                                    <Spinner text="断开中" />
                                  ) : (
                                    <>
                                      <Unplug size={15} />
                                      断开
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn primary"
                                disabled={!!busy}
                                onClick={() =>
                                  void connectorAction(id, "connect")
                                }
                              >
                                {busy === `${id}-connect` ? (
                                  <Spinner text="连接中" />
                                ) : (
                                  <>
                                    <Plug size={16} />
                                    连接数据源
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="scope-panel">
                    <div>
                      <Link2 size={21} />
                      <h3>信息会去哪里？</h3>
                    </div>
                    <p>
                      企业名称和 LEI 发往
                      GLEIF。虚构律所台账保存在本机。规则模式下，事项背景与台账命中不会发送给模型。
                    </p>
                    <p>
                      启用 AI
                      模式后，本次事项信息与查询到的台账命中会发往你配置的模型服务。请先确认组织授权与数据处理要求。
                    </p>
                  </div>
                </div>
              )}
              {page === "history" && (
                <div className="page-enter">
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">MATTER REGISTER</div>
                      <h1>执行记录</h1>
                      <p>
                        保留主体身份、来源证据与人工复核，支持后续收案判断。
                      </p>
                    </div>
                    <button
                      className="btn primary"
                      onClick={() => {
                        setActiveRun(undefined);
                        setActiveCase(undefined);
                        navigate("new");
                      }}
                    >
                      <Plus size={17} />
                      新建审查
                    </button>
                  </div>
                  <div className="history-overview">
                    <div>
                      <span>已保存核查</span>
                      <strong>{runs.length.toString().padStart(2, "0")}</strong>
                    </div>
                    <div>
                      <span>历史未处理线索 · 含旧轮次</span>
                      <strong>{pending.toString().padStart(2, "0")}</strong>
                    </div>
                    <div>
                      <span>存储位置</span>
                      <b>
                        <ShieldCheck size={16} />
                        仅本机保存
                      </b>
                    </div>
                  </div>
                  {cases.length > 0 && (
                    <section
                      className="panel case-recent"
                      style={{ marginBottom: 24 }}
                    >
                      <div className="case-section-title">
                        <h3>案件审查记录</h3>
                        <span className="muted">{cases.length} 份</span>
                      </div>
                      {cases.map((item) => (
                        <button
                          className="case-recent-row"
                          key={item.id}
                          onClick={() => void openCase(item.id)}
                        >
                          <span>
                            <strong>{item.name}</strong>
                            <small>
                              {item.parties.length} 方主体 · 待补{" "}
                              {item.progress.openTasks} 项 · 修订{" "}
                              {item.revision}
                            </small>
                          </span>
                          <span className="badge amber">
                            {caseState[item.status]}
                          </span>
                          <ArrowRight size={17} />
                        </button>
                      ))}
                    </section>
                  )}
                  <div className="panel history-panel">
                    <div className="panel-title">
                      <h3>核查记录</h3>
                      <label className="mini-search">
                        <Search size={16} />
                        <input
                          aria-label="搜索核查记录"
                          placeholder="搜索事项或主体"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                        />
                      </label>
                    </div>
                    {runs.length === 0 ? (
                      <Empty
                        icon={<History size={25} />}
                        title="还没有核查记录"
                        text="完成第一项核查后，证据和复核意见会保存在这里。"
                      />
                    ) : (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>事项 / 核查主体</th>
                              <th>创建时间</th>
                              <th>执行方式</th>
                              <th>线索</th>
                              <th>状态</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {runs
                              .filter((r) =>
                                `${r.matterName} ${r.entity.name}`
                                  .toLowerCase()
                                  .includes(historySearch.toLowerCase()),
                              )
                              .map((r) => (
                                <tr key={r.id}>
                                  <td>
                                    <button
                                      className="table-link"
                                      onClick={() => {
                                        setActiveCase(undefined);
                                        void openRun(r.id);
                                      }}
                                    >
                                      {r.matterName}
                                    </button>
                                    <small>{r.entity.name}</small>
                                  </td>
                                  <td>{stamp(r.createdAt)}</td>
                                  <td>
                                    {r.mode === "ai"
                                      ? "AI 工具调用"
                                      : "规则预览"}
                                  </td>
                                  <td>{r.findings.length}</td>
                                  <td>
                                    <Badge
                                      tone={
                                        r.status === "failed"
                                          ? "red"
                                          : r.status === "partial"
                                            ? "amber"
                                            : "green"
                                      }
                                    >
                                      {statusLabel[r.status]}
                                    </Badge>
                                  </td>
                                  <td>
                                    <button
                                      className="icon-btn"
                                      aria-label={`打开${r.matterName}`}
                                      onClick={() => {
                                        setActiveCase(undefined);
                                        void openRun(r.id);
                                      }}
                                    >
                                      <ArrowUpRight size={17} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {page === "about" && (
                <About
                  onModelHelp={() => setModelHelp(true)}
                  onNew={() => navigate("new")}
                  onSettings={() => navigate("connectors")}
                />
              )}
            </>
          )}
        </main>
        <footer className="page-footer">
          <span>ALTA CONFLICT DESK</span>
          <span>独立概念原型 · 律所台账为虚构数据 · 不自动作出收案决定</span>
          <span>v0.7</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {trace && (
        <Modal
          title="MCP 调用凭证"
          subtitle={`${trace.connector === "gleif" ? "GLEIF 企业身份" : trace.connector === "documents" ? "案件材料库" : "本地事项台账"} / ${trace.tool}`}
          onClose={() => setTrace(undefined)}
        >
          <div className="trace-meta">
            <Badge tone={trace.status === "success" ? "green" : "red"}>
              {trace.status === "success" ? "调用成功" : "调用失败"}
            </Badge>
            <span>{trace.durationMs} ms</span>
            <span>{stamp(trace.startedAt)}</span>
          </div>
          <label className="field-label">请求参数</label>
          <pre>{JSON.stringify(trace.args, null, 2)}</pre>
          <label className="field-label">工具返回</label>
          <pre>{JSON.stringify(trace.error || trace.result, null, 2)}</pre>
          <p className="fineprint">
            {trace.connector === "documents"
              ? "记录来自实际 MCP 调用；版本状态与授权状态是读取当时的快照，原文件及页码固定保留。"
              : "记录来自后端实际 MCP 调用。公开信息仅反映本次查询所覆盖的来源与时点。"}
          </p>
        </Modal>
      )}
      {modelHelp && (
        <Modal
          title="模型与运行方式"
          subtitle="了解运行方式与数据使用范围"
          onClose={() => setModelHelp(false)}
        >
          <div className="callout">
            <Sparkles size={20} />
            <div>
              <strong>
                {status?.model.configured
                  ? `已配置 ${status.model.model}`
                  : "当前尚未配置模型 API"}
              </strong>
              <p>
                {status?.model.configured
                  ? "可在新建审查的最后一步选择 AI 辅助核查。模型会实际调用已授权工具，整理待律师核实的问题与下一步建议。"
                  : "尚未配置模型也可使用规则核查，完成身份查询、台账比对和人工复核。"}
              </p>
            </div>
          </div>
          <div className="model-mode-summary">
            <div>
              <strong>AI 辅助核查</strong>
              <p>
                事项背景、主体信息及台账结果发送至已配置的模型服务；每次实际调用都保留凭证。
              </p>
            </div>
            <div>
              <strong>规则核查</strong>
              <p>
                直接查询公开身份与本地台账，生成可解释的匹配线索，不发送给模型。
              </p>
            </div>
          </div>
          <details className="model-config-details">
            <summary>开发者配置说明</summary>
            <p>
              在项目本机的 <code>.env</code>{" "}
              设置下列字段后重启后端。密钥只放在服务端，切勿写入 GitHub 或聊天。
            </p>
            <pre>
              MODEL_BASE_URL=https://your-provider.example/v1{"\n"}
              MODEL_API_KEY=your-local-key{"\n"}
              MODEL_NAME=your-tool-calling-model
            </pre>
            <p>
              需要支持 OpenAI 兼容的 Chat Completions 工具调用接口。AI
              模式会向模型传送本次事项上下文与工具返回，并保留真实调用记录。
            </p>
          </details>
          <div className="notice-box">
            “已配置”只表示本机存在配置，实际成功状态请以案件中的调用记录为准。模型摘要与建议仍需律师复核。
          </div>
        </Modal>
      )}
    </div>
  );
}

function Results({
  run,
  backLabel = "返回案件工作台",
  onBack,
  onUpdate,
  onTrace,
  onError,
  toast,
}: {
  run: Run;
  backLabel?: string;
  onBack: () => void;
  onUpdate: (r: Run) => void;
  onTrace: (t: Trace) => void;
  onError: (e: string) => void;
  toast: (m: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<"findings" | "trace">("findings");
  const [filter, setFilter] = useState<"all" | Finding["review"]>("all");
  const displayed = run.findings.filter(
    (f) => filter === "all" || f.review === filter,
  );
  const finding = displayed.find((f) => f.id === selectedId) ?? displayed[0];
  const count = (t: Finding["type"]) =>
    run.findings.filter((f) => f.type === t).length;
  const pending = run.findings.filter(
    (f) => f.review === "pending" || f.review === "escalated",
  ).length;
  return (
    <div className="page-enter results-page">
      <div className="result-toolbar">
        <button className="text-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          {backLabel}
        </button>
        <div>
          <Badge>
            {run.mode === "ai"
              ? run.modelSummary
                ? "AI 辅助已执行"
                : run.status === "running"
                  ? "AI 辅助执行中"
                  : "AI 未完成 · 规则证据保留"
              : "规则预览"}
          </Badge>
          <span className="run-ref">{run.id.slice(0, 8).toUpperCase()}</span>
          <a
            className={cn(
              "btn secondary",
              run.status === "running" && "disabled",
            )}
            href={`/api/runs/${run.id}/report`}
            download
            onClick={(e) => run.status === "running" && e.preventDefault()}
          >
            <Download size={16} />
            导出核查报告
          </a>
        </div>
      </div>
      <div className="page-heading result-heading">
        <div>
          <div className="eyebrow">PRE-ENGAGEMENT SCREENING</div>
          <h1>
            {run.status === "running"
              ? "正在连接事实，梳理关系。"
              : run.status === "failed"
                ? "核查暂未完成。"
                : "线索已整理，等待专业判断。"}
          </h1>
          <p>
            {run.matterName}
            <span className="dot-separator">·</span>
            {run.entity.name}
          </p>
        </div>
        <Badge
          tone={
            run.status === "running"
              ? "green"
              : run.status === "failed"
                ? "red"
                : "amber"
          }
        >
          {run.status === "running" && (
            <LoaderCircle className="spin" size={13} />
          )}{" "}
          {statusLabel[run.status]}
        </Badge>
      </div>
      {run.status === "running" && (
        <div className="live-progress">
          <div className="progress-track">
            <span />
          </div>
          <div>
            <Spinner
              text={
                run.modelExecution?.status === "running"
                  ? "AI 正在调用工具并整理复核简报"
                  : "正在核实企业身份、公开关系与台账"
              }
            />
            <span>
              已记录 {run.traces.length} 次工具调用 ·
              可离开页面，稍后从核查记录继续
            </span>
          </div>
        </div>
      )}
      <div className="summary-grid">
        <div className="summary-card direct">
          <span className="summary-icon">
            <Building2 size={18} />
          </span>
          <div>
            <span>主体一致线索</span>
            <strong>{count("direct").toString().padStart(2, "0")}</strong>
          </div>
          <small>核对现有及历史委托关系</small>
        </div>
        <div className="summary-card related">
          <span className="summary-icon">
            <GitBranch size={18} />
          </span>
          <div>
            <span>关联主体线索</span>
            <strong>{count("related").toString().padStart(2, "0")}</strong>
          </div>
          <small>关联本身不代表法律冲突</small>
        </div>
        <div className="summary-card similar">
          <span className="summary-icon">
            <Search size={18} />
          </span>
          <div>
            <span>名称近似线索</span>
            <strong>{count("similar").toString().padStart(2, "0")}</strong>
          </div>
          <small>需要人工排除身份误匹配</small>
        </div>
      </div>
      <div className="review-banner">
        <Info size={18} />
        <span>
          {run.summary.replace("条待律师复核的线索", "条核查线索") ||
            "正在检索真实来源，核查结果将在下方逐步显示。"}
          <small>
            “未发现线索”仅适用于本次来源范围，不等于已排除所有利益冲突。
          </small>
        </span>
        <span className="pending-label">{pending} 条待复核</span>
      </div>
      {run.gaps.length > 0 && (
        <details
          className="coverage-gaps"
          open={run.status === "partial" || run.status === "failed"}
        >
          <summary>
            <AlertTriangle size={15} />
            覆盖范围与未完成项（{run.gaps.length}）<ChevronDown size={14} />
          </summary>
          <ul>
            {run.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </details>
      )}
      {run.error && (
        <div className="alert error">
          <AlertTriangle size={18} />
          {run.error}
        </div>
      )}
      <ReviewBrief run={run} onTrace={onTrace} />
      <div className="result-tabs">
        <button
          className={cn(tab === "findings" && "selected")}
          onClick={() => setTab("findings")}
        >
          <FileSearch size={16} />
          线索与复核<span>{run.findings.length}</span>
        </button>
        <button
          className={cn(tab === "trace" && "selected")}
          onClick={() => setTab("trace")}
        >
          <SquareTerminal size={16} />
          调用记录<span>{run.traces.length}</span>
        </button>
        <span className="tab-detail">
          <Clock3 size={13} />
          {stamp(run.createdAt)}
        </span>
      </div>
      {tab === "findings" ? (
        run.findings.length ? (
          <div className="findings-layout">
            <section className="finding-list">
              <div className="finding-list-top">
                <h3>核查线索</h3>
                <select
                  aria-label="筛选核查线索"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                >
                  <option value="all">全部</option>
                  <option value="pending">待复核</option>
                  <option value="escalated">待进一步复核</option>
                  <option value="retained">已复核 · 保留问题</option>
                  <option value="dismissed">已排除</option>
                </select>
              </div>
              {displayed.map((f, i) => (
                <button
                  className={cn(
                    "finding-card",
                    finding?.id === f.id && "selected",
                  )}
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                >
                  <div>
                    <span className="finding-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Badge
                      tone={
                        f.type === "direct"
                          ? "red"
                          : f.type === "related"
                            ? "amber"
                            : "muted"
                      }
                    >
                      {typeLabel[f.type]}
                    </Badge>
                    <ChevronRight size={14} />
                  </div>
                  <h4>{f.title}</h4>
                  <p>{f.match.matterName}</p>
                  <span
                    className={cn(
                      "review-state",
                      f.review === "dismissed" && "done",
                      f.review === "retained" && "retained",
                    )}
                  >
                    {f.review === "dismissed" ? (
                      <Check size={12} />
                    ) : (
                      <span className="tiny-dot" />
                    )}
                    {reviewLabel[f.review]}
                  </span>
                </button>
              ))}
              {!displayed.length && (
                <p className="filtered-empty">此筛选下没有线索。</p>
              )}
            </section>
            {finding && (
              <>
                <section className="evidence-panel">
                  <div className="evidence-title">
                    <div className="eyebrow small">EVIDENCE CHAIN</div>
                    <h2>{typeLabel[finding.type]}的核查依据</h2>
                    <p>{finding.summary}</p>
                  </div>
                  <div className="relationship-flow">
                    <div className="relation-node current-entity">
                      <div>
                        <Building2 size={17} />
                        <Badge tone="green">已确认 · {run.partyRole}</Badge>
                      </div>
                      <strong>{run.entity.name}</strong>
                      <code>{run.entity.lei}</code>
                    </div>
                    {finding.relation && (
                      <>
                        <div className="relation-arrow">
                          <span>
                            {finding.relation.type === "direct-parent"
                              ? "直接会计合并母公司"
                              : "最终会计合并母公司"}
                          </span>
                          <ArrowDown size={17} />
                        </div>
                        <div className="relation-node">
                          <div>
                            <Network size={17} />
                            <Badge>公开关联</Badge>
                          </div>
                          <strong>{finding.relation.entity.name}</strong>
                          <code>{finding.relation.entity.lei}</code>
                        </div>
                      </>
                    )}
                    <div className="relation-arrow">
                      <span>
                        {finding.match.matchType === "exact-lei"
                          ? "LEI 一致 · 命中台账"
                          : finding.match.matchType === "exact-name"
                            ? "名称一致 · 身份仍需核对"
                            : "名称近似 · 身份未确认"}
                      </span>
                      <ArrowDown size={17} />
                    </div>
                    <div
                      className={cn(
                        "relation-node ledger-node",
                        finding.type === "similar" && "uncertain",
                      )}
                    >
                      <div>
                        <BookOpen size={17} />
                        <Badge tone="amber">虚构事项台账</Badge>
                      </div>
                      <strong>{finding.match.clientName}</strong>
                      <span>
                        {finding.match.matterRef} · {finding.match.matterName}
                      </span>
                    </div>
                  </div>
                  <MatchExplanation finding={finding} />
                  <div className="matter-details">
                    <h4>
                      已有事项信息<Badge>虚构</Badge>
                    </h4>
                    <dl>
                      <div>
                        <dt>当事人角色</dt>
                        <dd>{finding.match.role}</dd>
                      </div>
                      <div>
                        <dt>客户关系</dt>
                        <dd>{finding.match.relationship}</dd>
                      </div>
                      <div>
                        <dt>事项状态</dt>
                        <dd>{finding.match.status}</dd>
                      </div>
                      <div>
                        <dt>负责合伙人</dt>
                        <dd>{finding.match.partner}</dd>
                      </div>
                    </dl>
                    <p>{finding.match.note}</p>
                  </div>
                  <div className="evidence-links">
                    <h4>查看原始依据</h4>
                    <a
                      href={finding.entity.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 size={14} />
                      GLEIF 企业记录
                      <ExternalLink size={13} />
                    </a>
                    {finding.relation && (
                      <a
                        href={finding.relation.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Link2 size={14} />
                        公开母公司关系
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {finding.evidenceTraceIds.map((id) => {
                      const t = run.traces.find((t) => t.id === id);
                      return t ? (
                        <button key={id} onClick={() => onTrace(t)}>
                          <SquareTerminal size={14} />
                          {t.tool}
                          <ChevronRight size={14} />
                        </button>
                      ) : null;
                    })}
                    <small>
                      公开数据查询于 {stamp(finding.entity.fetchedAt)}
                    </small>
                  </div>
                </section>
                <FindingReview
                  key={finding.id}
                  finding={finding}
                  run={run}
                  onUpdate={onUpdate}
                  onError={onError}
                  toast={toast}
                />
              </>
            )}
          </div>
        ) : (
          <div className="panel">
            <Empty
              icon={
                run.status === "running" ? (
                  <LoaderCircle className="spin" size={27} />
                ) : (
                  <FileSearch size={27} />
                )
              }
              title={
                run.status === "running"
                  ? "正在收集核查证据"
                  : run.status === "failed"
                    ? "尚未形成可用的核查线索"
                    : "本次来源内未发现匹配线索"
              }
              text={
                run.status === "running"
                  ? "真实工具结果返回后，线索与证据会显示在这里。"
                  : "请查看调用记录与覆盖范围。无匹配不构成利益冲突已排除的结论。"
              }
            />
          </div>
        )
      ) : (
        <div className="panel trace-panel">
          <div className="panel-title">
            <div>
              <h3>真实工具调用记录</h3>
              <p>展开查看每次 MCP 调用的参数、返回内容与耗时。</p>
            </div>
            <Badge tone="green">
              {run.traces.filter((t) => t.initiator === "model").length}{" "}
              次由模型发起
            </Badge>
          </div>
          {run.traces.length ? (
            run.traces.map((t, i) => (
              <button
                className="trace-row"
                key={t.id}
                onClick={() => onTrace(t)}
              >
                <span className="trace-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={cn("trace-status", t.status)}>
                  {t.status === "success" ? (
                    <Check size={16} />
                  ) : (
                    <X size={16} />
                  )}
                </span>
                <div>
                  <strong>{t.tool}</strong>
                  <small>
                    {t.connector === "gleif"
                      ? "GLEIF 企业身份"
                      : "本地 SQLite 台账"}{" "}
                    ·{" "}
                    {t.initiator === "model"
                      ? "模型发起"
                      : t.initiator === "user"
                        ? "用户发起"
                        : "规则流程"}{" "}
                    · {stamp(t.startedAt)}
                  </small>
                </div>
                <code>{t.durationMs} ms</code>
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <Empty
              icon={<SquareTerminal size={25} />}
              title="等待首次工具调用"
              text="每一次完成或失败的调用都会在此保留记录。"
            />
          )}
        </div>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const elements = Array.from(
          panel.current.querySelectorAll<HTMLElement>(
            'button,a[href],input,textarea,select,[tabindex="0"]',
          ),
        );
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-btn" aria-label="关闭弹窗" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function About({
  onModelHelp,
  onNew,
  onSettings,
}: {
  onModelHelp: () => void;
  onNew: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="page-enter about-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">GETTING STARTED</div>
          <h1>使用指南</h1>
          <p>从建立委托到记录意见，让每一步都有据可查。</p>
        </div>
      </div>
      <div className="guide-start">
        <div>
          <span className="eyebrow small">YOUR FIRST MATTER</span>
          <h2>第一次使用，从一份事项开始。</h2>
          <p>
            可以填入融资示例体验完整流程；示例只填写表单，公开身份仍需实际查询确认。
          </p>
        </div>
        <button className="btn primary" onClick={onNew}>
          新建收案审查 <ArrowRight size={16} />
        </button>
      </div>
      <ol className="guide-steps">
        <li>
          <span>01</span>
          <h3>准备核查环境</h3>
          <p>
            连接公开身份与本地台账。配置模型后可选择 AI
            辅助，也可直接使用规则核查。
          </p>
          <button className="text-btn" onClick={onSettings}>
            管理数据连接 <ArrowRight size={14} />
          </button>
        </li>
        <li>
          <span>02</span>
          <h3>建立事项并确认身份</h3>
          <p>
            填写委托背景，逐一核对主体名称、辖区与
            LEI。最后检查范围和执行方式再启动。
          </p>
        </li>
        <li>
          <span>03</span>
          <h3>核对证据，记录意见</h3>
          <p>
            从工作台继续处理线索，补充材料引用，记录总意见。来源调用和各次复核均保留在案件中。
          </p>
        </li>
      </ol>
      <section className="guide-questions">
        <h2>常见问题</h2>
        {[
          [
            "为什么工具调用完成后，案件仍然待处理？",
            "调用完成表示本轮工具证据已取得。线索相关性、委托范围及保密义务仍需律师核实，材料与复核未完成时会继续保留待办。",
          ],
          [
            "查不到企业，是否可以继续？",
            "GLEIF 只覆盖已登记 LEI 的企业，查不到不代表企业不存在。至少确认一方后可以开始，未确认的相关方仍在案件范围内，形成身份补证项。",
          ],
          [
            "离开页面后，填写的内容会保留吗？",
            "新建事项及线索复核草稿会在当前标签页暂存，支持页面切换和刷新。材料页未保存的摘录说明在切换原文前请先保存；点击创建或保存后，记录才进入本机案件库。",
          ],
          [
            "来源失败或模型未完成怎么办？",
            "打开该主体查看错误与调用记录。恢复连接或模型配置后重新核查；旧轮次保留，新证据会使旧总意见失效并恢复草稿。",
          ],
          [
            "不承接事项，也必须排除所有线索吗？",
            "不需要。律师可以记录不承接意见并结束本轮审查，原有缺口和线索继续留存。运行中的核查须结束后才能记录这一状态。",
          ],
          [
            "材料会发送到哪里？",
            "PDF 导入后保存在本机。只有明确授权某个版本并启动 AI 材料复核，才会把本案背景、问题及该版本原文发送到配置的模型。撤回授权会阻止后续读取，不能撤回已发送的数据。原型不发送合伙人通知。",
          ],
          [
            "怎样处理一个具体审查问题？",
            "进入案件的「审查问题」，将补证任务或 AI 建议加入清单，关联原文依据并指定责任人。待补信息处理后可记录意见；新材料版本会让相关问题重新待复核，须补充新版依据并确认影响。问题处理记录不自动完成原补证任务。",
          ],
          [
            "如何交给复核律师继续修改？",
            "在「审查问题」导出可编辑 Word 备忘录，包含当前问题、待补事项、原文版本与意见历史。导出保留草稿和未决问题，不自动批准收案，也不会把 Word 中的修改回写系统。",
          ],
        ].map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <details className="guide-technical">
        <summary>原型范围、集成方案与开源参考</summary>
        <div className="about-intro">
          <span className="intro-number">01—03</span>
          <div>
            <h2>识别主体 → 交叉核查 → 人工复核</h2>
            <p>
              目标用户是负责新事项收案的经办律师与合伙人。把分散在公开企业信息和律所台账中的关系线索，组织成可解释、可追溯、可复核的工作结果。
            </p>
          </div>
        </div>
        <div className="about-grid">
          <section className="panel">
            <h3>本版本已经覆盖的工作流</h3>
            <ol>
              <li>接入 GLEIF、本地 SQLite 台账和案件材料 MCP。</li>
              <li>添加拟委托人、交易对方和担保方，逐方查询并确认 LEI。</li>
              <li>检索主体及公开母公司关系，并与虚构台账交叉比对。</li>
              <li>查看匹配依据、来源链接和真实调用记录。</li>
              <li>导入 PDF，定位原文页，授权 AI 整理带引用的核实问题。</li>
              <li>保留材料版本与摘录，记录人工复核及总意见，导出报告。</li>
            </ol>
          </section>
          <section className="panel">
            <h3>有意控制的范围</h3>
            <p>
              支持同一案件最多 6
              方企业与其公开母公司核查，保留补证、逐项复核及案件意见。不覆盖自然人身份、完整集团图谱、制裁筛查或自动冲突豁免。
            </p>
            <p>
              LEI
              和名称匹配用于产生核查线索。适用司法辖区、现有委托范围、保密义务等仍需律师判断。公司关联本身不能直接推出冲突结论。
            </p>
            <p>
              每个已确认主体都会核查；未确认主体会保留为阻塞项。工具权限同时约束手动、规则和
              AI 调用。
            </p>
          </section>
          <section className="panel">
            <h3>真实接入与模拟数据</h3>
            <p>
              <b>真实：</b>官方 SDK 的 MCP 客户端与三个独立工具服务、GLEIF
              外网查询、本地 SQLite 检索、保存与导出。
            </p>
            <p>
              <b>模拟：</b>
              律所身份、台账事项、客户委托关系。公众企业名称可真实存在，但不表示该企业与演示律所有任何实际关系。
            </p>
            <button className="text-btn" onClick={onModelHelp}>
              了解模型配置与验收边界
              <ArrowUpRight size={14} />
            </button>
          </section>
          <section className="panel">
            <h3>如何融入 Alta Lex</h3>
            <p>
              作为 Project
              创建前的“收案核查”入口，共用组织身份与连接器授权，返回线索、证据与人工复核状态。
            </p>
            <p>
              正式接入时应增加多租户隔离、角色权限、机密事项可见范围、不可篡改审计及组织级模型数据授权。本原型不依赖
              Alta Lex 源码。
            </p>
          </section>
        </div>
        <div className="references">
          <div className="eyebrow small">OPEN SOURCE & PRIMARY SOURCES</div>
          <h3>参考透明，边界明确。</h3>
          <p>
            直接使用官方 MCP
            SDK；参考开源主体匹配、证据审阅与人工接管设计。详细版本、许可证和研究链接随代码交付。
          </p>
          <div>
            <a
              href="https://github.com/modelcontextprotocol/typescript-sdk"
              target="_blank"
              rel="noreferrer"
            >
              MCP TypeScript SDK
              <ExternalLink size={14} />
            </a>
            <a
              href="https://github.com/opensanctions/yente"
              target="_blank"
              rel="noreferrer"
            >
              OpenSanctions yente
              <ExternalLink size={14} />
            </a>
            <a
              href="https://github.com/Open-Source-Legal/OpenContracts"
              target="_blank"
              rel="noreferrer"
            >
              OpenContracts
              <ExternalLink size={14} />
            </a>
            <a
              href="https://www.gleif.org/en/lei-data/gleif-api"
              target="_blank"
              rel="noreferrer"
            >
              GLEIF API
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </details>
    </div>
  );
}

function FindingReview({
  finding,
  run,
  onUpdate,
  onError,
  toast,
}: {
  finding: Finding;
  run: Run;
  onUpdate: (value: Run) => void;
  onError: (message: string) => void;
  toast: (message: string) => void;
}) {
  const draft = useReviewDraft(`finding:${run.id}:${finding.id}`, {
    note: finding.reviewNote,
  });
  const { note } = draft.value;
  const [saving, setSaving] = useState(false);
  async function review(value: Finding["review"]) {
    if (!finding) return;
    setSaving(true);
    onError("");
    try {
      onUpdate(
        await post<Run>(`/runs/${run.id}/findings/${finding.id}/review`, {
          review: value,
          note,
        }),
      );
      draft.accept({ note });
      toast(
        value === "dismissed"
          ? "排除理由已保存，可随时重新复核"
          : value === "retained"
            ? "已记录复核结果并保留问题，请在案件总意见说明处理依据"
            : value === "escalated"
              ? "已标记进一步复核，不会向他人发送通知"
              : "已恢复为待复核",
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <aside className="review-panel">
      <span className="review-symbol">
        <ShieldCheck size={25} strokeWidth={1.5} />
      </span>
      <h3>律师复核</h3>
      <p>结合委托范围、相关性及适用执业规则，对这条线索作出处理。</p>
      <div className="review-current">
        <span>当前状态</span>
        <Badge tone={finding.review === "dismissed" ? "green" : "amber"}>
          {reviewLabel[finding.review]}
        </Badge>
      </div>
      <label className="field-label" htmlFor="review-note">
        复核说明 <span>处理时必填</span>
      </label>
      <textarea
        id="review-note"
        rows={5}
        maxLength={2000}
        value={note}
        onChange={(e) => draft.setValue({ note: e.target.value })}
        placeholder={
          finding.type === "similar"
            ? "如：LEI 不同，名称近似但不是同一法律主体…"
            : "如：需要向事项负责律师确认现有委托范围…"
        }
      />
      <button
        className="btn primary full"
        disabled={saving || note.trim().length < 2 || run.status === "running"}
        onClick={() => void review("escalated")}
      >
        {saving ? (
          <Spinner text="保存中" />
        ) : (
          <>
            <FileCheck2 size={15} />
            标记进一步复核
          </>
        )}
      </button>
      <button
        className="btn secondary full"
        disabled={saving || note.trim().length < 2 || run.status === "running"}
        onClick={() => void review("dismissed")}
      >
        <Check size={15} />
        排除此条线索
      </button>
      <button
        className="btn secondary full"
        disabled={saving || note.trim().length < 2 || run.status === "running"}
        onClick={() => void review("retained")}
      >
        <FileCheck2 size={15} />
        已复核，保留问题
      </button>
      {draft.dirty && (
        <small className="draft-status" role="status">
          {draft.storageAvailable
            ? "未提交 · 当前标签页已暂存"
            : "请提交后离开页面"}
        </small>
      )}
      {finding.review !== "pending" && (
        <button
          className="text-btn reset-review"
          disabled={saving}
          onClick={() => void review("pending")}
        >
          重新设为待复核
        </button>
      )}
      {finding.reviewedAt && (
        <p className="saved-at">
          <Check size={12} />
          已保存于 {stamp(finding.reviewedAt)}
        </p>
      )}
      <div className="review-footnote">
        <Info size={15} />
        <span>
          保留问题表示已记录核实结果，仍需在案件总意见说明处理依据。进一步复核仍属于待办。以上操作仅保存本地记录。
        </span>
      </div>
    </aside>
  );
}
