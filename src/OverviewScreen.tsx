import { useEffect, useState, type CSSProperties } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleHelp,
  Clock3,
  FileText,
  Fingerprint,
  Layers3,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plug,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import type { Overview, OverviewStage } from "../shared/overview";
import type { CaseTab, Page } from "./navigation";
import { api } from "./api";
import "./overview.css";
import "./overview-motion.css";

const colors = ["#ffba8a", "#789eff", "#6cdef3", "#b7dcff", "#627c9f"];
const date = (s: string) =>
  new Date(s).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  });
type Filter =
  | "active"
  | "all"
  | "findings"
  | "issues"
  | "tasks"
  | OverviewStage;
export default function OverviewScreen({
  onNavigate,
  onOpen,
}: {
  onNavigate: (page: Page) => void;
  onOpen: (id: string, tab?: CaseTab) => void;
}) {
  const [data, setData] = useState<Overview>();
  const [days, setDays] = useState<7 | 30>(7);
  const [refresh, setRefresh] = useState(0);
  const [auto, setAuto] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewError, setViewError] = useState("");
  const [full, setFull] = useState(Boolean(document.fullscreenElement));
  const [filter, setFilter] = useState<Filter>("active");
  const [selectedDay, setSelectedDay] = useState("");
  const [method, setMethod] = useState(false);
  const [motion, setMotion] = useState(() => {
    try {
      return localStorage.getItem("alta:overview-motion") !== "off";
    } catch {
      return true;
    }
  });
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(preference.matches);
    const visibility = () => setHidden(document.hidden);
    preference.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      preference.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  function toggleMotion() {
    setMotion(!motion);
    try {
      localStorage.setItem("alta:overview-motion", motion ? "off" : "on");
    } catch {
      /* The switch still works for this visit. */
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api<Overview>(`/overview?days=${days}`, { signal: controller.signal })
      .then((v) => {
        setData(v);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days, refresh]);
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (!document.hidden) setRefresh((n) => n + 1);
    }, 30_000);
    return () => clearInterval(timer);
  }, [auto]);
  useEffect(() => {
    const listener = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setViewError("当前浏览器不支持全屏展示，可使用浏览器的全屏功能。");
    }
  }
  function navigate(page: Page) {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    onNavigate(page);
  }
  function open(id: string, tab: CaseTab = "assistant") {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    onOpen(id, tab);
  }
  const active = (c: Overview["queue"][number]) =>
    c.stage !== "recorded" && c.stage !== "closed";
  const queue =
    data?.queue.filter(
      (c) =>
        filter === "all" ||
        (filter === "active"
          ? active(c)
          : filter === "findings"
            ? active(c) && c.pendingFindings > 0
            : filter === "issues"
              ? active(c) && c.openIssues > 0
              : filter === "tasks"
                ? active(c) && c.openTasks > 0
                : c.stage === filter),
    ) || [];
  const maxCalls = Math.max(1, ...(data?.trend.map((d) => d.calls) || []));
  const selected = data?.trend.find((d) => d.date === selectedDay);
  const stages = data?.stages || [];
  let start = 0;
  const gradient = stages
    .map((s, i) => {
      const from = start;
      start += data?.totals.cases ? (s.count / data.totals.cases) * 100 : 0;
      return `${colors[i]} ${from}% ${start}%`;
    })
    .join(",");
  const queueTab = (c: Overview["queue"][number]): CaseTab =>
    filter === "tasks"
      ? "tasks"
      : filter === "findings"
        ? "parties"
        : filter === "issues"
          ? "issues"
          : !active(c)
            ? "review"
            : c.stage === "identity" || c.stage === "evidence"
              ? "parties"
              : "assistant";

  return (
    <div
      className="observatory"
      data-motion={motion && !reducedMotion ? "on" : "off"}
      data-paused={hidden}
    >
      <div className="obs-atmosphere" aria-hidden="true">
        <span className="obs-aurora obs-aurora-blue" />
        <span className="obs-aurora obs-aurora-cyan" />
        <span className="obs-grid-light" />
      </div>
      <header className="obs-topbar">
        <button
          className="obs-brand"
          onClick={() => navigate("workspace")}
          aria-label="返回收案工作台"
        >
          <span>a.</span>
          <div>
            altalex<small>CONFLICT DESK</small>
          </div>
        </button>
        <nav aria-label="大屏导航">
          <span className="obs-current">
            <Activity size={14} />
            审查总览
          </span>
          <button onClick={() => navigate("workspace")}>
            案件工作台 <ArrowUpRight size={12} />
          </button>
          <button onClick={() => navigate("tools")}>
            工具调用台 <ArrowUpRight size={12} />
          </button>
        </nav>
        <div className="obs-top-actions">
          <span className="obs-local">本地演示空间</span>
          <button
            className="obs-motion-toggle"
            onClick={toggleMotion}
            disabled={reducedMotion}
            aria-pressed={motion && !reducedMotion}
            title={
              reducedMotion
                ? "已跟随系统的减弱动态效果设置"
                : "仅切换视觉动效，不影响数据刷新"
            }
          >
            <Waves size={15} />
            {reducedMotion ? "减弱动效" : motion ? "动效开启" : "动效关闭"}
          </button>
          <button
            className="obs-icon"
            onClick={fullscreen}
            aria-label={full ? "退出全屏" : "全屏展示"}
          >
            {full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          <button
            className="obs-icon"
            onClick={() => navigate("workspace")}
            aria-label="退出大屏"
          >
            <ArrowLeft size={17} />
          </button>
        </div>
      </header>
      <div className="obs-content">
        <div className="obs-heading">
          <div>
            <span className="obs-eyebrow">MATTER INTELLIGENCE / 01</span>
            <h1>每一份委托，尽在视野。</h1>
            <p>
              澄明律师事务所 <i /> 收案审查全局态势
            </p>
          </div>
          <div className={`obs-sync ${loading ? "is-syncing" : ""}`}>
            <span className={error ? "obs-sync-error" : ""}>
              <i />
              {error ? "更新未成功" : loading ? "正在同步" : "本地记录已同步"}
            </span>
            <small>
              {data
                ? `${date(data.generatedAt)} · UTC+8`
                : "正在读取案件与工具记录"}
            </small>
            <div>
              <button onClick={() => setAuto(!auto)} aria-pressed={auto}>
                {auto ? <Pause size={12} /> : <Play size={12} />}
                {auto ? "30 秒自动刷新" : "自动刷新已暂停"}
              </button>
              <button
                onClick={() => setRefresh((n) => n + 1)}
                disabled={loading}
                aria-label="刷新总览"
              >
                <RefreshCw size={13} className={loading ? "spin" : ""} />
              </button>
            </div>
          </div>
        </div>
        {(error || viewError) && (
          <div className="obs-error" role="alert">
            {error || viewError}
            {error && data && " · 以下保留上次成功快照。"}
            <button
              onClick={() => {
                if (error) setRefresh((n) => n + 1);
                else setViewError("");
              }}
            >
              {error ? "重试" : "关闭"}
            </button>
          </div>
        )}
        {!data ? (
          <div className="obs-loading" role="status">
            <Scale size={42} strokeWidth={1} />
            <h2>{error ? "暂时无法载入总览" : "正在汇集审查记录"}</h2>
            <p>案件 · 原文材料 · 工具调用</p>
          </div>
        ) : (
          <>
            <section className="obs-kpis" aria-label="当前审查指标">
              {[
                {
                  label: "进行中的案件",
                  n: data.totals.active,
                  unit: "件",
                  note: `共 ${data.totals.cases} 件收案审查`,
                  icon: Scale,
                  filter: "active" as Filter,
                },
                {
                  label: "待复核线索",
                  n: data.totals.pendingFindings,
                  unit: "条",
                  note: "来自当前主体核查",
                  icon: Fingerprint,
                  filter: "findings" as Filter,
                },
                {
                  label: "未结审查问题",
                  n: data.totals.openIssues,
                  unit: "项",
                  note: `${data.totals.staleIssues} 项受材料版本变化影响`,
                  icon: ShieldCheck,
                  filter: "issues" as Filter,
                },
                {
                  label: "待补材料与信息",
                  n: data.totals.openTasks,
                  unit: "项",
                  note: "进行中案件的未完成补证",
                  icon: FileText,
                  filter: "tasks" as Filter,
                },
              ].map((m, i) => (
                <button
                  key={m.label}
                  className={`obs-kpi ${filter === m.filter ? "selected" : ""}`}
                  onClick={() => setFilter(m.filter)}
                  aria-pressed={filter === m.filter}
                >
                  <span className="obs-kpi-label">
                    {m.label}
                    <m.icon size={17} strokeWidth={1.4} />
                  </span>
                  <div>
                    <strong>{String(m.n).padStart(2, "0")}</strong>
                    <span>{m.unit}</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <small>
                    <i className={`obs-dot tone-${i}`} />
                    {m.note}
                  </small>
                </button>
              ))}
            </section>
            <div className="obs-main-grid">
              <section className="obs-panel obs-landscape">
                <div className="obs-panel-head">
                  <div>
                    <span className="obs-eyebrow">REVIEW LANDSCAPE</span>
                    <h2>审查态势</h2>
                  </div>
                  <span className="obs-caption">
                    当前全量 · {data.totals.cases} 件
                  </span>
                </div>
                <div className="obs-landscape-body">
                  <div className="obs-orbit">
                    <div className="obs-orbit-line" aria-hidden="true" />
                    <div
                      className="obs-ring"
                      style={{
                        background: data.totals.cases
                          ? `conic-gradient(from -90deg, ${gradient})`
                          : "#263c5a",
                      }}
                      role="img"
                      aria-label={stages
                        .map((s) => `${s.label} ${s.count} 件`)
                        .join("，")}
                    >
                      <div>
                        <span>待继续处理</span>
                        <strong>
                          {String(data.totals.active).padStart(2, "0")}
                        </strong>
                        <small>ACTIVE MATTERS</small>
                      </div>
                    </div>
                    <span className="obs-orbit-caption">
                      <ShieldCheck size={12} /> 专业判断 · 律师掌舵
                    </span>
                  </div>
                  <div className="obs-stage-list">
                    {stages.map((s, i) => (
                      <button
                        key={s.key}
                        onClick={() => setFilter(s.key)}
                        className={filter === s.key ? "selected" : ""}
                        aria-pressed={filter === s.key}
                      >
                        <i style={{ background: colors[i] }} />
                        <span>{s.label}</span>
                        <strong>{s.count}</strong>
                        <small>件</small>
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="obs-panel-foot">
                  <span>每案归入一个当前阶段</span>
                  <button onClick={() => setMethod(!method)}>
                    <CircleHelp size={12} /> 统计口径
                  </button>
                </div>
              </section>
              <section className="obs-panel obs-priority">
                <div className="obs-panel-head">
                  <div>
                    <span className="obs-eyebrow">REQUIRES YOUR ATTENTION</span>
                    <h2>需要你关注</h2>
                  </div>
                  <span className="obs-count">{data.totals.openIssues}</span>
                </div>
                <p className="obs-section-note">
                  材料变化优先展示，其余按更新时间
                </p>
                <div className="obs-priority-list">
                  {data.issues.length ? (
                    data.issues.slice(0, 3).map((i, n) => (
                      <button
                        key={i.id}
                        onClick={() => open(i.caseId, "issues")}
                      >
                        <span className="obs-priority-number">0{n + 1}</span>
                        <div>
                          <span
                            className={
                              i.status === "stale" ? "obs-tag amber" : "obs-tag"
                            }
                          >
                            {i.status === "stale"
                              ? "材料变化待复核"
                              : i.status === "reviewing"
                                ? "复核中"
                                : "待核实"}
                          </span>
                          <strong>{i.title}</strong>
                          <small>{i.caseName}</small>
                        </div>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <div className="obs-quiet">
                      <Check size={27} />
                      <strong>当前没有未结审查问题</strong>
                      <p>主体线索和补证待办仍可在下方查看。</p>
                    </div>
                  )}
                </div>
                <button
                  className="obs-text-link"
                  onClick={() => setFilter("issues")}
                >
                  查看相关案件 <ArrowUpRight size={13} />
                </button>
              </section>
              <section className="obs-panel obs-connections">
                <div className="obs-panel-head">
                  <div>
                    <span className="obs-eyebrow">CONNECTED INTELLIGENCE</span>
                    <h2>数据连接</h2>
                  </div>
                  <Plug size={16} />
                </div>
                <div className="obs-connector-list">
                  {data.tools.connectors.map((c, i) => (
                    <button key={c.id} onClick={() => navigate("connectors")}>
                      <span className="obs-connector-mark">
                        {i === 0 ? (
                          <Fingerprint size={19} />
                        ) : i === 1 ? (
                          <Layers3 size={19} />
                        ) : (
                          <FileText size={19} />
                        )}
                      </span>
                      <div>
                        <strong>
                          {c.id === "gleif"
                            ? "GLEIF 企业身份"
                            : c.id === "ledger"
                              ? "律所事项台账"
                              : "案件材料库"}
                        </strong>
                        <small>
                          {c.id === "gleif"
                            ? "公开企业与母公司关系"
                            : c.id === "ledger"
                              ? "本地虚构委托记录"
                              : "PDF 原文与版本"}
                        </small>
                      </div>
                      <span
                        className={`obs-connection-status ${c.status === "error" ? "error" : c.connected ? "on" : ""}`}
                      >
                        <i />
                        {c.status === "error"
                          ? "异常"
                          : c.connected
                            ? "已连接"
                            : "未连接"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="obs-assets">
                  <span>
                    <strong>{data.totals.documents}</strong> 份材料
                  </span>
                  <span>
                    <strong>{data.totals.versions}</strong> 个版本
                  </span>
                  <span>
                    <strong>{data.totals.pages}</strong> 页原文
                  </span>
                </div>
                <div className="obs-panel-foot">
                  <span>
                    {data.totals.authorizedLatest} 份最新材料已授权 AI
                  </span>
                  <button onClick={() => navigate("connectors")}>
                    管理连接 <ArrowUpRight size={12} />
                  </button>
                </div>
              </section>
            </div>
            <div className="obs-lower-grid">
              <section className="obs-panel obs-queue">
                <div className="obs-panel-head">
                  <div>
                    <span className="obs-eyebrow">NEXT ACTIONS</span>
                    <h2>
                      案件工作队列 <small>{queue.length} 件</small>
                    </h2>
                  </div>
                  <label className="obs-select">
                    <span className="sr-only">筛选案件队列</span>
                    <select
                      aria-label="筛选案件队列"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as Filter)}
                    >
                      <option value="active">进行中案件</option>
                      <option value="all">全部案件</option>
                      <option value="findings">有待复核线索</option>
                      <option value="issues">有未结问题</option>
                      <option value="tasks">有待补材料</option>
                      {stages.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="obs-queue-list">
                  {queue.length ? (
                    queue.slice(0, 4).map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => open(c.id, queueTab(c))}
                      >
                        <span className="obs-row-index">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="obs-case-title">
                          <strong>{c.name}</strong>
                          <small>
                            {c.confirmed}/{c.parties} 方身份已确认 <i />
                            {date(c.updatedAt)} 更新
                          </small>
                        </div>
                        <span className="obs-case-counts">
                          {c.pendingFindings} 线索 <i />
                          {c.openTasks} 补证
                        </span>
                        <span className="obs-stage-chip">
                          {stages.find((s) => s.key === c.stage)?.label}
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <div className="obs-queue-empty">
                      此筛选条件下没有案件。
                      <button onClick={() => setFilter("all")}>查看全部</button>
                    </div>
                  )}
                </div>
                <div className="obs-panel-foot">
                  <span>
                    {queue.length > 4
                      ? `展示最近更新的 4 / ${queue.length} 件`
                      : "按最近更新时间排序"}
                  </span>
                  <button onClick={() => navigate("workspace")}>
                    进入案件工作台 <ArrowUpRight size={12} />
                  </button>
                </div>
              </section>
              <section className="obs-panel obs-trend">
                <div className="obs-panel-head">
                  <div>
                    <span className="obs-eyebrow">TOOL ACTIVITY</span>
                    <h2>工具调用脉搏</h2>
                  </div>
                  <div className="obs-period" aria-label="工具趋势观察窗口">
                    {([7, 30] as const).map((n) => (
                      <button
                        key={n}
                        aria-pressed={days === n}
                        className={days === n ? "selected" : ""}
                        onClick={() => {
                          if (n !== days) {
                            setDays(n);
                            setSelectedDay("");
                          }
                        }}
                      >
                        {n} 天
                      </button>
                    ))}
                  </div>
                </div>
                <div className="obs-trend-stats">
                  <strong>
                    {data.tools.total}
                    <small>次已留存调用</small>
                  </strong>
                  <span>
                    <i />
                    {data.tools.success} 成功 <b> / </b>
                    <em>{data.tools.errors} 失败</em>
                  </span>
                </div>
                <div
                  className={`obs-chart ${data.trend.length > 7 ? "dense" : ""}`}
                  key={data.period.days}
                  role="group"
                  aria-label={`近 ${data.period.days} 天已留存工具调用柱状图`}
                  style={{ "--bars": data.trend.length } as CSSProperties}
                >
                  {data.trend.map((d, i) => (
                    <button
                      key={d.date}
                      className={d.date === selectedDay ? "selected" : ""}
                      aria-pressed={d.date === selectedDay}
                      aria-label={`${d.date}，${d.calls} 次调用，${d.errors} 次失败，${d.cases} 件新增案件`}
                      title={`${d.date} · ${d.calls} 次调用 / ${d.errors} 次失败`}
                      style={
                        { "--bar-order": Math.min(i, 10) } as CSSProperties
                      }
                      onClick={() => setSelectedDay(d.date)}
                    >
                      <span
                        style={{
                          height: `${(d.calls / maxCalls) * 100}%`,
                          minHeight: d.calls ? 3 : 1,
                        }}
                      >
                        <i
                          style={{
                            height: `${d.calls ? (d.errors / d.calls) * 100 : 0}%`,
                          }}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="obs-chart-axis">
                  <span>{data.trend[0]?.date.slice(5).replace("-", "/")}</span>
                  <span>近 {data.period.days} 天 · 北京时间 · 点击查看</span>
                  <span>
                    {data.trend.at(-1)?.date.slice(5).replace("-", "/")}
                  </span>
                </div>
                <div className="obs-chart-detail" aria-live="polite">
                  {selected ? (
                    <>
                      <Clock3 size={12} />
                      <span>
                        {selected.date.slice(5)} · {selected.calls} 次调用 ·{" "}
                        {selected.errors} 次失败 · {selected.cases} 件新增
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      <span>
                        {data.tools.model} 次由模型发起 ·{" "}
                        {data.trend.reduce((n, d) => n + d.cases, 0)}{" "}
                        件同期新增案件
                      </span>
                    </>
                  )}
                </div>
              </section>
            </div>
            <section className="obs-activity">
              <div>
                <Activity size={15} />
                <span>最近动态</span>
                <small>案件操作记录</small>
              </div>
              <div className="obs-activity-items">
                {data.activity.length ? (
                  data.activity.slice(0, 3).map((a) => (
                    <button
                      key={`${a.caseId}:${a.id}`}
                      onClick={() => open(a.caseId, "activity")}
                    >
                      <time>{date(a.at)}</time>
                      <strong>{a.message}</strong>
                      <span>{a.caseName}</span>
                      <ArrowUpRight size={13} />
                    </button>
                  ))
                ) : (
                  <p>尚无案件操作记录，从新建审查开始。</p>
                )}
              </div>
            </section>
            {method && (
              <section className="obs-method">
                <h2>统计口径</h2>
                <p>
                  案件指标和材料资产为当前全量快照；线索、未结问题和补证只统计进行中的案件，已记录完备与不承接结案不计入待办。材料变化按问题的有效状态计算。
                </p>
                <p>
                  阶段互斥：先区分结案，再检查身份确认、当前核查完成度及失败／部分完成状态，其余归入律师复核。工具趋势按北京时间的自然日统计，包含今天；按凭证
                  ID 去重，仅覆盖已保存的主体核查、材料分析、AI
                  助理及独立工具台记录，不覆盖未留存的临时读取。柱条可显示当日新增案件；选择
                  7／30
                  天不会改变全量案件指标。调用成功表示工具返回成功，不代表法律判断正确。
                </p>
                <button onClick={() => setMethod(false)}>收起说明</button>
              </section>
            )}
          </>
        )}
        <footer className="obs-footer">
          <span>
            <span className="obs-footer-mark">a.</span>ALTA CONFLICT DESK <i />{" "}
            OBSERVATORY
          </span>
          <span>律所委托数据为虚构演示 · 不自动作出收案决定</span>
          <button onClick={() => setMethod(!method)} aria-expanded={method}>
            统计口径 <CircleHelp size={12} />
          </button>
        </footer>
      </div>
    </div>
  );
}
