import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileCheck2,
  History,
  LoaderCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import type {
  CaseDecision,
  CaseParty,
  CaseTask,
  CaseView,
  Run,
  Trace,
} from "../shared/types";
import { api, ApiError, post } from "./api";
import { caseState, IdentityPicker } from "./CaseWorkspace";
import "./case-workbench.css";
import "./review-refinements.css";
import { useReviewDraft } from "./useReviewDraft";

const date = (value: string) =>
  new Date(value).toLocaleString("zh-CN", { hour12: false });
const decisionLabels = {
  draft: "草稿",
  declined: "不承接 · 结束审查",
  "needs-information": "待补充材料",
  "needs-partner-review": "待合伙人进一步复核",
  "review-recorded": "审查记录完备",
};
const taskLabels = {
  identity: "主体身份",
  coverage: "来源覆盖",
  scope: "事项范围",
  confidentiality: "既往事项保密",
};
async function refreshConflict(
  error: unknown,
  caseId: string,
  onUpdate: (value: CaseView) => void,
) {
  if (error instanceof ApiError && error.status === 409) {
    try {
      onUpdate(await api<CaseView>(`/cases/${caseId}`));
    } catch {
      /* Keep the original save error and local draft if refresh also fails. */
    }
  }
}

function TaskEditor({
  task,
  caseId,
  revision,
  partyNames,
  onUpdate,
  onError,
}: {
  task: CaseTask;
  caseId: string;
  revision: number;
  partyNames: string[];
  onUpdate: (value: CaseView) => void;
  onError: (message: string) => void;
}) {
  const draft = useReviewDraft(`task:${caseId}:${task.id}`, {
    note: task.note,
    reference: task.reference,
  });
  const { note, reference } = draft.value;
  const [busy, setBusy] = useState(false);
  async function save(status: "open" | "resolved") {
    setBusy(true);
    try {
      const updated = await post<CaseView>(
        `/cases/${caseId}/tasks/${encodeURIComponent(task.id)}`,
        { status, note, reference, expectedRevision: revision },
      );
      draft.accept({ note, reference });
      onUpdate(updated);
    } catch (e) {
      await refreshConflict(e, caseId, onUpdate);
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className={`case-task ${task.status === "resolved" ? "resolved" : ""}`}
    >
      <div className="case-task-heading">
        <span
          className={`badge ${task.status === "resolved" ? "green" : "amber"}`}
        >
          {task.status === "resolved" ? "已补充" : taskLabels[task.kind]}
        </span>
        <span className="muted">
          {task.required ? "必填" : "建议"} · {task.partyIds.length} 方相关
        </span>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div className="task-party-names">涉及主体：{partyNames.join("、")}</div>
      {task.systemManaged ? (
        <div className="case-hint">
          {task.kind === "identity"
            ? "请在「主体与线索」中查询并确认身份。"
            : "请在「主体与线索」中重新核查，实际来源恢复后此项自动更新。"}{" "}
          此项不能手动勾选消除。
        </div>
      ) : (
        <>
          <label className="case-field">
            核实结果 / 补充说明
            <textarea
              value={note}
              rows={2}
              maxLength={4000}
              onChange={(e) =>
                draft.setValue({ ...draft.value, note: e.target.value })
              }
              placeholder="说明核实了哪些信息，依据是什么"
            />
          </label>
          <label className="case-field">
            材料引用
            <input
              value={reference}
              maxLength={1000}
              onChange={(e) =>
                draft.setValue({ ...draft.value, reference: e.target.value })
              }
              placeholder="例如：访谈记录第 2 页、委托范围邮件日期与编号"
            />
          </label>
          <div className="case-task-actions">
            <small aria-live="polite">
              {draft.dirty
                ? draft.storageAvailable
                  ? "有未保存内容 · 当前标签页已暂存"
                  : "有未保存内容 · 请保存后离开"
                : task.updatedAt
                  ? `已保存 · ${date(task.updatedAt)}`
                  : "仅记录材料引用文本"}
            </small>
            <button
              className="btn quiet"
              disabled={busy || !draft.dirty}
              onClick={() => void save(task.status)}
            >
              保存{task.status === "resolved" ? "修改" : "草稿"}
            </button>
            <button
              className="btn secondary"
              disabled={
                busy ||
                (task.status === "open" &&
                  (note.trim().length < 2 || reference.trim().length < 2))
              }
              onClick={() =>
                void save(task.status === "resolved" ? "open" : "resolved")
              }
            >
              {busy ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <Check size={15} />
              )}
              {task.status === "resolved" ? "重新打开" : "保存并标记已补充"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function DecisionForm({
  value,
  onUpdate,
  onError,
}: {
  value: CaseView;
  onUpdate: (value: CaseView) => void;
  onError: (message: string) => void;
}) {
  const draft = useReviewDraft<{
    status: CaseDecision["status"];
    note: string;
    reviewer: string;
  }>(`decision:${value.id}`, {
    status: value.decision.status,
    note: value.decision.note,
    reviewer: value.decision.reviewer,
  });
  const { status, note, reviewer } = draft.value;
  const [busy, setBusy] = useState(false);
  const previousRevision = useRef(value.revision);
  useEffect(() => {
    if (previousRevision.current !== value.revision) {
      draft.setValue((current) => ({ ...current, status: "draft" }));
      previousRevision.current = value.revision;
    }
  }, [value.revision]);
  async function save() {
    setBusy(true);
    try {
      const updated = await post<CaseView>(`/cases/${value.id}/decision`, {
        status,
        note,
        reviewer,
        expectedRevision: value.revision,
      });
      draft.accept({ status, note, reviewer });
      onUpdate(updated);
    } catch (e) {
      await refreshConflict(e, value.id, onUpdate);
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="case-review-layout">
      <section className="panel case-decision">
        <div className="case-section-title">
          <div>
            <span className="eyebrow small">HUMAN REVIEW</span>
            <h2>案件总意见</h2>
          </div>
          <FileCheck2 size={24} />
        </div>
        <p>
          记录本轮审查的处理意见及依据。资料变化时，总意见恢复草稿，已有文字保留供重新审查。
        </p>
        {value.decision.invalidatedAt && (
          <div className="case-hint" role="status">
            资料已更新，原意见已恢复草稿。文字已保留，请核对当前修订后重新记录。
          </div>
        )}
        <label className="case-field">
          记录状态
          <select
            value={status}
            onChange={(e) =>
              draft.setValue({
                ...draft.value,
                status: e.target.value as CaseDecision["status"],
              })
            }
          >
            {Object.entries(decisionLabels).map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="case-field">
          复核人姓名
          <input
            value={reviewer}
            maxLength={100}
            onChange={(e) =>
              draft.setValue({ ...draft.value, reviewer: e.target.value })
            }
            placeholder="手工填写，本原型不验证身份"
          />
        </label>
        <label className="case-field">
          复核意见
          <textarea
            value={note}
            maxLength={6000}
            rows={6}
            onChange={(e) =>
              draft.setValue({ ...draft.value, note: e.target.value })
            }
            placeholder="说明核实情况、尚存问题和下一步处理意见"
          />
        </label>
        {status === "declined" && (
          <div className="case-hint">
            结束后保留全部未核实事项、线索和材料缺口。此操作记录律师的不承接意见，不将未完成核查标记为通过。
          </div>
        )}
        <div className="case-hint">
          “审查记录完备”仅表示本次材料和复核记录齐备，不代表批准收案。待进一步复核仅保存本地状态，不会向合伙人发送通知。
        </div>
        <button
          className="btn primary"
          disabled={
            busy ||
            (status !== "draft" &&
              (note.trim().length < 2 || reviewer.trim().length < 2)) ||
            (status === "declined" && value.status === "running") ||
            (status === "review-recorded" && value.blockers.length > 0)
          }
          onClick={() => void save()}
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Check size={16} />
          )}{" "}
          {status === "declined"
            ? "记录不承接并结束审查"
            : status === "draft"
              ? "保存意见草稿"
              : "保存案件总意见"}
        </button>
        {draft.dirty && (
          <small className="draft-status" role="status">
            {draft.storageAvailable
              ? "有未保存内容 · 当前标签页已暂存"
              : "有未保存内容 · 请保存后离开"}
          </small>
        )}
        {value.decision.recordedAt && (
          <small className="decision-saved">
            已保存 · {date(value.decision.recordedAt)} · 修订{" "}
            {value.decision.revision}
          </small>
        )}
      </section>
      <aside className="panel case-blockers">
        <span className="eyebrow small">COMPLETENESS CHECK</span>
        <h2>
          {value.blockers.length > 0
            ? `${value.blockers.length} 项仍需处理`
            : "可以记录总意见"}
        </h2>
        <p>
          以下事项阻止标记“审查记录完备”。选择不承接时可以结束审查，所有缺口仍保留。
        </p>
        {value.blockers.length ? (
          <ul>
            {value.blockers.map((item, i) => (
              <li key={`${i}-${item}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className="case-hint green">
            本轮核查的系统阻塞项已处理。仍需律师判断职业义务与收案条件。
          </div>
        )}
      </aside>
    </div>
  );
}

export default function CaseResults({
  value,
  onBack,
  onUpdate,
  onOpenRun,
  onTrace,
  onError,
}: {
  value: CaseView;
  onBack: () => void;
  onUpdate: (value: CaseView) => void;
  onOpenRun: (id: string) => void;
  onTrace: (trace: Trace) => void;
  onError: (message: string) => void;
}) {
  const [tab, setTab] = useState<"parties" | "tasks" | "review" | "activity">(
    "parties",
  );
  const [resolving, setResolving] = useState<CaseParty>();
  const [busy, setBusy] = useState("");
  async function retry(party: CaseParty) {
    setBusy(party.id);
    try {
      onUpdate(
        await post<CaseView>(`/cases/${value.id}/parties/${party.id}/retry`),
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function runFor(party: CaseParty): Run | undefined {
    return value.runs.find((run) => run.id === party.runId);
  }
  const pending = value.progress.pendingFindings;
  return (
    <div className="page-enter case-results">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={15} /> 返回案件工作台
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            MATTER REVIEW · REVISION {String(value.revision).padStart(2, "0")}
          </div>
          <h1>{value.name}</h1>
          <p>
            {value.jurisdiction || "未填写事项辖区"} ·{" "}
            {value.mode === "rules"
              ? "规则预览 / 真实 MCP 调用"
              : "AI 工具调用"}{" "}
            · {date(value.createdAt)}
          </p>
        </div>
        <a
          className="btn secondary"
          href={`/api/cases/${value.id}/report`}
          download
        >
          <Download size={16} /> 导出案件记录
        </a>
      </div>
      <div className="case-summary-strip">
        <div>
          <span>核查范围</span>
          <strong>
            {value.progress.confirmed}
            <small> / {value.progress.total} 方已确认</small>
          </strong>
        </div>
        <div>
          <span>真实核查完成</span>
          <strong>
            {value.progress.completed}
            <small> 方</small>
          </strong>
        </div>
        <div>
          <span>待复核线索</span>
          <strong>
            {pending}
            <small> 条</small>
          </strong>
        </div>
        <div>
          <span>待补材料</span>
          <strong>
            {value.progress.openTasks}
            <small> 项</small>
          </strong>
        </div>
        <div className="case-summary-state">
          <span
            className={`badge ${value.status === "recorded" ? "green" : "amber"}`}
          >
            {caseState[value.status]}
          </span>
          <small>{decisionLabels[value.decision.status]}</small>
        </div>
      </div>
      {value.status === "closed" && (
        <div className="case-hint closed-notice">
          <FileCheck2 size={18} />
          <div>
            <strong>已记录不承接意见，本轮审查结束</strong>
            <p>
              尚有 {value.blockers.length}{" "}
              项未完成事项，记录完整保留。修改证据或重新核查会重新开启审查。
            </p>
          </div>
        </div>
      )}
      {value.status !== "closed" && value.status !== "running" && (
        <div className="case-next-action">
          <div>
            <span className="eyebrow small">NEXT ACTION</span>
            <strong>
              {value.progress.pendingFindings
                ? `还有 ${value.progress.pendingFindings} 条线索需要律师处理`
                : value.progress.openTasks
                  ? `补齐 ${value.progress.openTasks} 项身份或范围材料`
                  : "记录本轮审查总意见"}
            </strong>
            <p>
              {value.progress.pendingFindings
                ? "逐条查看依据，选择升级复核、保留问题或排除线索。"
                : "已完成的操作会保存至案件记录，可随时导出。"}
            </p>
          </div>
          <button
            className="btn secondary"
            onClick={() =>
              setTab(
                value.progress.pendingFindings
                  ? "parties"
                  : value.progress.openTasks
                    ? "tasks"
                    : "review",
              )
            }
          >
            继续处理 <ArrowRight size={15} />
          </button>
        </div>
      )}
      {value.status === "running" && (
        <div className="case-hint case-live" role="status">
          <LoaderCircle className="spin" size={16} /> 正在通过 MCP
          获取身份、母公司关系和台账线索，结果会自动更新。
        </div>
      )}
      <div className="case-tabs" role="tablist" aria-label="案件审查步骤">
        {(
          [
            ["parties", "主体与线索", Users],
            ["tasks", `补证清单 · ${value.progress.openTasks}`, FileCheck2],
            ["review", "案件总意见", Check],
            ["activity", "操作记录", History],
          ] as const
        ).map(([id, title, Icon]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            key={id}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {title}
          </button>
        ))}
      </div>
      {tab === "parties" && (
        <>
          {value.context && (
            <div className="panel case-context">
              <span className="eyebrow small">委托背景与范围</span>
              <p>{value.context}</p>
            </div>
          )}
          <div className="case-parties-grid">
            {value.parties.map((party) => {
              const run = runFor(party);
              return (
                <article className="panel case-party-result" key={party.id}>
                  <div className="case-section-title">
                    <span className="badge muted">{party.role}</span>
                    <span
                      className={`badge ${run?.status === "completed" ? "green" : "amber"}`}
                    >
                      {!party.confirmed
                        ? "身份待确认"
                        : !run
                          ? "等待核查"
                          : {
                              running: "核查中",
                              completed: "核查已完成",
                              partial: "来源或模型缺口",
                              failed: "核查失败",
                            }[run.status]}
                    </span>
                  </div>
                  <h3>{party.entity?.name || party.name}</h3>
                  <code>{party.entity?.lei || "尚无已确认 LEI"}</code>
                  {run ? (
                    <>
                      <div className="party-result-metrics">
                        <span>
                          <b>{run.findings.length}</b> 条线索
                        </span>
                        <span>
                          <b>{run.traces.length}</b> 次真实调用
                        </span>
                        <span>
                          <b>{run.relations.length}</b> 条公开关系
                        </span>
                      </div>
                      {run.modelExecution && (
                        <div className="case-hint">
                          模型：
                          {
                            {
                              running: "执行中",
                              completed: "调用链路完成",
                              failed: "执行失败",
                            }[run.modelExecution.status]
                          }{" "}
                          · {run.modelExecution.toolCallCount} 次工具调用 ·{" "}
                          {run.modelExecution.rounds} 轮
                          {run.modelExecution.error &&
                            ` · ${run.modelExecution.error}`}
                        </div>
                      )}
                      <p>{run.summary || "正在核实主体与相关事项…"}</p>
                      {run.error && (
                        <div className="inline-error">{run.error}</div>
                      )}
                      <div className="case-party-actions">
                        <button
                          className="btn primary"
                          onClick={() => onOpenRun(run.id)}
                        >
                          查看证据与逐项复核 <ArrowRight size={15} />
                        </button>
                        <button
                          className="btn quiet"
                          disabled={run.status === "running" || !!busy}
                          onClick={() => setResolving(party)}
                        >
                          更正主体
                        </button>
                        <button
                          className="icon-btn"
                          aria-label={`重新核查${party.name}`}
                          title="重新核查会生成新记录并使旧总意见失效"
                          disabled={run.status === "running" || !!busy}
                          onClick={() => void retry(party)}
                        >
                          {busy === party.id ? (
                            <LoaderCircle className="spin" size={16} />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        此方仍在案件范围内，但未执行工具核查。需补充注册资料，并确认已登记的法人身份。
                      </p>
                      <button
                        className="btn secondary"
                        onClick={() => setResolving(party)}
                      >
                        补录主体身份 <ArrowRight size={15} />
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>
          {resolving && (
            <section className="panel case-resolve">
              <div className="case-section-title">
                <h3>补录 · {resolving.role}</h3>
                <button
                  className="btn quiet"
                  onClick={() => setResolving(undefined)}
                >
                  收起
                </button>
              </div>
              <IdentityPicker
                key={resolving.id}
                party={resolving}
                onChange={setResolving}
                onError={onError}
                onTrace={onTrace}
                onConfirm={async (entity) => {
                  onUpdate(
                    await post<CaseView>(
                      `/cases/${value.id}/parties/${resolving.id}/resolve`,
                      { entity, confirmed: true },
                    ),
                  );
                  setResolving(undefined);
                }}
              />
            </section>
          )}
          <div className="case-bottom-next">
            <p>线索只提示需要核实的关系；存在关联企业不等于已构成利益冲突。</p>
            <button className="btn secondary" onClick={() => setTab("tasks")}>
              继续处理补证清单 <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
      {tab === "tasks" && (
        <div>
          <div className="case-section-title">
            <div>
              <h2>补证与范围核实</h2>
              <p>同一内部事项跨主体合并，保留每项核实结果及材料引用。</p>
            </div>
            <button className="btn secondary" onClick={() => setTab("review")}>
              查看案件总意见 <ArrowRight size={15} />
            </button>
          </div>
          <div className="case-tasks-grid">
            {value.tasks.map((task) => (
              <TaskEditor
                key={task.id}
                task={task}
                caseId={value.id}
                revision={value.revision}
                partyNames={task.partyIds.map(
                  (id) => value.parties.find((p) => p.id === id)?.name || id,
                )}
                onUpdate={onUpdate}
                onError={onError}
              />
            ))}
          </div>
          {value.tasks.length === 0 && (
            <div className="case-empty panel">
              当前没有自动生成的补证项；请结合实际委托范围复核。
            </div>
          )}
        </div>
      )}
      {tab === "review" && (
        <DecisionForm
          key={value.id}
          value={value}
          onUpdate={onUpdate}
          onError={onError}
        />
      )}
      {tab === "activity" && (
        <section className="panel case-activity">
          <div className="case-section-title">
            <div>
              <span className="eyebrow small">LOCAL AUDIT TRAIL</span>
              <h2>案件操作记录</h2>
            </div>
            <span className="badge muted">修订 {value.revision}</span>
          </div>
          <p>
            保留身份补录、重跑、材料及意见变更。工具的原始参数和结果在各主体核查凭证中查看。
          </p>
          <ol>
            {[...value.activity].reverse().map((event) => (
              <li key={event.id}>
                <span />
                <div>
                  <strong>{event.message}</strong>
                  <small>{date(event.at)}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
