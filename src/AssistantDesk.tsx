import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileSearch,
  Layers,
  LoaderCircle,
  Play,
  RefreshCw,
  Sparkles,
  Plus,
  ChevronRight,
  FileText,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import type { AssistantRun, AssistantSnapshot } from "../shared/assistant";
import type { CaseView, Trace } from "../shared/types";
import { issueCategories } from "../shared/issues";
import type { MaterialCitation, MaterialPage } from "../shared/materials";
import type { CaseTab } from "./navigation";
import { api, post } from "./api";
import AssistantDraft from "./AssistantDraft";
import ReviewDrawer from "./ReviewDrawer";
import "./assistant.css";
const PdfPage = lazy(() => import("./PdfPage"));
const presets = [
  {
    label: "制定核实顺序",
    text: "根据当前材料与已有未决问题，建议最值得先核实的三件事，说明依据和需要补齐的信息，并起草补证请求。",
  },
  {
    label: "准备补证请求",
    text: "围绕现有未决审查问题，明确应索取的具体材料，起草可以由律师修改后使用的补证请求，尽量合并重复问题。",
  },
  {
    label: "梳理材料变化",
    text: "对照所选新旧版本，找出会影响委托范围、客户边界或保密义务的变化，提出后续核实行动与补证请求。",
  },
];
type Props = {
  onConnectionChange: () => Promise<void>;
  matter: CaseView;
  onUpdate: (v: CaseView) => void;
  onTab: (t: CaseTab) => void;
  onTrace: (t: Trace) => void;
  onError: (s: string) => void;
};

