import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  LoaderCircle,
  Plug,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { api, post } from "./api";
import type { CaseView, Trace } from "../shared/types";
import type {
  Material,
  MaterialPage,
  MaterialsSnapshot,
} from "../shared/materials";
import "./materials.css";
const PdfPage = lazy(() => import("./PdfPage"));
export default function MaterialDesk({
  matter,
  onUpdate,
  onError,
  onTrace,
}: {
  matter: CaseView;
  onUpdate: (v: CaseView) => void;
  onError: (e: string) => void;
  onTrace: (t: Trace) => void;
}) {
  const base = `/cases/${matter.id}/materials`;
  const [snapshot, setSnapshot] = useState<MaterialsSnapshot>();
  const [selection, setSelection] = useState<{
    id: string;
    page: number;
    quote?: string;
  }>();
  const [source, setSource] = useState<MaterialPage>();
  const [readError, setReadError] = useState("");
  const [trace, setTrace] = useState<Trace>();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState(
    "请结合本案背景，指出委托范围、客户边界和保密条款中需要律师核实的问题，并引用原文。",
  );
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [taskId, setTaskId] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const replace = useRef<string | undefined>(undefined);
  const viewer = useRef<HTMLDivElement>(null);
  async function refresh() {
    const s = await api<MaterialsSnapshot>(base);
    setSnapshot(s);
    return s;
  }
  async function changed() {
    await refresh();
    onUpdate(await api<CaseView>(`/cases/${matter.id}`));
  }
  useEffect(() => {
    void refresh().catch((e) => onError(e.message));
  }, [matter.id]);
  const running = snapshot?.reviews.some((r) => r.status === "running");
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const timer = setInterval(() => {
      void api<MaterialsSnapshot>(base)
        .then((s) => {
          if (!cancelled) setSnapshot(s);
        })
        .catch((e) => {
          if (!cancelled) onError(e.message);
        });
    }, 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [running, base]);
  useEffect(() => {
    setSource(undefined);
    setReadError("");
    setTrace(undefined);
    setQuote("");
    setNote("");
    setTaskId("");
    if (!selection || !snapshot?.connected) return;
    let cancelled = false;
    void api<{ data: MaterialPage; trace: Trace }>(
      `${base}/${selection.id}/pages/${selection.page}`,
    )
      .then((result) => {
        if (cancelled) return;
        setSource(result.data);
        setTrace(result.trace);
        setQuote(selection.quote || "");
      })
      .catch((e) => {
        if (!cancelled) setReadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selection, snapshot?.connected, base]);
  async function action(name: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(name);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function upload(file: File) {
    await action("upload", async () => {
      if (file.size > 8 * 1024 * 1024) throw new Error("单份 PDF 最大 8 MB");
      const params = new URLSearchParams({ title: file.name });
      if (replace.current) params.set("previous", replace.current);
      const res = await fetch(`/api${base}/upload?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "上传失败");
      await changed();
      setSelection({ id: result.id, page: 1 });
      setNotice("PDF 已保存为独立版本；尚未授权 AI。");
    });
  }
  const materials = snapshot?.materials || [];
  const allowed = materials.filter((m) => m.modelAllowed);
  const readEnabled = snapshot?.tools.find(
    (t) => t.name === "read_material_page",
  )?.enabled;
  function locate(id: string, page: number, quote?: string) {
    setSelection({ id, page, quote });
    viewer.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const selected = materials.find((m) => m.id === selection?.id);
  const currentReview = snapshot?.reviews[0];
  return (
    <div className="material-desk">
      <div className="material-heading">
        <div>
          <span className="eyebrow small">CASE EVIDENCE LIBRARY</span>
          <h2>案件材料与原文</h2>
          <p>保留每一版材料，让复核依据回到具体一页。</p>
        </div>
        <span className="badge">
          <ShieldCheck size={14} /> 本案范围 · 本机保存
        </span>
      </div>
      <div className="material-connection">
        <div>
          <Plug size={18} />
          <span>
            <strong>
              {snapshot?.connected ? "材料 MCP 已连接" : "连接案件材料 MCP"}
            </strong>
            <small>文件导入本机后可读取；AI 仅访问下方明确授权的版本。</small>
          </span>
        </div>
        <button
          className="btn secondary"
          disabled={!!busy}
          onClick={() =>
            void action("connect", async () => {
              await post(
                `/connectors/documents/${snapshot?.connected ? "disconnect" : "connect"}`,
              );
              await changed();
            })
          }
        >
          {snapshot?.connected ? "断开连接" : "连接材料工具"}
        </button>
      </div>
      {notice && (
        <p className="material-notice" role="status">
          <Check size={15} />
          {notice}
        </p>
      )}
      <div className="material-library-layout">
        <aside className="material-library">
          <div className="material-library-title">
            <h3>
              材料库 <small>{materials.length} 个版本</small>
            </h3>
            <button
              className="btn quiet"
              disabled={!!busy}
              onClick={() => {
                replace.current = undefined;
                input.current?.click();
              }}
            >
              <Upload size={14} /> 导入 PDF
            </button>
          </div>
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <p className="material-limit">
            带文本 PDF · 单份 ≤ 8 MB / 20 页。扫描件请先
            OCR。导入不会自动发送给模型。
          </p>
          {!materials.length && (
            <div className="material-empty">
              <BookOpen size={30} />
              <h3>把需要核实的材料放在这里</h3>
              <p>可先导入虚构委托范围说明，体验页码定位和版本留存。</p>
              <button
                className="btn primary"
                disabled={!!busy}
                onClick={() =>
                  void action("sample", async () => {
                    const m = await post<Material>(`${base}/sample`, {
                      variant: "original",
                    });
                    await changed();
                    setSelection({ id: m.id, page: 1 });
                  })
                }
              >
                {busy === "sample" ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <FilePlus2 size={16} />
                )}{" "}
                导入虚构示例
              </button>
            </div>
          )}
          {materials.map((m) => (
            <article
              className={`material-card ${selection?.id === m.id ? "selected" : ""}`}
              key={m.id}
            >
              <button
                className="material-select"
                onClick={() => locate(m.id, 1)}
              >
                <span className="material-version">
                  v{m.version} · {m.latest ? "当前版本" : "旧版保留"}
                </span>
                <strong>{m.title}</strong>
                <small>
                  {m.pageCount} 页 ·{" "}
                  {new Date(m.createdAt).toLocaleDateString("zh-CN")} ·{" "}
                  {Math.ceil(m.size / 1024)} KB
                </small>
              </button>
              <label className="material-grant">
                <input
                  type="checkbox"
                  checked={m.modelAllowed}
                  disabled={!!busy}
                  onChange={(e) =>
                    void action(m.id, async () => {
                      setSnapshot(
                        await post<MaterialsSnapshot>(
                          `${base}/${m.id}/permission`,
                          { allowed: e.target.checked },
                        ),
                      );
                    })
                  }
                />
                允许 AI 读取此版本
              </label>
              <div className="material-card-actions">
                <button
                  disabled={!!busy}
                  onClick={() => {
                    replace.current = m.id;
                    input.current?.click();
                  }}
                >
                  上传新版本
                </button>
                <a
                  href={`/api${base}/${m.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  打开 PDF
                </a>
              </div>
              {m.latest && m.title.includes("DEMO-2026-014") && (
                <button
                  className="material-sample-update"
                  disabled={!!busy}
                  onClick={() =>
                    void action("sample-update", async () => {
                      const d = await post<Material>(`${base}/sample`, {
                        variant: "updated",
                        previous: m.id,
                      });
                      await changed();
                      setSelection({ id: d.id, page: 1 });
                      setNotice(
                        "示例已增加融资文件服务范围；旧版原文与引用保留，新版需重新授权。",
                      );
                    })
                  }
                >
                  导入示例修订版
                </button>
              )}
              <details>
                <summary>版本指纹</summary>
                <code>{m.sha256}</code>
              </details>
            </article>
          ))}
        </aside>
        <section className="material-viewer" ref={viewer}>
          {selected && selection ? (
            <>
              <div className="material-viewer-title">
                <h3>{selected.title}</h3>
                <span>
                  v{selected.version} ·{" "}
                  {selected.latest ? "当前版本" : "已有新版本，本页仍为旧版"}
                </span>
              </div>
              <div className="material-page-controls">
                <button
                  aria-label="上一页"
                  disabled={selection.page <= 1}
                  onClick={() =>
                    setSelection({ id: selected.id, page: selection.page - 1 })
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  第 {selection.page} / {selected.pageCount} 页
                </span>
                <button
                  aria-label="下一页"
                  disabled={selection.page >= selected.pageCount}
                  onClick={() =>
                    setSelection({ id: selected.id, page: selection.page + 1 })
                  }
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  className="btn quiet"
                  disabled={!trace}
                  onClick={() => trace && onTrace(trace)}
                >
                  查看 MCP 读取凭证
                </button>
              </div>
              {snapshot?.connected && readEnabled ? (
                <>
                  <Suspense fallback={<p>加载原文阅读器…</p>}>
                    <PdfPage
                      url={`/api${base}/${selected.id}/pdf`}
                      page={selection.page}
                    />
                  </Suspense>
                  {source ? (
                    <div className="material-transcript">
                      <div className="section-heading">
                        <h3>本页提取文字</h3>
                        <small>以 PDF 版面为准</small>
                      </div>
                      <pre>
                        {selection.quote &&
                        source.text.includes(selection.quote) ? (
                          <>
                            {source.text.slice(
                              0,
                              source.text.indexOf(selection.quote),
                            )}
                            <mark>{selection.quote}</mark>
                            {source.text.slice(
                              source.text.indexOf(selection.quote) +
                                selection.quote.length,
                            )}
                          </>
                        ) : (
                          source.text || "该页无可提取文字"
                        )}
                      </pre>
                      <details
                        className="material-record"
                        open={Boolean(selection.quote)}
                      >
                        <summary>记录本页复核依据</summary>
                        <label>
                          连续原文摘录
                          <textarea
                            aria-label="连续原文摘录"
                            value={quote}
                            maxLength={1800}
                            rows={3}
                            onChange={(e) => setQuote(e.target.value)}
                            placeholder="从本页提取文字复制连续原文，不要改写或省略"
                          />
                        </label>
                        <label>
                          核实说明
                          <textarea
                            aria-label="材料核实说明"
                            value={note}
                            maxLength={2000}
                            rows={2}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="说明这段材料支持什么，以及仍待确认什么"
                          />
                        </label>
                        <label>
                          关联补证项
                          <select
                            aria-label="关联补证项"
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                          >
                            <option value="">仅留存依据，不关联待办</option>
                            {matter.tasks
                              .filter((t) => !t.systemManaged)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.title}
                                </option>
                              ))}
                          </select>
                        </label>
                        <p>
                          保存依据会使旧总意见恢复草稿；关联待办保持待处理，须由律师另行核实完成。
                        </p>
                        <button
                          className="btn primary"
                          disabled={
                            !!busy ||
                            quote.trim().length < 8 ||
                            note.trim().length < 2
                          }
                          onClick={() =>
                            void action("record", async () => {
                              await post(`${base}/evidence`, {
                                versionId: selected.id,
                                page: selection.page,
                                quote,
                                note,
                                ...(taskId ? { taskId } : {}),
                                expectedRevision: matter.revision,
                              });
                              await changed();
                              setNote("");
                              setNotice("原文依据已保存，版本和页码已锁定。");
                            })
                          }
                        >
                          保存复核依据
                        </button>
                      </details>
                    </div>
                  ) : readError ? (
                    <div className="inline-error" role="alert">
                      <p>{readError}</p>
                      <button
                        className="btn secondary"
                        onClick={() => setSelection({ ...selection })}
                      >
                        重新读取此页
                      </button>
                    </div>
                  ) : (
                    <p role="status">正在通过 MCP 读取此页…</p>
                  )}
                </>
              ) : (
                <div className="material-empty">
                  {snapshot?.connected
                    ? "原文读取工具已暂停，请到工具调用台启用。"
                    : "连接材料 MCP 后可查看原文与读取凭证。"}
                </div>
              )}
            </>
          ) : (
            <div className="material-empty">
              <BookOpen size={32} />
              <h3>选择一份材料</h3>
              <p>原文页面、页码和可核对的提取文字会显示在这里。</p>
            </div>
          )}
        </section>
      </div>
      <section className="material-ai">
        <div className="section-heading">
          <div>
            <span className="eyebrow small">GROUNDED REVIEW</span>
            <h2>
              <Sparkles size={20} /> AI 材料复核
            </h2>
          </div>
          <span className="badge">
            {allowed.length} 份已授权 ·{" "}
            {allowed.reduce((n, m) => n + m.pageCount, 0)} 页
          </span>
        </div>
        <label>
          本轮需要核实的问题
          <textarea
            aria-label="材料复核问题"
            rows={2}
            value={question}
            maxLength={1200}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
        <div className="material-disclosure">
          <ShieldCheck size={17} />
          <p>
            点击运行后，将本案背景、问题与已授权版本的原文发送给配置的模型。每轮最多
            4 份 / 12 页。撤回授权会阻止后续读取，不能撤回已发送的数据。
          </p>
        </div>
        <button
          className="btn primary"
          disabled={
            !!busy ||
            running ||
            !allowed.length ||
            !snapshot?.connected ||
            !readEnabled ||
            question.trim().length < 2
          }
          onClick={() =>
            void action("ai", async () => {
              await post(`${base}/reviews`, {
                versionIds: allowed.map((m) => m.id),
                question,
              });
              await refresh();
            })
          }
        >
          {running ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}{" "}
          {running
            ? `AI 正在读取与整理 · ${currentReview?.traces.length || 0} 次调用`
            : "运行已授权材料复核"}
        </button>
        {snapshot?.reviews.map((r, i) => (
          <details className="material-review" key={r.id} open={i === 0}>
            <summary>
              {r.status === "completed"
                ? "复核问题已整理"
                : r.status === "failed"
                  ? "本轮未完成"
                  : "材料复核进行中"}{" "}
              · {r.model} · {r.traces.length} 次 MCP 调用{" "}
              <small>{new Date(r.createdAt).toLocaleTimeString("zh-CN")}</small>
            </summary>
            {r.error && <p className="inline-error">{r.error}</p>}
            {r.versionIds.some(
              (id) => !materials.find((m) => m.id === id)?.latest,
            ) && (
              <p className="material-stale">
                本轮包含已有新版本的材料。以下引用仍指向当时读取的旧版。
              </p>
            )}
            {r.items.map((item, n) => (
              <article className="material-question" key={n}>
                <h3>
                  {String(n + 1).padStart(2, "0")} · {item.question}
                </h3>
                {item.citations.map((c, k) => {
                  const m = materials.find((m) => m.id === c.versionId);
                  return (
                    <button
                      key={k}
                      className="material-citation"
                      onClick={() => locate(c.versionId, c.page, c.quote)}
                    >
                      <span>
                        {m?.title} · v{m?.version} · 第 {c.page} 页{" "}
                        <ChevronRight size={14} />
                      </span>
                      <blockquote>{c.quote}</blockquote>
                    </button>
                  );
                })}
              </article>
            ))}
            <p className="material-limit">
              AI
              仅整理待核实问题，引用位置经程序校验；语义及法律判断仍需律师复核。
            </p>
            <div className="material-traces">
              {r.traces.map((t) => (
                <button
                  className="btn quiet"
                  key={t.id}
                  onClick={() => onTrace(t)}
                >
                  {t.status === "success" ? "✓" : "!"} 第 {String(t.args.page)}{" "}
                  页 · {t.durationMs} ms
                </button>
              ))}
            </div>
          </details>
        ))}
      </section>
      <section className="material-evidence">
        <div className="section-heading">
          <h2>已留存的原文依据</h2>
          <span>{snapshot?.evidence.length || 0} 条</span>
        </div>
        {!snapshot?.evidence.length && (
          <p>
            在原文页或 AI
            引用中保存核实说明后，依据会与版本一并留存并进入案件报告。
          </p>
        )}
        {snapshot?.evidence.map((e) => {
          const m = materials.find((m) => m.id === e.versionId);
          return (
            <article key={e.id}>
              <button
                className="material-evidence-link"
                onClick={() => locate(e.versionId, e.page, e.quote)}
              >
                {m?.title} · v{m?.version} · 第 {e.page} 页{" "}
                <ChevronRight size={15} />
              </button>
              {!m?.latest && (
                <span className="material-stale">已有新版本 · 旧引用保留</span>
              )}
              <blockquote>{e.quote}</blockquote>
              <p>{e.note}</p>
              <small>
                {e.taskId
                  ? matter.tasks.find((t) => t.id === e.taskId)?.title ||
                    "原补证项已被后续核查替代"
                  : "未关联补证项"}{" "}
                · {new Date(e.createdAt).toLocaleString("zh-CN")}
              </small>
            </article>
          );
        })}
      </section>
    </div>
  );
}
