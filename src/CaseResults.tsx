import { useEffect, useState } from "react";
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
import { post } from "./api";
import { caseState, IdentityPicker } from "./CaseWorkspace";
import "./case-workbench.css";

const date = (value: string) =>
  new Date(value).toLocaleString("zh-CN", { hour12: false });
const decisionLabels = {
  draft: "草稿",
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

function TaskEditor({
  task,
  caseId,
  onUpdate,
  onError,
}: {
  task: CaseTask;
  caseId: string;
  onUpdate: (value: CaseView) => void;
  onError: (message: string) => void;
}) {
  const [note, setNote] = useState(task.note);
  const [reference, setReference] = useState(task.reference);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setNote(task.note);
    setReference(task.reference);
  }, [task.note, task.reference]);
  async function save(status: "open" | "resolved") {
    setBusy(true);
    try {
      onUpdate(
        await post<CaseView>(
          `/cases/${caseId}/tasks/${encodeURIComponent(task.id)}`,
          { status, note, reference },
        ),
      );
    } catch (e) {
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
              onChange={(e) => setNote(e.target.value)}
              placeholder="说明核实了哪些信息，依据是什么"
            />
          </label>
          <label className="case-field">
            材料引用
            <input
              value={reference}
              maxLength={1000}
              onChange={(e) => setReference(e.target.value)}
              placeholder="例如：访谈记录第 2 页、委托范围邮件日期与编号"
            />
          </label>
          <div className="case-task-actions">
            <small>仅保存引用文本，尚未上传或验证材料。</small>
            <button
              className="btn secondary"
              disabled={busy}
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
  const [status, setStatus] = useState<CaseDecision["status"]>(
    value.decision.status,
  );
  const [note, setNote] = useState(value.decision.note);
  const [reviewer, setReviewer] = useState(value.decision.reviewer);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setStatus(value.decision.status);
    setNote(value.decision.note);
    setReviewer(value.decision.reviewer);
  }, [
    value.id,
    value.revision,
    value.decision.recordedAt,
    value.decision.status,
  ]);
  async function save() {
    setBusy(true);
    try {
      onUpdate(
        await post<CaseView>(`/cases/${value.id}/decision`, {
          status,
          note,
          reviewer,
        }),
      );
    } catch (e) {
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
          逐项核实线索与材料后，记录律师意见。主体身份或子核查复核结果发生变化，已有总意见将恢复草稿。
        </p>
        <label className="case-field">
          记录状态
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as CaseDecision["status"])
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
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="手工填写，本原型不验证身份"
          />
        </label>
        <label className="case-field">
          复核意见
          <textarea
            value={note}
            maxLength={6000}
            rows={6}
            onChange={(e) => setNote(e.target.value)}
            placeholder="说明核实情况、尚存问题和下一步处理意见"
          />
        </label>
        <div className="case-hint">
          “审查记录完备”仅表示本次材料和复核记录齐备，不代表批准收案。待进一步复核仅保存本地状态，不会向合伙人发送通知。
        </div>
        <button
          className="btn primary"
          disabled={
            busy || (status === "review-recorded" && value.blockers.length > 0)
          }
          onClick={() => void save()}
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Check size={16} />
          )}{" "}
          保存案件总意见
        </button>
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
        <p>在这些事项处理完成前，不能标记审查记录完备。</p>
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
              <h2>让待核实的问题，有具体落点。</h2>
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
        <DecisionForm value={value} onUpdate={onUpdate} onError={onError} />
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