export default function AssistantDesk({
  onConnectionChange,
  matter,
  onUpdate,
  onTab,
  onTrace,
  onError,
}: Props) {
  const base = `/cases/${matter.id}/assistant`;
  const [data, setData] = useState<AssistantSnapshot>();
  const [selected, setSelected] = useState<string[] | null>(null);
  const [question, setQuestion] = useState(presets[0].text);
  const [runId, setRunId] = useState("");
  const [active, setActive] = useState(0);
  const [briefOpen, setBriefOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [detail, setDetail] = useState<"overview" | "sources" | "draft">(
    "overview",
  );
  const [quote, setQuote] = useState("");
  const sourceTrigger = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState<{ data: MaterialPage; trace: Trace }>();
  async function load() {
    const next = await api<AssistantSnapshot>(base);
    setData(next);
    setError("");
    return next;
  }
  useEffect(() => {
    let live = true;
    api<AssistantSnapshot>(base)
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [base, matter.revision]);
  const running = data?.runs.some((r) => r.status === "running");
  useEffect(() => {
    if (!running) return;
    let live = true;
    const timer = setInterval(() => {
      void api<AssistantSnapshot>(base)
        .then((d) => {
          if (live) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    }, 1600);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [running, base]);
  if (!data)
    return (
      <div
        className="panel assistant-loading"
        role={error ? "alert" : "status"}
      >
        {error || "正在整理本案工作范围…"}
        {error && (
          <button
            className="btn secondary"
            onClick={() => void load().catch((e) => setError(e.message))}
          >
            重新加载
          </button>
        )}
      </div>
    );
  const ids =
    selected ??
    data.materials
      .filter((m) => m.latest && m.modelAllowed)
      .slice(0, 4)
      .map((m) => m.id);
  const run = data.runs.find((r) => r.id === runId) || data.runs[0];
  const stale = run && run.basisRevision !== data.caseRevision;
  const pages = data.materials
    .filter((m) => ids.includes(m.id))
    .reduce((n, m) => n + m.pageCount, 0);
  const pending = data.issues.filter((i) => i.effectiveStatus !== "resolved");
  const changed = data.issues.filter((i) => i.effectiveStatus === "stale");
  async function work(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function start() {
    await work("start", async () => {
      const next = await post<AssistantRun>(`${base}/runs`, {
        question,
        versionIds: ids,
        expectedRevision: data!.caseRevision,
      });
      setRunId(next.id);
      setActive(0);
      setDetail("overview");
      setSource(undefined);
      setSetupOpen(false);
      await load();
    });
  }
  async function openSource(c: MaterialCitation) {
    sourceTrigger.current = document.activeElement as HTMLElement | null;
    await work("source", async () => {
      setQuote(c.quote);
      setSource(
        await api(
          `/cases/${matter.id}/materials/${c.versionId}/pages/${c.page}`,
        ),
      );
    });
  }
  const action = run?.status === "completed" ? run.actions[active] : undefined;
  const adoptedCount = run ? Object.keys(run.applications).length : 0;
  const receipts =
    run?.traces.filter((t) => t.status === "success").length || 0;
  const changeAction = (index: number) => {
    setActive(index);
    setDetail("overview");
  };
  return (
    <div className="assistant-desk">
      <section className="review-hero">
        <div className="review-hero-title">
          <span className="review-emblem">
            <Sparkles size={24} strokeWidth={1.3} />
          </span>
          <div>
            <span className="review-kicker">MATTER INTELLIGENCE</span>
            <h2>审查行动台</h2>
            <p>从核实依据，到下一份工作草稿。</p>
          </div>
        </div>
        <div className="review-hero-metrics">
          <button onClick={() => onTab("issues")}>
            <strong>{pending.length.toString().padStart(2, "0")}</strong>
            <span>
              未决问题 <ChevronRight size={12} />
            </span>
          </button>
          <button onClick={() => onTab("issues")}>
            <strong>{changed.length.toString().padStart(2, "0")}</strong>
            <span>
              版本待复核 <ChevronRight size={12} />
            </span>
          </button>
        </div>
        <button className="review-new-task" onClick={() => setSetupOpen(true)}>
          <Plus size={16} />
          {running ? "查看运行范围" : "发起新分析"}
        </button>
      </section>
      {error && !setupOpen && (
        <div className="assistant-alert" role="alert">
          {error}
          <button onClick={() => void load().catch((e) => setError(e.message))}>
            <RefreshCw size={14} />
            刷新状态
          </button>
        </div>
      )}
      {notice && (
        <div className="assistant-notice" role="status">
          <Check size={16} />
          {notice}
          <button onClick={() => onTab("issues")}>
            查看审查问题 <ArrowRight size={14} />
          </button>
        </div>
      )}
      {stale && run?.status === "completed" && (
        <div className="assistant-alert">
          案件资料已变化，本轮建议仅供回看。
          <button onClick={() => setSetupOpen(true)}>
            基于当前材料重新分析 <ArrowRight size={13} />
          </button>
        </div>
      )}
      <div className="review-toolbar">
        <div>
          <span
            className={`review-status-dot ${run?.status === "completed" ? "complete" : ""}`}
          />
          <strong>
            {run?.status === "completed"
              ? "本轮核实行动"
              : run?.status === "running"
                ? "正在准备行动建议"
                : "审查工作区"}
          </strong>
          {run?.status === "completed" && (
            <span className="review-pill">
              {run.actions.length} 项建议 · {adoptedCount} 项草稿已采用
            </span>
          )}
        </div>
        <div>
          {run && (
            <span className="review-run-basis">
              依据修订 {run.caseRevision}
            </span>
          )}
          {data.runs.length > 0 && (
            <select
              aria-label="查看历史建议"
              value={run?.id}
              onChange={(e) => {
                setRunId(e.target.value);
                setActive(0);
                setDetail("overview");
                setBriefOpen(false);
              }}
            >
              {data.runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.createdAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  ·{" "}
                  {
                    {
                      running: "生成中",
                      completed: "已完成",
                      failed: "未完成",
                    }[r.status]
                  }
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      {run?.status === "completed" && action ? (
        <div className="review-workspace">
          <aside className="review-index">
            <div className="review-index-label">
              <ListChecks size={14} />
              <span>行动目录</span>
              <small>{String(run.actions.length).padStart(2, "0")}</small>
            </div>
            <nav aria-label="行动建议目录">
              {run.actions.map((a, index) => (
                <button
                  key={index}
                  className={`review-index-item ${index === active ? "selected" : ""}`}
                  aria-current={index === active ? "true" : undefined}
                  aria-label={`查看行动 ${index + 1}：${a.title}`}
                  onClick={() => changeAction(index)}
                >
                  <span className="review-index-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="review-index-meta">
                      <span
                        className={
                          a.priority === "first" ? "priority-first" : ""
                        }
                      >
                        {a.priority === "first" ? "优先核实" : "随后核实"}
                      </span>
                      {run.applications[index] && (
                        <span className="review-adopted">
                          <Check size={11} />
                          已采用
                        </span>
                      )}
                    </span>
                    <strong>{a.title}</strong>
                    <small>
                      {issueCategories[a.category]}
                      <span>·</span>
                      {a.citations.length} 处依据
                    </small>
                  </div>
                  <ChevronRight size={14} />
                </button>
              ))}
            </nav>
            <div className="review-brief">
              <button
                aria-expanded={briefOpen}
                onClick={() => setBriefOpen(!briefOpen)}
              >
                <span>
                  <Sparkles size={13} />
                  本轮摘要
                </span>
                <ChevronDown size={14} />
              </button>
              <p className={briefOpen ? "" : "review-clamp"}>{run.summary}</p>
            </div>
            <div className="review-proof">
              <ShieldCheck size={17} />
              <div>
                <strong>{receipts} 次真实工具读取</strong>
                <span>
                  {run.versionIds.length} 个材料版本 · {run.model}
                </span>
              </div>
            </div>
          </aside>
          <section
            className="review-detail"
            aria-label={`行动 ${active + 1} 的详情`}
          >
            <header className="review-detail-head">
              <div className="review-detail-meta">
                <span className="review-kicker">
                  ACTION {String(active + 1).padStart(2, "0")} /{" "}
                  {String(run.actions.length).padStart(2, "0")}
                </span>
                <span
                  className={`review-pill ${action.priority === "first" ? "warm" : ""}`}
                >
                  {action.priority === "first" ? "优先核实" : "随后核实"}
                </span>
                <span>{issueCategories[action.category]}</span>
              </div>
              <h3>{action.title}</h3>
              <div className="review-party-chips">
                {action.partyIds.map((id) => (
                  <span key={id}>
                    {matter.parties.find((p) => p.id === id)?.name}
                  </span>
                ))}
              </div>
            </header>
            <div className="review-detail-tabs" aria-label="查看行动内容">
              {(
                [
                  ["overview", "核实要点", ListChecks],
                  [
                    "sources",
                    `原文依据 · ${action.citations.length}`,
                    FileSearch,
                  ],
                  ["draft", "补证草稿", FileText],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  aria-pressed={detail === id}
                  className={detail === id ? "active" : ""}
                  onClick={() => setDetail(id)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
            <div className="review-detail-content">
              {detail === "overview" && (
                <>
                  <section className="review-reason">
                    <span className="review-section-number">01</span>
                    <div>
                      <h4>为什么需要核实</h4>
                      <p>{action.reason}</p>
                    </div>
                  </section>
                  <section className="review-missing">
                    <div>
                      <Layers size={16} />
                      <h4>需要补齐什么</h4>
                      <span>待核实</span>
                    </div>
                    <p>
                      {run.adoptedDrafts?.[active]?.missing || action.missing}
                    </p>
                  </section>
                  {action.targetIssueId && (
                    <button
                      className="review-linked"
                      onClick={() => onTab("issues")}
                    >
                      <FileText size={15} />
                      <span>
                        <small>关联已有审查问题</small>
                        {
                          data.issues.find((i) => i.id === action.targetIssueId)
                            ?.title
                        }
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                  <div className="review-mini-sources">
                    <div>
                      <h4>依据入口</h4>
                      <button onClick={() => setDetail("sources")}>
                        查看全部引用 <ArrowRight size={13} />
                      </button>
                    </div>
                    {action.citations.map((c, n) => {
                      const m = data.materials.find(
                        (m) => m.id === c.versionId,
                      );
                      return (
                        <button
                          key={n}
                          disabled={busy === "source"}
                          onClick={() => void openSource(c)}
                        >
                          <span className="review-source-number">{n + 1}</span>
                          <span>
                            {m?.title}
                            <small>
                              v{m?.version} · 第 {c.page} 页
                            </small>
                          </span>
                          <FileSearch size={14} />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {detail === "sources" && (
                <div className="review-source-cards">
                  <p className="review-section-note">
                    每处引用保留实际读取的版本与页码，可打开 PDF 核对上下文。
                  </p>
                  {action.citations.map((c, n) => {
                    const m = data.materials.find((m) => m.id === c.versionId);
                    return (
                      <article className="review-source-card" key={n}>
                        <header>
                          <span className="review-source-number">
                            {String(n + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <strong>{m?.title}</strong>
                            <small>
                              v{m?.version} · 第 {c.page} 页 ·{" "}
                              {m?.latest ? "最新版本" : "历史版本"}
                            </small>
                          </div>
                          <span
                            className="review-quote-mark"
                            aria-hidden="true"
                          >
                            “
                          </span>
                        </header>
                        <blockquote>{c.quote}</blockquote>
                        <button
                          disabled={busy === "source"}
                          onClick={() => void openSource(c)}
                        >
                          <FileSearch size={14} />
                          打开原文核对 <ArrowRight size={14} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
              {detail === "draft" && (
                <AssistantDraft
                  key={`${run.id}:${active}`}
                  action={{ ...action, ...run.adoptedDrafts?.[active] }}
                  draftKey={`${matter.id}:${run.id}:${active}`}
                  adopted={Boolean(run.applications[active])}
                  disabled={Boolean(stale || busy || running)}
                  onError={onError}
                  onApply={async (draft) => {
                    await work("apply", async () => {
                      const out = await post<{ snapshot: AssistantSnapshot }>(
                        `${base}/runs/${run.id}/apply`,
                        {
                          index: active,
                          expectedRevision: data.caseRevision,
                          ...draft,
                        },
                      );
                      setData(out.snapshot);
                      setNotice(
                        "草稿与依据已带入审查问题，原记录保留，仍待复核。",
                      );
                      onUpdate(await api<CaseView>(`/cases/${matter.id}`));
                    });
                  }}
                />
              )}
            </div>
            {detail !== "draft" && (
              <footer className="review-detail-footer">
                <span>
                  <ShieldCheck size={14} />
                  AI 建议 · 待律师复核
                </span>
                <button
                  className="btn primary"
                  onClick={() => setDetail("draft")}
                >
                  {run.applications[active] ? "查看已采用草稿" : "编辑补证草稿"}
                  <ArrowRight size={14} />
                </button>
              </footer>
            )}
          </section>
        </div>
      ) : (
        <section className="review-welcome">
          <div className="review-welcome-symbol">
            <Layers size={38} strokeWidth={1} />
          </div>
          <span className="review-kicker">EVIDENCE TO ACTION</span>
          <h3>
            {run?.status === "running"
              ? "正在从材料中整理核实行动"
              : run?.status === "failed"
                ? "本轮分析尚未完成"
                : "让下一步工作，有据可循。"}
          </h3>
          {run?.status === "running" ? (
            <>
              <LoaderCircle className="spin" size={21} />
              <p role="status">
                模型第 {run.rounds || 1} 轮 · 已取得 {receipts} 次读取凭证
              </p>
              <p className="review-section-note">
                可以离开此页，结果会保存在本案。
              </p>
            </>
          ) : run?.status === "failed" ? (
            <>
              <p role="alert">{run.error}</p>
              <p className="review-section-note">
                {run.traces.length} 条调用记录已保留，可在下方检查。
              </p>
              <button
                className="btn primary"
                onClick={() => setSetupOpen(true)}
              >
                检查范围并重新分析 <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <p>结合本案背景与授权材料，准备核实顺序、原文依据和补证草稿。</p>
              <div className="review-welcome-steps">
                <span>
                  <b>01</b>选择材料
                </span>
                <ChevronRight size={13} />
                <span>
                  <b>02</b>读取与分析
                </span>
                <ChevronRight size={13} />
                <span>
                  <b>03</b>复核并采用
                </span>
              </div>
              <button
                className="btn primary"
                onClick={() => setSetupOpen(true)}
              >
                开始一次材料分析 <Plus size={15} />
              </button>
            </>
          )}
        </section>
      )}
      <div className="review-bottom-bar">
        <span>建议顺序不代表法律风险评级；采用后仍需律师复核。</span>
        {run && run.traces.length > 0 && (
          <details className="review-receipts">
            <summary>
              工具读取凭证 <span>{run.traces.length}</span>
              <ChevronDown size={13} />
            </summary>
            <div>
              {run.traces.map((t, i) => (
                <button key={t.id} onClick={() => onTrace(t)}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {
                      data.materials.find((m) => m.id === t.args.versionId)
                        ?.title
                    }
                    <small>
                      第 {String(t.args.page)} 页 ·{" "}
                      {t.status === "success" ? "读取成功" : "读取失败"}
                    </small>
                  </span>
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          </details>
        )}
      </div>
      {setupOpen && (
        <ReviewDrawer
          title="新建材料分析"
          subtitle="选择本轮目标和材料，确认后开始读取。"
          onClose={() => setSetupOpen(false)}
        >
          {error && (
            <div className="assistant-alert" role="alert">
              {error}
            </div>
          )}
          <section className="assistant-setup">
            <div className="assistant-section-head">
              <h3>
                <Sparkles size={16} /> 新的审查任务
              </h3>
              <span className="assistant-model">
                {data.model.configured ? "模型已配置" : "模型未配置"}
              </span>
            </div>
            <div className="assistant-presets">
              {presets.map((p) => (
                <button
                  className={question === p.text ? "selected" : ""}
                  key={p.label}
                  disabled={Boolean(running)}
                  onClick={() => setQuestion(p.text)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="assistant-field">
              希望助理帮你做什么
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={1200}
                rows={4}
                disabled={Boolean(running)}
              />
            </label>
            <div className="assistant-material-label">
              <h4>本轮材料</h4>
              <span>
                {ids.length} / 4 份 · {pages} / 12 页
              </span>
            </div>
            {!data.materials.length && (
              <p>
                还没有材料。
                <button
                  className="assistant-text-link"
                  onClick={() => onTab("materials")}
                >
                  前往导入 PDF <ArrowRight size={12} />
                </button>
              </p>
            )}
            <div className="assistant-materials">
              {data.materials.map((m) => (
                <div className="assistant-material" key={m.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={ids.includes(m.id)}
                      disabled={
                        !m.modelAllowed ||
                        Boolean(running) ||
                        (!ids.includes(m.id) && ids.length >= 4)
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...ids, m.id]
                            : ids.filter((id) => id !== m.id),
                        )
                      }
                    />
                    <span>
                      <strong>{m.title}</strong>
                      <small>
                        v{m.version} · {m.pageCount} 页 ·{" "}
                        {m.latest ? "最新版本" : "历史版本"} ·{" "}
                        {m.modelAllowed ? "已授权 AI" : "未授权 AI"}
                      </small>
                    </span>
                  </label>
                  {!m.modelAllowed && (
                    <button
                      className="assistant-text-link"
                      disabled={Boolean(busy || running)}
                      onClick={() =>
                        void work("permit", async () => {
                          await post(
                            `/cases/${matter.id}/materials/${m.id}/permission`,
                            { allowed: true },
                          );
                          await load();
                        })
                      }
                    >
                      授权 AI 读取此版本 <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="assistant-disclosure">
              模型将收到本案背景、主体、未决问题、已处理问题标题及勾选材料的原文。权限沿用材料库；本轮不会发送补证请求。
            </p>
            {!data.ready && (
              <div className="assistant-connection">
                <span>材料工具未就绪</span>
                <button
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void work("connect", async () => {
                      await post("/connectors/documents/connect");
                      const next = await load();
                      await onConnectionChange();
                      if (!next.ready)
                        throw new Error(
                          "材料连接已建立，请到工具台启用 read_material_page 后重试",
                        );
                    })
                  }
                >
                  连接材料工具
                </button>
              </div>
            )}
            <button
              className="btn primary assistant-generate"
              disabled={
                Boolean(busy || running) ||
                !ids.length ||
                pages > 12 ||
                !data.ready ||
                !data.model.configured ||
                question.trim().length < 2 ||
                ids.some(
                  (id) =>
                    !data.materials.some((m) => m.id === id && m.modelAllowed),
                )
              }
              onClick={() => void start()}
            >
              {running || busy === "start" ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Play size={14} />
              )}
              {running
                ? "正在分析授权材料…"
                : run
                  ? "生成新一轮建议"
                  : "生成行动建议"}
            </button>
          </section>
        </ReviewDrawer>
      )}
      {source && (
        <ReviewDrawer
          title="原文核对"
          subtitle={`${source.data.material.title} · v${source.data.material.version} · 第 ${source.data.page} 页`}
          onClose={() => setSource(undefined)}
          returnFocus={sourceTrigger.current}
          wide
        >
          <div className="review-source-toolbar">
            <span>
              <FileText size={14} />
              不可覆盖的材料版本
            </span>
            <a
              href={`/api/cases/${matter.id}/materials/${source.data.material.id}/pdf#page=${source.data.page}`}
              target="_blank"
              rel="noreferrer"
            >
              打开完整 PDF <ArrowRight size={13} />
            </a>
          </div>
          <blockquote className="review-selected-quote">
            <span>本次引用</span>
            {quote}
          </blockquote>
          <Suspense fallback={<p role="status">正在载入原文页面…</p>}>
            <PdfPage
              url={`/api/cases/${matter.id}/materials/${source.data.material.id}/pdf`}
              page={source.data.page}
            />
          </Suspense>
          <div className="review-source-tools">
            <button
              onClick={() => {
                const trace = source.trace;
                setSource(undefined);
                onTrace(trace);
              }}
            >
              查看本次读取凭证 <ArrowRight size={13} />
            </button>
            <details>
              <summary>查看提取文字</summary>
              <pre>{source.data.text}</pre>
            </details>
          </div>
        </ReviewDrawer>
      )}
    </div>
  );
}
