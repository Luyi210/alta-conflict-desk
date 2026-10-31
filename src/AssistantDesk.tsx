import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  FileSearch,
  Layers,
  LoaderCircle,
  Play,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import type {
  AssistantAction,
  AssistantRun,
  AssistantSnapshot,
} from "../shared/assistant";
import type { CaseView, Trace } from "../shared/types";
import { issueCategories, issueStates } from "../shared/issues";
import type { MaterialCitation, MaterialPage } from "../shared/materials";
import type { CaseTab } from "./navigation";
import { api, post } from "./api";
import { useReviewDraft } from "./useReviewDraft";
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
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState<{ data: MaterialPage; trace: Trace }>();
  const sourcePanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (source) sourcePanel.current?.focus();
  }, [source]);
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
      setSource(undefined);
      await load();
    });
  }
  async function openSource(c: MaterialCitation) {
    await work("source", async () => {
      setSource(
        await api(
          `/cases/${matter.id}/materials/${c.versionId}/pages/${c.page}`,
        ),
      );
    });
  }
  return (
    <div className="assistant-desk">
      <section className="assistant-hero">
        <div>
          <span className="eyebrow small">
            <Sparkles size={14} /> MATTER INTELLIGENCE
          </span>
          <h2>把材料，变成下一步行动。</h2>
          <p>基于本案原文提出核实建议，准备补证草稿，交由你判断和采用。</p>
        </div>
        <div className="assistant-totals">
          <button onClick={() => onTab("issues")}>
            <strong>{pending.length.toString().padStart(2, "0")}</strong>
            <span>
              未决审查问题 <ArrowRight size={12} />
            </span>
          </button>
          <button onClick={() => onTab("issues")}>
            <strong>{changed.length.toString().padStart(2, "0")}</strong>
            <span>
              材料变化待复核 <ArrowRight size={12} />
            </span>
          </button>
        </div>
      </section>
      {error && (
        <div className="assistant-alert" role="alert">
          {error}
          <button onClick={() => void load().catch((e) => setError(e.message))}>
            <RefreshCw size={14} /> 刷新状态
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
      <div className="assistant-layout">
        <section className="assistant-results" aria-label="行动建议结果">
          <div className="assistant-section-head">
            <h3>
              本轮行动建议 <span>AI 草稿</span>
            </h3>
            {data.runs.length > 0 && (
              <select
                aria-label="查看历史建议"
                value={run?.id}
                onChange={(e) => {
                  setRunId(e.target.value);
                  setActive(0);
                  setSource(undefined);
                }}
              >
                {data.runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.createdAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
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
          {!run && (
            <div className="assistant-empty">
              <div className="assistant-empty-icon">
                <Layers size={30} />
              </div>
              <h3>先明确问题，再准备行动</h3>
              <p>
                选定材料后，AI
                会逐页读取原文，把待核实的问题、补证清单和请求草稿放在一起。
              </p>
              <ol>
                <li>
                  <b>01</b>
                  <div>
                    <strong>关联已有案件信息</strong>
                    <span>复用主体、委托背景与未决问题。</span>
                  </div>
                </li>
                <li>
                  <b>02</b>
                  <div>
                    <strong>读取授权材料</strong>
                    <span>每个引用保留版本、页码和调用凭证。</span>
                  </div>
                </li>
                <li>
                  <b>03</b>
                  <div>
                    <strong>形成可编辑草稿</strong>
                    <span>采用后继续在审查问题中处理。</span>
                  </div>
                </li>
              </ol>
            </div>
          )}
          {run?.status === "running" && (
            <div className="assistant-progress" role="status">
              <LoaderCircle className="spin" size={26} />
              <h3>
                {run.traces.length
                  ? "正在结合原文整理核实行动"
                  : "正在请求模型读取授权材料"}
              </h3>
              <p>
                已取得 {run.traces.filter((t) => t.status === "success").length}{" "}
                次读取凭证 · 模型第 {run.rounds || 1} 轮
              </p>
              <div className="assistant-progress-line" />
              <small>可以切换页面；完成后结果会保存在本案。</small>
            </div>
          )}
          {run?.status === "failed" && (
            <div className="assistant-alert assistant-failed" role="alert">
              <h3>这轮建议未能完成</h3>
              <p>{run.error}</p>
              <span>
                已保留 {run.traces.length} 条调用记录。检查后可从右侧重新生成。
              </span>
            </div>
          )}
          {run?.status === "completed" && (
            <>
              {stale && (
                <div className="assistant-alert">
                  案件资料已变化。这轮建议保留供回看，重新生成后才能采用。
                </div>
              )}
              <div className="assistant-summary">
                <span className="eyebrow small">
                  REVIEW BRIEF · 修订 {run.caseRevision}
                </span>
                <p className={briefOpen ? "" : "assistant-brief-collapsed"}>
                  {run.summary}
                </p>
                <button
                  className="assistant-text-link"
                  aria-expanded={briefOpen}
                  onClick={() => setBriefOpen(!briefOpen)}
                >
                  {briefOpen ? "收起摘要" : "展开完整摘要"}
                  <ChevronDown size={12} />
                </button>
                <div>
                  <span>
                    <Check size={12} />{" "}
                    {run.traces.filter((t) => t.status === "success").length}{" "}
                    次真实读取
                  </span>
                  <span>{run.versionIds.length} 个材料版本</span>
                  <span>{run.model}</span>
                </div>
              </div>
              <div className="assistant-actions">
                {run.actions.map((a, index) => (
                  <article
                    key={`${run.id}:${index}`}
                    className={`assistant-action ${active === index ? "is-active" : ""}`}
                  >
                    <button
                      className="assistant-action-heading"
                      aria-expanded={active === index}
                      onClick={() => setActive(active === index ? -1 : index)}
                    >
                      <span className="assistant-number">0{index + 1}</span>
                      <div>
                        <div className="assistant-action-meta">
                          <span
                            className={
                              a.priority === "first" ? "priority-first" : ""
                            }
                          >
                            {a.priority === "first" ? "优先核实" : "随后核实"}
                          </span>
                          <span>{issueCategories[a.category]}</span>
                          {run.applications[index] && (
                            <span className="assistant-adopted">
                              <Check size={11} />
                              已采用
                            </span>
                          )}
                        </div>
                        <h4>{a.title}</h4>
                      </div>
                      <ChevronDown size={16} />
                    </button>
                    {active === index && (
                      <div className="assistant-action-body">
                        <p className="assistant-reason">{a.reason}</p>
                        <div className="assistant-parties">
                          {a.partyIds.map((id) => (
                            <span key={id}>
                              {matter.parties.find((p) => p.id === id)?.name}
                            </span>
                          ))}
                        </div>
                        {a.targetIssueId && (
                          <p className="assistant-target">
                            关联已有问题：
                            {
                              data.issues.find((i) => i.id === a.targetIssueId)
                                ?.title
                            }
                          </p>
                        )}
                        <div className="assistant-source-list">
                          <h5>
                            原文依据 <span>{a.citations.length} 处</span>
                          </h5>
                          {a.citations.map((c, n) => {
                            const m = data.materials.find(
                              (m) => m.id === c.versionId,
                            );
                            return (
                              <div className="assistant-citation" key={n}>
                                <div>
                                  <span>
                                    {m?.title} · v{m?.version} · 第 {c.page} 页
                                  </span>
                                  <button
                                    disabled={busy === "source"}
                                    onClick={() => void openSource(c)}
                                  >
                                    <FileSearch size={13} /> 查看原文
                                  </button>
                                </div>
                                <blockquote>{c.quote}</blockquote>
                              </div>
                            );
                          })}
                        </div>
                        <ActionDraft
                          key={`${run.id}:${index}`}
                          action={{ ...a, ...run.adoptedDrafts?.[index] }}
                          draftKey={`${matter.id}:${run.id}:${index}`}
                          adopted={Boolean(run.applications[index])}
                          disabled={Boolean(stale || busy || running)}
                          onApply={async (draft) => {
                            await work("apply", async () => {
                              const out = await post<{
                                snapshot: AssistantSnapshot;
                              }>(`${base}/runs/${run.id}/apply`, {
                                index,
                                expectedRevision: data.caseRevision,
                                ...draft,
                              });
                              setData(out.snapshot);
                              setNotice(
                                "补证草稿与原文依据已带入审查问题，状态为复核中。原有文字和处理记录保留。",
                              );
                              onUpdate(
                                await api<CaseView>(`/cases/${matter.id}`),
                              );
                            });
                          }}
                          onError={onError}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
          {run && run.traces.length > 0 && (
            <details className="assistant-traces">
              <summary>查看工具调用记录 · {run.traces.length} 次</summary>
              {run.traces.map((t, i) => (
                <button key={t.id} onClick={() => onTrace(t)}>
                  <span>
                    {String(i + 1).padStart(2, "0")} · 读取第{" "}
                    {String(t.args.page)} 页
                  </span>
                  <span>
                    {
                      data.materials.find((m) => m.id === t.args.versionId)
                        ?.title
                    }{" "}
                    · {t.status === "success" ? "成功" : "失败"}
                  </span>
                  <ArrowRight size={13} />
                </button>
              ))}
            </details>
          )}
          <p className="assistant-footnote">
            优先级仅表示建议的工作顺序。采用前可逐处核对原文，建议是否成立及补证内容仍需律师判断。
          </p>
        </section>
        <aside className="assistant-aside">
          {source && (
            <section
              className="assistant-source-preview"
              ref={sourcePanel}
              tabIndex={-1}
              aria-label="原文预览"
            >
              <div className="assistant-section-head">
                <h3>原文核对 · 第 {source.data.page} 页</h3>
                <button
                  aria-label="关闭原文预览"
                  onClick={() => setSource(undefined)}
                >
                  <X size={16} />
                </button>
              </div>
              <p>
                {source.data.material.title} · v{source.data.material.version}
              </p>
              <Suspense fallback={<p>正在载入原文…</p>}>
                <PdfPage
                  url={`/api/cases/${matter.id}/materials/${source.data.material.id}/pdf`}
                  page={source.data.page}
                />
              </Suspense>
              <details>
                <summary>查看提取文字</summary>
                <pre>{source.data.text}</pre>
              </details>
              <button
                className="assistant-text-link"
                onClick={() => onTrace(source.trace)}
              >
                查看本次原文读取凭证 <ArrowRight size={13} />
              </button>
              <a
                className="assistant-text-link"
                href={`/api/cases/${matter.id}/materials/${source.data.material.id}/pdf#page=${source.data.page}`}
                target="_blank"
                rel="noreferrer"
              >
                打开完整 PDF <ArrowRight size={13} />
              </a>
            </section>
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
          <section className="assistant-context">
            <div className="assistant-section-head">
              <h3>已有审查问题</h3>
              <button onClick={() => onTab("issues")} aria-label="打开审查问题">
                <ArrowRight size={16} />
              </button>
            </div>
            {data.issues.length ? (
              data.issues.map((i) => (
                <button
                  key={i.id}
                  className="assistant-context-row"
                  onClick={() => onTab("issues")}
                >
                  <span
                    className={`assistant-dot ${i.effectiveStatus === "resolved" ? "done" : ""}`}
                  />
                  <div>
                    <strong>{i.title}</strong>
                    <small>
                      {issueStates[i.effectiveStatus]} · {i.citations.length}{" "}
                      处依据{i.owner ? ` · ${i.owner}` : " · 未分配责任人"}
                    </small>
                  </div>
                </button>
              ))
            ) : (
              <p>暂无审查问题，采用建议后会建立带依据的复核草稿。</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ActionDraft({
  action,
  draftKey,
  adopted,
  disabled,
  onApply,
  onError,
}: {
  action: AssistantAction;
  draftKey: string;
  adopted: boolean;
  disabled: boolean;
  onApply: (d: { missing: string; request: string }) => Promise<void>;
  onError: (s: string) => void;
}) {
  const draft = useReviewDraft(`assistant:${draftKey}`, {
    missing: action.missing,
    request: action.request,
  });
  const [copied, setCopied] = useState(false);
  return (
    <div className="assistant-draft">
      <div className="assistant-section-head">
        <h5>补证工作草稿</h5>
        <span>可编辑 · 未发送</span>
      </div>
      <label className="assistant-field">
        待补材料与信息
        <textarea
          rows={3}
          value={adopted ? action.missing : draft.value.missing}
          maxLength={1500}
          disabled={adopted || disabled}
          onChange={(e) =>
            draft.setValue({ ...draft.value, missing: e.target.value })
          }
        />
      </label>
      <label className="assistant-field">
        补证请求正文
        <textarea
          rows={6}
          value={adopted ? action.request : draft.value.request}
          maxLength={1800}
          disabled={adopted || disabled}
          onChange={(e) => {
            setCopied(false);
            draft.setValue({ ...draft.value, request: e.target.value });
          }}
        />
      </label>
      <div className="assistant-draft-actions">
        <button
          className="btn secondary"
          onClick={() =>
            void navigator.clipboard
              .writeText(adopted ? action.request : draft.value.request)
              .then(() => setCopied(true))
              .catch(() => onError("复制失败，请选中正文手动复制。"))
          }
        >
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
          {copied ? "已复制正文" : "复制正文"}
        </button>
        <button
          className="btn primary"
          disabled={
            disabled ||
            adopted ||
            draft.value.missing.trim().length < 2 ||
            draft.value.request.trim().length < 2
          }
          onClick={() => void onApply(draft.value)}
        >
          {adopted ? <Check size={14} /> : <ArrowRight size={14} />}
          {adopted
            ? "已带入审查问题"
            : action.targetIssueId
              ? "补充到已有问题"
              : "采用为审查问题"}
        </button>
      </div>
      <p>
        {action.targetIssueId
          ? "采用后追加到已有问题，保留原文字和意见历史。"
          : "采用后建立复核中的问题，并附上上述原文依据。"}
        不会自动解决问题或确认收案。
      </p>
      {draft.dirty && !adopted && (
        <small className="draft-status">
          {draft.storageAvailable
            ? "草稿已在当前标签页暂存"
            : "当前浏览器无法暂存，请采用或复制后离开"}
        </small>
      )}
    </div>
  );
}
