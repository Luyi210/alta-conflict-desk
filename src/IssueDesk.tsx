import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  FileSearch,
  GitCompareArrows,
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";
import type { CaseView, Trace } from "../shared/types";
import type {
  IssueSnapshot,
  IssueView,
  MaterialComparison,
} from "../shared/issues";
import {
  citationRelations,
  issueCategories,
  issueStates,
} from "../shared/issues";
import type { MaterialPage, MaterialReview } from "../shared/materials";
import { api, post } from "./api";
import { useReviewDraft } from "./useReviewDraft";
import "./issues.css";
const PdfPage = lazy(() => import("./PdfPage"));
type Props = {
  matter: CaseView;
  onUpdate: (v: CaseView) => void;
  onError: (s: string) => void;
  onTrace: (t: Trace) => void;
};
export default function IssueDesk({
  matter,
  onUpdate,
  onError,
  onTrace,
}: Props) {
  const base = `/cases/${matter.id}/issues`;
  const [data, setData] = useState<IssueSnapshot>();
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<"issues" | "changes">("issues");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<{ data: MaterialPage; trace: Trace }>();
  const [comparison, setComparison] = useState<MaterialComparison>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState("");
  const sourcePanel = useRef<HTMLDivElement>(null);
  async function refresh() {
    const d = await api<IssueSnapshot>(base);
    setData(d);
    setLoadError("");
    return d;
  }
  useEffect(() => {
    void refresh().catch((e) => setLoadError(e.message));
  }, [matter.id]);
  useEffect(() => {
    if (!source) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sourcePanel.current?.focus();
    return () => {
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [source]);
  const running = data?.reviews.some((r) => r.status === "running");
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => void refresh().catch((e) => onError(e.message)),
      1500,
    );
    return () => clearInterval(timer);
  }, [running, base]);
  async function action(name: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(name);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      onError((e as Error).message);
      await refresh().catch(() => {});
      await api<CaseView>(`/cases/${matter.id}`)
        .then(onUpdate)
        .catch(() => {});
    } finally {
      setBusy("");
    }
  }
  async function mutate(path: string, body: object) {
    const d = await post<IssueSnapshot>(`${base}${path}`, {
      ...body,
      expectedRevision: data!.caseRevision,
    });
    setData(d);
    onUpdate(await api<CaseView>(`/cases/${matter.id}`));
    return d;
  }
  async function create(body: object) {
    await action("create", async () => {
      const before = new Set(data?.issues.map((i) => i.id));
      const d = await mutate("", body);
      setSelected(
        d.issues.find((i) => !before.has(i.id))?.id || d.issues[0]?.id || "",
      );
      setTitle("");
      setMode("issues");
      setNotice("问题已加入工作台，请核对依据并指定处理人。");
    });
  }
  async function read(id: string, page: number) {
    await action("read", async () => {
      setSource(await api(`/cases/${matter.id}/materials/${id}/pages/${page}`));
    });
  }
  async function compare(a = from, b = to) {
    if (busy) return;
    setMode("changes");
    setFrom(a);
    setTo(b);
    await action("compare", async () => {
      setComparison(
        await api(
          `${base}/comparison?${new URLSearchParams({ from: a, to: b })}`,
        ),
      );
      setPage(1);
    });
  }
  const visible =
    data?.issues.filter(
      (i) => filter === "all" || i.effectiveStatus === filter,
    ) || [];
  const current = visible.find((i) => i.id === selected) || visible[0];
  const oldVersions = data?.materials.filter((m) => !m.latest) || [];
  const newVersions =
    data?.materials.filter(
      (m) =>
        m.documentId ===
          data.materials.find((v) => v.id === from)?.documentId &&
        m.version > (data.materials.find((v) => v.id === from)?.version || 0),
    ) || [];
  const suggestions =
    data?.reviews.filter((r) => r.status === "completed") || [];
  if (!data)
    return (
      <div className="issue-loading">
        {loadError ? (
          <div role="alert">
            <p>{loadError}</p>
            <button
              className="btn secondary"
              onClick={() => {
                setLoadError("");
                void refresh().catch((e) => setLoadError(e.message));
              }}
            >
              重试读取
            </button>
          </div>
        ) : (
          <>
            <LoaderCircle className="spin" /> 正在读取审查工作台…
          </>
        )}
      </div>
    );
  return (
    <div className="issue-desk">
      <div className="issue-heading">
        <div>
          <span className="eyebrow small">问题处理</span>
          <h2>审查问题与处理意见</h2>
          <p>登记依据、责任人和待补事项；材料变化后复核影响。</p>
        </div>
      </div>
      <div className="issue-stats">
        <div>
          <strong>{data.issues.length}</strong>
          <span>全部问题</span>
        </div>
        <div>
          <strong>
            {data.issues.filter((i) => i.effectiveStatus === "stale").length}
          </strong>
          <span>材料变化待复核</span>
        </div>
        <div>
          <strong>
            {data.issues.filter((i) => i.effectiveStatus === "resolved").length}
          </strong>
          <span>已记录处理意见</span>
        </div>
        <p>
          未决问题与旧版依据会保留在案件中。
          <br />
          材料变化后需重新复核相关问题。
        </p>
      </div>
      <div className="issue-mode">
        <button
          className={mode === "issues" ? "active" : ""}
          onClick={() => setMode("issues")}
        >
          <FileSearch size={16} />
          审查问题
        </button>
        <button
          className={mode === "changes" ? "active" : ""}
          onClick={() => setMode("changes")}
        >
          <GitCompareArrows size={16} />
          材料变更
        </button>
      </div>
      {notice && (
        <p role="status" className="material-notice">
          <Check size={16} />
          {notice}
        </p>
      )}
      {mode === "issues" ? (
        <>
          <details className="issue-intake" open={!data.issues.length}>
            <summary>
              <Plus size={15} />
              建立问题或收集 AI 建议
            </summary>
            <div className="issue-create">
              <label>
                新问题
                <input
                  aria-label="新审查问题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={1000}
                  placeholder="例如：融资文件服务是否已纳入签署的委托范围？"
                />
              </label>
              <button
                className="btn primary"
                disabled={!!busy || title.trim().length < 2}
                onClick={() => void create({ title, category: "scope" })}
              >
                建立问题
              </button>
            </div>
            <div className="issue-imports">
              <div>
                <h3>从现有补证开始</h3>
                {matter.tasks
                  .filter((t) => !t.systemManaged)
                  .map((t) => (
                    <button
                      key={t.id}
                      disabled={
                        !!busy ||
                        data.issues.some((i) => i.sourceKey === `task:${t.id}`)
                      }
                      onClick={() => void create({ taskId: t.id })}
                    >
                      {t.title}
                      <span>
                        {data.issues.some((i) => i.sourceKey === `task:${t.id}`)
                          ? "已加入"
                          : "+ 加入"}
                      </span>
                    </button>
                  ))}
              </div>
              <div>
                <h3>AI 材料问题 · 待人工选择</h3>
                {!suggestions.length && (
                  <p>完成一次材料 AI 复核后，可在这里选择值得跟进的问题。</p>
                )}
                {suggestions.map((r) => (
                  <details key={r.id}>
                    <summary>
                      {new Date(r.createdAt).toLocaleString("zh-CN")} ·{" "}
                      {r.items.length} 个建议
                    </summary>
                    {r.items.map((item, n) => (
                      <button
                        key={n}
                        disabled={
                          !!busy ||
                          data.issues.some(
                            (i) => i.sourceKey === `ai:${r.id}:${n}`,
                          )
                        }
                        onClick={() =>
                          void create({ reviewId: r.id, itemIndex: n })
                        }
                      >
                        {item.question}
                        <span>
                          {data.issues.some(
                            (i) => i.sourceKey === `ai:${r.id}:${n}`,
                          )
                            ? "已加入"
                            : "+ 加入"}
                        </span>
                      </button>
                    ))}
                  </details>
                ))}
              </div>
            </div>
          </details>
          <div className="issue-layout">
            <aside className="issue-list">
              <div className="issue-list-head">
                <h3>问题清单</h3>
                <select
                  aria-label="筛选审查问题"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">全部状态</option>
                  {Object.entries(issueStates).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {visible.map((i, n) => (
                <button
                  className={`issue-list-item ${current?.id === i.id ? "selected" : ""}`}
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                >
                  <span>
                    {String(n + 1).padStart(2, "0")} ·{" "}
                    {issueCategories[i.category]}
                  </span>
                  <strong>{i.title}</strong>
                  <small
                    className={
                      i.effectiveStatus === "stale" ? "issue-alert" : ""
                    }
                  >
                    {issueStates[i.effectiveStatus]} ·{" "}
                    {i.owner || "未指定责任人"}
                  </small>
                  <small>
                    {i.citations.length} 条依据 · {i.reviews.length} 次意见记录
                  </small>
                </button>
              ))}
              {!visible.length && (
                <p className="issue-empty">暂无符合条件的问题</p>
              )}
            </aside>
            {current ? (
              <IssueEditor
                key={current.id}
                issue={current}
                data={data}
                matter={matter}
                busy={!!busy}
                onRead={read}
                onCompare={compare}
                onAction={action}
                onSave={async (body) => {
                  await mutate(`/${current.id}`, body);
                  setNotice("处理记录已保存。补证及总意见仍需分别核实。");
                }}
                onCitation={async (body) => {
                  await mutate(`/${current.id}/citations`, body);
                  setNotice("原文依据已关联，原有意见保留。");
                }}
              />
            ) : (
              <div className="issue-empty panel">
                <FileSearch size={32} />
                <h3>从一个需要核实的问题开始</h3>
                <p>上方可从现有补证或 AI 建议建立问题。</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <section className="issue-changes">
          <div className="comparison-heading">
            <div>
              <h3>材料变更影响</h3>
              <p>
                先核对文字变化，再判断对既有意见的影响。按页对照，页面重排时需人工核实对应位置。
              </p>
            </div>
          </div>
          <div className="comparison-select">
            <label>
              旧版本
              <select
                aria-label="比较旧版本"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setTo("");
                  setComparison(undefined);
                }}
              >
                <option value="">选择旧版本</option>
                {oldVersions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} · v{m.version}
                  </option>
                ))}
              </select>
            </label>
            <ArrowRight size={18} />
            <label>
              新版本
              <select
                aria-label="比较新版本"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setComparison(undefined);
                }}
              >
                <option value="">选择新版本</option>
                {newVersions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} · v{m.version}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn primary"
              disabled={!!busy || !from || !to}
              onClick={() => void compare()}
            >
              {busy === "compare" ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <GitCompareArrows size={15} />
              )}
              读取并比较
            </button>
          </div>
          {!oldVersions.length && (
            <p className="issue-empty">同一材料上传新版本后，可在这里对照。</p>
          )}
          {comparison && (
            <>
              <div className="comparison-summary">
                <strong>{comparison.changedPages} 页提取文字有变化</strong>
                <span>
                  关联 {comparison.affectedIssueIds.length} 个问题 ·{" "}
                  {comparison.traces.length} 次实际 MCP 读取
                </span>
              </div>
              <div className="comparison-affected">
                {comparison.affectedIssueIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setSelected(id);
                      setMode("issues");
                    }}
                  >
                    {data.issues.find((i) => i.id === id)?.title}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
              <div className="comparison-page-nav">
                {comparison.pages.map((p) => (
                  <button
                    key={p.page}
                    className={page === p.page ? "active" : ""}
                    onClick={() => setPage(p.page)}
                  >
                    第 {p.page} 页 {p.changed ? "· 有变化" : ""}
                  </button>
                ))}
              </div>
              {comparison.pages
                .filter((p) => p.page === page)
                .map((p) => (
                  <div key={p.page}>
                    <div className="comparison-columns">
                      <article>
                        <h4>
                          旧版 v{comparison.from.version}
                          <button
                            onClick={() =>
                              void read(comparison.from.id, p.page)
                            }
                            disabled={
                              !!busy || p.page > comparison.from.pageCount
                            }
                          >
                            查看原文页
                          </button>
                        </h4>
                        <pre>
                          {!p.before
                            ? "本版无此页或无提取文字"
                            : p.changes
                                .filter((c) => !c.added)
                                .map((c, n) => (
                                  <span
                                    key={n}
                                    className={c.removed ? "diff-removed" : ""}
                                  >
                                    {c.value}
                                  </span>
                                ))}
                        </pre>
                      </article>
                      <article>
                        <h4>
                          新版 v{comparison.to.version}
                          <button
                            onClick={() => void read(comparison.to.id, p.page)}
                            disabled={
                              !!busy || p.page > comparison.to.pageCount
                            }
                          >
                            查看原文页
                          </button>
                        </h4>
                        <pre>
                          {!p.after
                            ? "本版无此页或无提取文字"
                            : p.changes
                                .filter((c) => !c.removed)
                                .map((c, n) => (
                                  <span
                                    key={n}
                                    className={c.added ? "diff-added" : ""}
                                  >
                                    {c.value}
                                  </span>
                                ))}
                        </pre>
                      </article>
                    </div>
                    {p.truncatedDiff && (
                      <p>文本差异过大，展示完整页面供人工对照。</p>
                    )}
                  </div>
                ))}
              <details className="comparison-ai">
                <summary>让 AI 提出变更影响的核实问题</summary>
                <p>
                  运行前需要分别授权这两个版本；本案背景、关联问题及两版原文将发送至配置的模型。AI
                  不修改律师意见。
                </p>
                <div className="comparison-grants">
                  {[comparison.from, comparison.to].map((m) => (
                    <label key={m.id}>
                      <input
                        type="checkbox"
                        checked={
                          !!data.materials.find((v) => v.id === m.id)
                            ?.modelAllowed
                        }
                        disabled={!!busy}
                        onChange={(e) =>
                          void action("permission", async () => {
                            await post(
                              `/cases/${matter.id}/materials/${m.id}/permission`,
                              { allowed: e.target.checked },
                            );
                            await refresh();
                          })
                        }
                      />
                      允许 AI 读取 v{m.version} · {m.title}
                    </label>
                  ))}
                </div>
                <button
                  className="btn primary"
                  disabled={
                    !!busy ||
                    running ||
                    ![comparison.from, comparison.to].every(
                      (m) =>
                        data.materials.find((v) => v.id === m.id)?.modelAllowed,
                    )
                  }
                  onClick={() =>
                    void action("ai", async () => {
                      await post(`${base}/compare-review`, {
                        from: comparison.from.id,
                        to: comparison.to.id,
                      });
                      await refresh();
                      setNotice("AI 已开始读取两版材料，可在下方查看进度。");
                    })
                  }
                >
                  {running ? "AI 正在读取两版原文…" : "分析已授权版本的影响"}
                </button>
                {data.reviews
                  .filter(
                    (r) =>
                      r.versionIds.includes(comparison.from.id) &&
                      r.versionIds.includes(comparison.to.id),
                  )
                  .map((r) => (
                    <details
                      key={r.id}
                      className="issue-ai-history"
                      open={r.status !== "failed"}
                    >
                      <summary>
                        {new Date(r.createdAt).toLocaleString("zh-CN")} ·{" "}
                        {r.status === "completed"
                          ? "分析完成"
                          : r.status === "failed"
                            ? "未完成，原始凭证已保留"
                            : "分析中"}
                      </summary>
                      <AiComparison
                        review={r}
                        materials={data.materials}
                        onRead={read}
                        onTrace={onTrace}
                        onCreate={(n) =>
                          create({ reviewId: r.id, itemIndex: n })
                        }
                        busy={!!busy}
                      />
                    </details>
                  ))}
              </details>
              <details>
                <summary>查看比较的 MCP 读取凭证</summary>
                <div className="material-traces">
                  {comparison.traces.map((t) => (
                    <button
                      key={t.id}
                      className="btn quiet"
                      onClick={() => onTrace(t)}
                    >
                      第 {String(t.args.page)} 页 · {t.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              </details>
            </>
          )}
        </section>
      )}
      {source &&
        createPortal(
          <div
            className="issue-source-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="审查问题原文"
            ref={sourcePanel}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setSource(undefined);
              }
              if (e.key !== "Tab") return;
              const buttons = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not(:disabled),a[href],[tabindex="0"]',
                ),
              );
              const first = buttons[0],
                last = buttons[buttons.length - 1];
              if (
                e.shiftKey &&
                (document.activeElement === first ||
                  document.activeElement === sourcePanel.current)
              ) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }}
          >
            <div className="issue-source">
              <div className="issue-source-heading">
                <h3>
                  {source.data.material.title} · v{source.data.material.version}{" "}
                  · 第 {source.data.page} 页
                </h3>
                <button
                  aria-label="关闭原文"
                  onClick={() => setSource(undefined)}
                >
                  <X size={22} />
                </button>
              </div>
              <button
                className="btn quiet"
                onClick={() => onTrace(source.trace)}
              >
                查看 MCP 原文读取凭证
              </button>
              <Suspense fallback={<p>加载原文…</p>}>
                <PdfPage
                  url={`/api/cases/${matter.id}/materials/${source.data.material.id}/pdf`}
                  page={source.data.page}
                />
              </Suspense>
              <pre>{source.data.text}</pre>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function IssueEditor({
  issue,
  data,
  matter,
  busy,
  onRead,
  onCompare,
  onAction,
  onSave,
  onCitation,
}: {
  issue: IssueView;
  data: IssueSnapshot;
  matter: CaseView;
  busy: boolean;
  onRead: (id: string, page: number) => Promise<void>;
  onCompare: (a: string, b: string) => Promise<void>;
  onAction: (name: string, fn: () => Promise<void>) => Promise<void>;
  onSave: (body: object) => Promise<void>;
  onCitation: (body: object) => Promise<void>;
}) {
  const draft = useReviewDraft(`issue:${issue.id}`, {
    title: issue.title,
    category: issue.category,
    owner: issue.owner,
    missing: issue.missing,
    note: issue.note,
    status: issue.status,
    partyIds: JSON.stringify(issue.partyIds),
  });
  const f = draft.value,
    set = (key: string, v: string) => draft.setValue({ ...f, [key]: v });
  const [ack, setAck] = useState<string[]>([]);
  const [version, setVersion] = useState(data.materials[0]?.id || "");
  const [page, setPage] = useState(1);
  const [quote, setQuote] = useState("");
  const [relation, setRelation] = useState("support");
  useEffect(() => setAck([]), [issue.revision, data.materials.length]);
  const parties: string[] = JSON.parse(f.partyIds);
  const material = data.materials.find((m) => m.id === version);
  return (
    <section className="issue-editor">
      <div className="issue-editor-heading">
        <span
          className={`badge ${issue.effectiveStatus === "stale" ? "amber" : "green"}`}
        >
          {issueStates[issue.effectiveStatus]}
        </span>
        <small>问题修订 {issue.revision}</small>
      </div>
      {issue.impacts.map((impact) => (
        <div className="issue-impact" key={impact.documentId}>
          <strong>
            该依据从 v{impact.from.version} 更新到了 v{impact.to.version}
          </strong>
          <p>
            {impact.previousOpinion
              ? `原意见：${impact.previousOpinion.note}`
              : "尚无已记录的处理意见，请结合新版继续核实。"}
          </p>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => void onCompare(impact.from.id, impact.to.id)}
          >
            <GitCompareArrows size={15} />
            查看文字差异与关联影响
          </button>
          <label>
            <input
              type="checkbox"
              checked={ack.includes(impact.to.id)}
              onChange={(e) =>
                setAck(
                  e.target.checked
                    ? [...ack, impact.to.id]
                    : ack.filter((id) => id !== impact.to.id),
                )
              }
            />
            我已核对 v{impact.to.version}，并会在意见中说明影响
          </label>
        </div>
      ))}
      <label>
        审查问题
        <textarea
          aria-label="审查问题标题"
          rows={2}
          maxLength={1000}
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </label>
      <div className="issue-fields">
        <label>
          问题类别
          <select
            aria-label="问题类别"
            value={f.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {Object.entries(issueCategories).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          责任人
          <input
            aria-label="问题责任人"
            maxLength={100}
            value={f.owner}
            onChange={(e) => set("owner", e.target.value)}
            placeholder="人工填写，身份未经认证"
          />
        </label>
      </div>
      <fieldset className="issue-parties">
        <legend>相关主体</legend>
        {matter.parties.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={parties.includes(p.id)}
              onChange={(e) =>
                set(
                  "partyIds",
                  JSON.stringify(
                    e.target.checked
                      ? [...parties, p.id]
                      : parties.filter((id) => id !== p.id),
                  ),
                )
              }
            />
            {p.name}
          </label>
        ))}
      </fieldset>
      <h3>
        原文依据 <small>{issue.citations.length} 条</small>
      </h3>
      {!issue.citations.length && (
        <p className="issue-empty">尚无依据，可添加已有摘录或核对原文页。</p>
      )}
      {issue.citations.map((c) => {
        const m = data.materials.find((m) => m.id === c.versionId);
        return (
          <article className={`issue-citation ${c.relation}`} key={c.id}>
            <div>
              <span>{citationRelations[c.relation]}</span>
              <button
                disabled={busy}
                onClick={() => void onRead(c.versionId, c.page)}
              >
                {m?.title} · v{m?.version} · 第 {c.page} 页{" "}
                <ArrowRight size={13} />
              </button>
            </div>
            <blockquote>{c.quote}</blockquote>
          </article>
        );
      })}
      <details className="issue-add-source">
        <summary>添加原文依据</summary>
        <label>
          引用用途
          <select
            aria-label="引用用途"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          >
            {Object.entries(citationRelations).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {data.evidence.length > 0 && (
          <label>
            选择已保存的摘录
            <select
              aria-label="已保存摘录"
              value=""
              onChange={(e) => {
                const v = data.evidence.find((v) => v.id === e.target.value);
                if (v) {
                  setVersion(v.versionId);
                  setPage(v.page);
                  setQuote(v.quote);
                }
              }}
            >
              <option value="">也可直接填写原文…</option>
              {data.evidence.map((e) => (
                <option key={e.id} value={e.id}>
                  第 {e.page} 页 · {e.quote.slice(0, 75)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          材料版本
          <select
            aria-label="依据材料版本"
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              setPage(1);
              setQuote("");
            }}
          >
            <option value="">选择材料</option>
            {data.materials.map((m) => (
              <option value={m.id} key={m.id}>
                {m.title} · v{m.version}
                {m.latest ? "" : " · 旧版"}
              </option>
            ))}
          </select>
        </label>
        <div className="issue-fields">
          <label>
            原文页码
            <input
              aria-label="依据页码"
              type="number"
              min={1}
              max={material?.pageCount || 1}
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
            />
          </label>
          <button
            className="btn secondary"
            disabled={busy || !version}
            onClick={() => void onRead(version, page)}
          >
            核对原文页
          </button>
        </div>
        <label>
          连续原文摘录
          <textarea
            aria-label="问题原文摘录"
            value={quote}
            maxLength={1800}
            rows={3}
            onChange={(e) => setQuote(e.target.value)}
          />
        </label>
        <button
          className="btn secondary"
          disabled={busy || !version || quote.trim().length < 8}
          onClick={() =>
            void onAction("citation", async () => {
              await onCitation({ versionId: version, page, quote, relation });
              setQuote("");
            })
          }
        >
          关联此依据
        </button>
      </details>
      <label>
        仍需补充的信息
        <textarea
          aria-label="问题待补信息"
          rows={2}
          maxLength={3000}
          value={f.missing}
          onChange={(e) => set("missing", e.target.value)}
          placeholder="例如：签署版文件、生效日期、授权主体"
        />
      </label>
      <label>
        律师工作说明或处理意见
        <textarea
          aria-label="问题处理意见"
          rows={4}
          maxLength={4000}
          value={f.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="说明依据如何支持判断，如何处理矛盾，仍有何限制"
        />
      </label>
      <label>
        处理状态
        <select
          aria-label="问题处理状态"
          value={f.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="open">待核实</option>
          <option value="reviewing">复核中</option>
          <option value="resolved">已记录处理意见</option>
        </select>
      </label>
      <p className="issue-fineprint">
        记录处理意见须有责任人、原文依据和至少 10
        字说明，且待补信息已处理。材料变更后须补充新版依据并确认影响；不会自动完成补证或批准收案。
      </p>
      <div className="issue-save">
        <span>
          {draft.dirty ? "有未保存内容 · 当前标签页暂存" : "已保存的记录"}{" "}
        </span>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() =>
            void onAction("save", async () => {
              await onSave({
                ...f,
                partyIds: parties,
                issueRevision: issue.revision,
                acknowledgedVersionIds: ack,
              });
              draft.accept({ ...f });
            })
          }
        >
          {busy ? (
            <LoaderCircle className="spin" size={15} />
          ) : (
            <Check size={15} />
          )}
          保存问题记录
        </button>
      </div>
      <details className="issue-history">
        <summary>意见历史 · {issue.reviews.length} 次</summary>
        {issue.reviews.map((r) => (
          <article key={r.id}>
            <strong>
              {r.reviewer} · {new Date(r.at).toLocaleString("zh-CN")}
            </strong>
            <p>{r.note}</p>
            <small>
              当时关联 {r.basis.length} 条原文依据；核对 {r.versions.length}{" "}
              个版本。历史保留，不自动作为当前有效意见。
            </small>
          </article>
        ))}
      </details>
    </section>
  );
}
function AiComparison({
  review: r,
  materials,
  onRead,
  onTrace,
  onCreate,
  busy,
}: {
  review: MaterialReview;
  materials: IssueSnapshot["materials"];
  onRead: (id: string, p: number) => Promise<void>;
  onTrace: (t: Trace) => void;
  onCreate: (n: number) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="issue-ai-result">
      <h4>
        {r.status === "completed"
          ? "AI 待核实影响"
          : r.status === "failed"
            ? "本轮未完成"
            : "正在读取与整理"}{" "}
        · {r.traces.length} 次工具调用
      </h4>
      {r.error && <p role="alert">{r.error}</p>}
      {!!r.formatRetries && (
        <p>本轮包含 {r.formatRetries} 次输出格式重试，引用仍经原文校验。</p>
      )}
      {r.items.map((i, n) => (
        <article key={n}>
          <p>{i.question}</p>
          {i.citations.map((c, k) => (
            <button
              key={k}
              className="material-citation"
              onClick={() => void onRead(c.versionId, c.page)}
            >
              <span>
                v{materials.find((m) => m.id === c.versionId)?.version} · 原文第{" "}
                {c.page} 页
              </span>
              <blockquote>{c.quote}</blockquote>
            </button>
          ))}
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => void onCreate(n)}
          >
            加入审查问题
          </button>
        </article>
      ))}
      <div className="material-traces">
        {r.traces.map((t) => (
          <button className="btn quiet" key={t.id} onClick={() => onTrace(t)}>
            读取凭证 · v
            {materials.find((m) => m.id === t.args.versionId)?.version} · 第{" "}
            {String(t.args.page)} 页
          </button>
        ))}
      </div>
    </div>
  );
}
