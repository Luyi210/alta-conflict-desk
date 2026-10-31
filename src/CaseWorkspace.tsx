import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Building2,
  Check,
  ChevronRight,
  FileSearch,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import type {
  AppStatus,
  CaseInput,
  CaseParty,
  CaseView,
  Entity,
  PartyRole,
  Trace,
} from "../shared/types";
import { api, post } from "./api";
import "./case-workbench.css";
import { intakeDraftKey, parseIntakeDraft } from "./intake-draft";

const roles: PartyRole[] = ["拟委托人", "交易对方", "担保方", "其他相关方"];
export const caseState = {
  running: "正在核查",
  "needs-attention": "待补充与复核",
  "ready-for-review": "待记录总意见",
  recorded: "审查记录完备",
  closed: "已结束 · 不承接",
};
const newParty = (role: PartyRole = "交易对方", name = ""): CaseParty => ({
  id: crypto.randomUUID(),
  name,
  role,
  confirmed: false,
});

export function IdentityPicker({
  party,
  onChange,
  onTrace,
  onError,
  disabled = false,
  onConfirm,
}: {
  party: CaseParty;
  onChange: (party: CaseParty) => void;
  onTrace: (trace: Trace) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  onConfirm?: (entity: Entity) => Promise<void>;
}) {
  const [candidates, setCandidates] = useState<Entity[]>([]);
  const [searched, setSearched] = useState(false);
  const [queryTrace, setQueryTrace] = useState<Trace>();
  const [busy, setBusy] = useState(false);
  async function search() {
    setBusy(true);
    setSearched(false);
    setCandidates([]);
    try {
      const result = await api<{ entities: Entity[]; trace: Trace }>(
        `/entities?q=${encodeURIComponent(party.name)}`,
      );
      setCandidates(result.entities);
      setQueryTrace(result.trace);
      setSearched(true);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm(entity: Entity) {
    setBusy(true);
    try {
      if (onConfirm) await onConfirm(entity);
      else onChange({ ...party, entity, name: entity.name, confirmed: true });
      setCandidates([]);
      setSearched(false);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="identity-picker">
      <div className="party-search">
        <label className="sr-only" htmlFor={`party-${party.id}`}>
          {party.role}企业名称或 LEI
        </label>
        <input
          id={`party-${party.id}`}
          value={party.name}
          disabled={disabled || busy}
          placeholder="输入企业全称或 20 位 LEI"
          maxLength={300}
          onChange={(e) => {
            onChange({
              ...party,
              name: e.target.value,
              entity: undefined,
              confirmed: false,
            });
            setCandidates([]);
            setQueryTrace(undefined);
            setSearched(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (party.name.trim().length >= 2 && !disabled) void search();
            }
          }}
        />
        <button
          className="btn secondary"
          type="button"
          disabled={disabled || busy || party.name.trim().length < 2}
          onClick={() => void search()}
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Search size={16} />
          )}{" "}
          查询身份
        </button>
      </div>
      {queryTrace && (
        <button
          className="text-btn"
          type="button"
          style={{ fontSize: 12, marginTop: 8 }}
          onClick={() => onTrace(queryTrace)}
        >
          查看身份查询调用凭证 ↗
        </button>
      )}
      {party.confirmed && party.entity && (
        <div className="identity-confirmed">
          <Check size={15} />
          <div>
            <b>身份已确认 · {party.entity.jurisdiction}</b>
            <code>{party.entity.lei}</code>
          </div>
          <a href={party.entity.sourceUrl} target="_blank" rel="noreferrer">
            查看来源 ↗
          </a>
        </div>
      )}
      {!party.confirmed && !searched && (
        <p className="field-hint">
          确认 LEI 后执行核查；暂未识别的主体会保留为待补项。
        </p>
      )}
      {searched && candidates.length === 0 && (
        <div className="case-hint amber">
          未找到已登记 LEI
          的匹配主体。可修改名称继续查询，或保留为待补项；不代表该企业不存在。
        </div>
      )}
      {candidates.length > 0 && (
        <div className="identity-candidates" aria-label="主体候选结果">
          <p>请核对主体名称、辖区及 LEI，确认本次核查对象。</p>
          {candidates.map((entity) => (
            <div className="identity-candidate" key={entity.lei}>
              <div>
                <strong>{entity.name}</strong>
                <span>
                  {entity.jurisdiction} · {entity.status}
                </span>
                <code>{entity.lei}</code>
                <span>{entity.address}</span>
                <a href={entity.sourceUrl} target="_blank" rel="noreferrer">
                  GLEIF 来源 ↗
                </a>
              </div>
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() => void confirm(entity)}
              >
                确认此主体
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseWorkspace({
  status,
  onConnect,
  connecting,
  onSettings,
  onCreate,
  onError,
  onTrace,
  onModelHelp,
  onBack,
}: {
  status: AppStatus;
  onConnect: () => Promise<void>;
  connecting: boolean;
  onSettings: () => void;
  onCreate: (value: CaseView) => void;
  onError: (message: string) => void;
  onTrace: (trace: Trace) => void;
  onModelHelp: () => void;
  onBack: () => void;
}) {
  const [restored] = useState(() => {
    try {
      return parseIntakeDraft(sessionStorage.getItem(intakeDraftKey));
    } catch {
      return undefined;
    }
  });
  const [value, setValue] = useState<CaseInput>(
    () =>
      restored?.value || {
        name: "",
        context: "",
        jurisdiction: "中国香港（事项背景）",
        mode: status.model.configured ? "ai" : "rules",
        parties: [newParty("拟委托人"), newParty()],
      },
  );
  const [step, setStep] = useState(restored?.step || 1);
  const [savedAt, setSavedAt] = useState(restored?.savedAt || "");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);
  const { name, context, jurisdiction, mode, parties } = value;
  const hasContent = Boolean(name || context || parties.some((p) => p.name));
  useEffect(() => {
    if (submitted.current) return;
    try {
      if (hasContent) {
        const at = new Date().toISOString();
        sessionStorage.setItem(
          intakeDraftKey,
          JSON.stringify({ version: 1, value, step, savedAt: at }),
        );
        setSavedAt(at);
      } else sessionStorage.removeItem(intakeDraftKey);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [value, step, hasContent]);
  const update = (change: Partial<CaseInput>) =>
    setValue((current) => ({ ...current, ...change }));
  const ready = ["gleif", "ledger"].every((id) =>
    status.connectors.some((c) => c.id === id && c.connected),
  );
  const confirmed = parties.filter((p) => p.confirmed && p.entity);
  const duplicate =
    new Set(confirmed.map((p) => p.entity!.lei)).size !== confirmed.length;
  const basicValid = name.trim().length >= 2 && jurisdiction.trim().length > 0;
  const partyValid =
    parties.every((p) => p.name.trim().length >= 1) &&
    confirmed.length > 0 &&
    !duplicate;
  const valid =
    ready &&
    basicValid &&
    partyValid &&
    (mode !== "ai" || status.model.configured);
  const changeStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  function demo() {
    update({
      name: "融资专项 · 收案审查（虚构示例）",
      context:
        "演示事项：拟为 HSBC UK BANK PLC 提供融资文件专项服务，交易对方为 HSBC BANK PLC。核实双方及已披露母公司是否命中本所既有事项，并由律师复核委托范围及保密义务。企业身份公开，委托关系与事项全部虚构。",
      parties: [
        newParty("拟委托人", "21380081EP12LC86CB82"),
        newParty("交易对方", "MP6I5ZYZBEU3UXPYFY54"),
      ],
    });
  }
  async function create() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const result = await post<CaseView>("/cases", value);
      submitted.current = true;
      try {
        sessionStorage.removeItem(intakeDraftKey);
      } catch {
        /* Creation succeeded even if local storage is unavailable. */
      }
      onCreate(result);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const stepTitles = ["事项信息", "确认相关方", "核查确认"];
  return (
    <div className="page-enter case-workspace intake-workspace">
      <button className="back-link" onClick={onBack} disabled={busy}>
        <ArrowLeft size={15} /> 返回收案工作台
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">NEW MATTER</div>
          <h1>新建收案审查</h1>
          <p>把委托范围说清楚，再核实每一方的身份。</p>
        </div>
        <span className="intake-draft-state" role="status">
          <Check size={14} />
          {busy
            ? "正在建立案件…"
            : !storageAvailable
              ? "暂存不可用，请勿关闭页面"
              : hasContent
                ? `当前标签页已暂存 · ${new Date(savedAt || Date.now()).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`
                : "填写后自动暂存"}
        </span>
      </div>
      <nav className="intake-stepper" aria-label="新建审查步骤">
        {stepTitles.map((title, i) => (
          <button
            key={title}
            disabled={busy || (i > 0 && !basicValid) || (i > 1 && !partyValid)}
            aria-current={step === i + 1 ? "step" : undefined}
            onClick={() => changeStep(i + 1)}
            className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""}
          >
            <span>
              {step > i + 1 ? (
                <Check size={16} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div>
              <strong>{title}</strong>
              <small>
                {["背景与服务范围", "检索并确认法人身份", "检查范围后启动"][i]}
              </small>
            </div>
            <ChevronRight size={16} />
          </button>
        ))}
      </nav>
      <div className="intake-layout">
        <section className="panel intake-main">
          <div className="intake-panel-heading">
            <span className="eyebrow small">STEP 0{step} / 03</span>
            <h2>{stepTitles[step - 1]}</h2>
            <p>
              {
                [
                  "先建立这份委托的背景，帮助 AI 提出更相关的复核问题。",
                  "名称相似不等于同一主体。请核对登记名称与 LEI 后确认。",
                  "核对本次范围和运行方式，启动后会保存独立的案件记录。",
                ][step - 1]
              }
            </p>
          </div>
          <fieldset disabled={busy} className="intake-fields">
            {step === 1 && (
              <>
                <div className="template-choice">
                  <div>
                    <FileSearch size={20} />
                    <span>
                      <strong>第一次体验？使用融资事项示例</strong>
                      <small>
                        填入两家可查询的公开企业，身份仍需实际核查。
                      </small>
                    </span>
                  </div>
                  <button className="btn secondary" onClick={demo}>
                    填入示例
                  </button>
                </div>
                <label className="case-field">
                  事项名称 <span className="required-label">必填</span>
                  <input
                    aria-label="事项名称"
                    value={name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="例如：星河科技 · A 轮融资法律服务"
                    maxLength={200}
                  />
                </label>
                <label className="case-field">
                  事项辖区{" "}
                  <input
                    aria-label="事项辖区"
                    value={jurisdiction}
                    onChange={(e) => update({ jurisdiction: e.target.value })}
                    placeholder="例如：中国香港"
                    maxLength={100}
                  />
                  <small className="field-help">
                    用于描述事项背景，不自动适用当地执业规则。
                  </small>
                </label>
                <label className="case-field">
                  委托背景与范围{" "}
                  <textarea
                    aria-label="委托背景与范围"
                    value={context}
                    onChange={(e) => update({ context: e.target.value })}
                    placeholder="拟代表哪一方？提供什么服务？涉及哪些交易对方、担保方或需要特别核实的关系？"
                    rows={5}
                    maxLength={4000}
                  />
                  <small className="field-help">
                    用于辅助分析事项范围和保密义务。{context.length} / 4000
                  </small>
                </label>
              </>
            )}
            {step === 2 && (
              <>
                {!ready && (
                  <div className="case-connect-banner">
                    <div>
                      <strong>先连接核查数据源</strong>
                      <p>公开身份查询与本地台账，均为只读工具。</p>
                    </div>
                    <button
                      className="btn primary"
                      disabled={connecting}
                      onClick={() => void onConnect()}
                    >
                      {connecting ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <ArrowRight size={16} />
                      )}{" "}
                      连接数据源
                    </button>
                  </div>
                )}
                <div className="party-progress">
                  <span>
                    <Users size={17} /> {parties.length} 方纳入本次范围
                  </span>
                  <b>
                    {confirmed.length} / {parties.length} 已确认
                  </b>
                </div>
                <div className="party-roster">
                  {parties.map((party, index) => (
                    <article className="party-card" key={party.id}>
                      <div className="party-card-heading">
                        <span className="party-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <select
                          aria-label={`第 ${index + 1} 方角色`}
                          value={party.role}
                          onChange={(e) =>
                            update({
                              parties: parties.map((p) =>
                                p.id === party.id
                                  ? { ...p, role: e.target.value as PartyRole }
                                  : p,
                              ),
                            })
                          }
                        >
                          {roles.map((role) => (
                            <option key={role}>{role}</option>
                          ))}
                        </select>
                        <button
                          className="icon-btn"
                          aria-label={`移除第 ${index + 1} 方`}
                          disabled={parties.length === 1}
                          onClick={() =>
                            update({
                              parties: parties.filter((p) => p.id !== party.id),
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <IdentityPicker
                        party={party}
                        onChange={(changed) =>
                          setValue((current) => ({
                            ...current,
                            parties: current.parties.map((p) =>
                              p.id === changed.id ? changed : p,
                            ),
                          }))
                        }
                        onError={onError}
                        onTrace={onTrace}
                        disabled={!ready || busy}
                      />
                    </article>
                  ))}
                </div>
                <button
                  className="btn secondary add-party"
                  disabled={parties.length >= 6}
                  onClick={() => update({ parties: [...parties, newParty()] })}
                >
                  <Plus size={16} /> 添加相关方{" "}
                  <small>{parties.length}/6</small>
                </button>
                {duplicate && (
                  <div className="inline-error" role="alert">
                    同一 LEI
                    只需核查一次，请移除重复主体，并在背景中说明兼任角色。
                  </div>
                )}
                <p className="field-help">
                  至少确认一方后可开始。未确认的相关方会保留在案件中，形成待补身份项。
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <div className="intake-review-name">
                  <FileSearch size={22} />
                  <div>
                    <h3>{name}</h3>
                    <p>
                      {jurisdiction || "未填写辖区"} · {parties.length}{" "}
                      方相关主体
                    </p>
                  </div>
                  <button className="text-btn" onClick={() => changeStep(1)}>
                    修改
                  </button>
                </div>
                <div className="review-parties">
                  {parties.map((p) => (
                    <div key={p.id}>
                      <span>{p.role}</span>
                      <strong>{p.entity?.name || p.name}</strong>
                      <span
                        className={`badge ${p.confirmed ? "green" : "amber"}`}
                      >
                        {p.confirmed ? (
                          <>
                            <Check size={13} /> 已确认
                          </>
                        ) : (
                          "身份待补"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mode-heading">
                  <h3>选择执行方式</h3>
                  <button className="text-btn" onClick={onModelHelp}>
                    模型说明 <ArrowRight size={13} />
                  </button>
                </div>
                <div
                  className="execution-options"
                  role="radiogroup"
                  aria-label="执行方式"
                >
                  {(["ai", "rules"] as const).map((option) => (
                    <label
                      key={option}
                      className={`execution-option ${mode === option ? "selected" : ""} ${option === "ai" && !status.model.configured ? "unavailable" : ""}`}
                    >
                      <input
                        type="radio"
                        name="execution-mode"
                        value={option}
                        checked={mode === option}
                        disabled={option === "ai" && !status.model.configured}
                        onChange={() => update({ mode: option })}
                      />
                      <span>
                        {option === "ai" ? (
                          <Sparkles size={20} />
                        ) : (
                          <FileSearch size={20} />
                        )}
                        <strong>
                          {option === "ai" ? "AI 辅助核查" : "规则核查"}
                        </strong>
                        <small>
                          {option === "ai"
                            ? status.model.configured
                              ? `${status.model.model} · 模型实际调用工具、整理复核问题`
                              : "模型尚未配置，可先使用规则核查"
                            : "真实查询与确定性比对，不调用模型服务"}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="data-boundary">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>本次数据流向</strong>
                    <p>
                      企业名称、LEI 发送至 GLEIF；案件与虚构台账保存在本机。
                      {mode === "ai"
                        ? "事项背景、主体与台账命中将发送至已配置的模型服务。"
                        : "事项背景与台账命中不会发送给模型。"}
                    </p>
                  </div>
                </div>
                {parties.length > confirmed.length && (
                  <div className="case-hint amber">
                    {parties.length - confirmed.length}{" "}
                    方身份尚未确认，将保留为补证事项，不计为已完成核查。
                  </div>
                )}
                {!ready && (
                  <div className="case-connect-banner">
                    <strong>数据源未就绪</strong>
                    <button
                      className="btn secondary"
                      disabled={connecting}
                      onClick={() => void onConnect()}
                    >
                      {connecting ? "连接中…" : "连接核查数据源"}
                    </button>
                  </div>
                )}
              </>
            )}
          </fieldset>
          <div className="intake-bottom">
            <button
              className="btn quiet"
              disabled={busy}
              onClick={() => (step > 1 ? changeStep(step - 1) : onBack())}
            >
              <ArrowLeft size={15} />
              {step > 1 ? "上一步" : "返回工作台"}
            </button>
            <div>
              {step === 1 && !basicValid && (
                <small>填写事项名称与辖区后继续</small>
              )}
              {step === 2 && !partyValid && (
                <small>
                  {duplicate
                    ? "请先移除重复主体"
                    : "填写各方名称，并至少确认一方身份"}
                </small>
              )}
              {step < 3 ? (
                <button
                  className="btn primary"
                  disabled={busy || (step === 1 ? !basicValid : !partyValid)}
                  onClick={() => changeStep(step + 1)}
                >
                  下一步：{stepTitles[step]}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={!valid || busy}
                  onClick={() => void create()}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <FileSearch size={16} />
                  )}{" "}
                  {busy
                    ? "正在建立案件…"
                    : `创建案件并核查 ${confirmed.length} 方`}
                </button>
              )}
            </div>
          </div>
        </section>
        <aside className="intake-aside">
          <span className="eyebrow small">A CLEAR REVIEW PATH</span>
          <h2>
            一份委托，
            <br />
            一条完整的审查路径。
          </h2>
          <ol>
            <li className={step === 1 ? "active" : ""}>
              <span>01</span>
              <div>
                <strong>明确范围</strong>
                <p>谁是委托人、提供什么服务，是判断相关性的起点。</p>
              </div>
            </li>
            <li className={step === 2 ? "active" : ""}>
              <span>02</span>
              <div>
                <strong>确认身份</strong>
                <p>通过登记信息区分名称近似的企业。</p>
              </div>
            </li>
            <li className={step === 3 ? "active" : ""}>
              <span>03</span>
              <div>
                <strong>取证与复核</strong>
                <p>每次调用保留来源，最终意见由律师记录。</p>
              </div>
            </li>
          </ol>
          <div className="intake-aside-note">
            <ShieldCheck size={18} />
            <p>
              草稿仅在当前浏览器标签页暂存；创建后进入本机案件库。公开查询限于登记
              LEI 的企业。
            </p>
          </div>
          <button className="text-btn" onClick={onSettings} disabled={busy}>
            管理数据连接 <ArrowRight size={14} />
          </button>
        </aside>
      </div>
    </div>
  );
}
