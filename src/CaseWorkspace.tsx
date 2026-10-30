import { useState } from "react";
import {
  ArrowRight,
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
  CaseParty,
  CaseView,
  Entity,
  PartyRole,
  Trace,
} from "../shared/types";
import { api, post } from "./api";
import "./case-workbench.css";

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
  cases,
  onConnect,
  connecting,
  onSettings,
  onCreate,
  onOpen,
  onError,
  onTrace,
  onModelHelp,
}: {
  status: AppStatus;
  cases: CaseView[];
  onConnect: () => Promise<void>;
  connecting: boolean;
  onSettings: () => void;
  onCreate: (value: CaseView) => void;
  onOpen: (id: string) => void;
  onError: (message: string) => void;
  onTrace: (trace: Trace) => void;
  onModelHelp: () => void;
}) {
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [jurisdiction, setJurisdiction] = useState("中国香港（事项背景）");
  const [parties, setParties] = useState<CaseParty[]>([
    newParty("拟委托人"),
    newParty(),
  ]);
  const [mode, setMode] = useState<"rules" | "ai">("rules");
  const [busy, setBusy] = useState(false);
  const ready = status.connectors.every((c) => c.connected);
  const confirmed = parties.filter((p) => p.confirmed).length;
  const valid =
    ready &&
    name.trim().length >= 2 &&
    parties.every((p) => p.name.trim().length >= 2) &&
    confirmed > 0;
  function demo() {
    setName("澄川科技 · 跨境融资收案审查（虚构）");
    setContext(
      "演示事项：拟为澄川科技提供融资交易法律服务，核实交易对方与担保方是否命中律所既有或历史事项。委托关系与事项均为虚构。需补充拟委托人的注册资料和各方委托范围。",
    );
    setParties([
      newParty("拟委托人", "澄川科技有限公司（虚构）"),
      newParty("交易对方", "MP6I5ZYZBEU3UXPYFY54"),
      newParty("担保方", "21380081EP12LC86CB82"),
    ]);
  }
  async function create() {
    setBusy(true);
    try {
      onCreate(
        await post<CaseView>("/cases", {
          name,
          context,
          jurisdiction,
          mode,
          parties,
        }),
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter case-workspace">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MATTER INTAKE · CONNECTED EVIDENCE</div>
          <h1>把每一方，都放进审查范围。</h1>
          <p>从确认主体到补齐材料，以同一份案件记录支持律师收案判断。</p>
        </div>
        <span className="case-version">
          案件工作台 <b>03</b>
        </span>
      </div>
      <div className="case-steps">
        <span>
          <b>01</b> 确认当事人
        </span>
        <ChevronRight size={15} />
        <span>
          <b>02</b> MCP 取证与比对
        </span>
        <ChevronRight size={15} />
        <span>
          <b>03</b> 补证与逐项复核
        </span>
        <ChevronRight size={15} />
        <span>
          <b>04</b> 记录总意见
        </span>
      </div>
      {!ready && (
        <div className="case-connect-banner">
          <div>
            <strong>先连接两组核查工具</strong>
            <p>GLEIF 公开法人身份 + 本机虚构客户台账，均为真实 MCP 连接。</p>
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
            连接核查工具
          </button>
        </div>
      )}
      <div className="case-intake-layout">
        <section className="panel case-intake-form">
          <div className="case-section-title">
            <div>
              <span className="eyebrow small">NEW MATTER</span>
              <h2>新建收案审查</h2>
            </div>
            <button className="btn quiet" onClick={demo} disabled={busy}>
              填入演示事项
            </button>
          </div>
          <label className="case-field">
            事项名称
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：某公司融资法律服务"
              maxLength={200}
            />
          </label>
          <div className="case-form-row">
            <label className="case-field">
              事项辖区
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                maxLength={100}
              />
            </label>
            <label className="case-field">
              执行方式
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "rules" | "ai")}
              >
                <option value="rules">规则预览 · 真实 MCP</option>
                <option value="ai" disabled={!status.model.configured}>
                  AI 工具调用{!status.model.configured ? " · 待配置模型" : ""}
                </option>
              </select>
            </label>
          </div>
          <label className="case-field">
            委托背景与范围
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="拟为谁提供什么服务？对方与担保方分别是谁？"
            />
          </label>
          <div className="case-section-title party-section-title">
            <div>
              <h3>
                <Users size={18} /> 当事人与相关方
              </h3>
              <p>最多 6 个企业主体；同一 LEI 合并核查。</p>
            </div>
            <span className="badge green">
              已确认 {confirmed} / {parties.length}
            </span>
          </div>
          <div className="party-roster">
            {parties.map((party, index) => (
              <article className="party-card" key={party.id}>
                <div className="party-card-heading">
                  <span className="party-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <select
                    aria-label={`第 ${index + 1} 方角色`}
                    value={party.role}
                    onChange={(e) =>
                      setParties((items) =>
                        items.map((p) =>
                          p.id === party.id
                            ? { ...p, role: e.target.value as PartyRole }
                            : p,
                        ),
                      )
                    }
                  >
                    {roles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    className="icon-btn"
                    aria-label={`移除第 ${index + 1} 方`}
                    disabled={parties.length === 1 || busy}
                    onClick={() =>
                      setParties((items) =>
                        items.filter((p) => p.id !== party.id),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <IdentityPicker
                  party={party}
                  onChange={(value) =>
                    setParties((items) =>
                      items.map((p) => (p.id === value.id ? value : p)),
                    )
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
            disabled={parties.length >= 6 || busy}
            onClick={() => setParties((items) => [...items, newParty()])}
          >
            <Plus size={16} /> 添加相关方
          </button>
          <div className="case-submit">
            <div>
              <strong>
                {confirmed > 0
                  ? `${confirmed} 方将开始真实核查`
                  : "至少确认 1 个主体后开始"}
              </strong>
              <p>{parties.length - confirmed} 方尚未确认，将进入补证清单。</p>
            </div>
            <button
              className="btn primary"
              disabled={!valid || busy}
              onClick={() => void create()}
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <FileSearch size={17} />
              )}{" "}
              创建案件并核查
            </button>
          </div>
        </section>
        <aside className="case-side-column">
          <section className="panel case-guide">
            <Building2 size={26} />
            <div className="eyebrow small">ONE MATTER, ONE RECORD</div>
            <h2>
              核查有据，
              <br />
              判断有留痕。
            </h2>
            <p>同一案件串起各方身份、既有事项、补证材料与人工复核。</p>
            <ol>
              <li>
                <b>核实身份</b>
                <span>
                  用 LEI 区分同名企业，不将名称相似直接认定为同一主体。
                </span>
              </li>
              <li>
                <b>追溯线索</b>
                <span>只读检索当前与历史事项，保留每次调用的参数和来源。</span>
              </li>
              <li>
                <b>补齐审查记录</b>
                <span>
                  缺失身份、资料或复核意见会持续提示，不自动批准收案。
                </span>
              </li>
            </ol>
            <button className="text-btn" onClick={onSettings}>
              管理数据源 <ArrowRight size={14} />
            </button>
            <button className="text-btn" onClick={onModelHelp}>
              查看模型配置说明 <ArrowRight size={14} />
            </button>
          </section>
          <div className="case-scope-note">
            公开数据仅覆盖登记 LEI
            的企业及会计合并母公司关系。事项辖区仅作背景；本原型不自动适用当地职业规则。
          </div>
        </aside>
      </div>
      <section className="panel case-recent">
        <div className="case-section-title">
          <div>
            <span className="eyebrow small">CONTINUE REVIEW</span>
            <h3>最近案件</h3>
          </div>
          <span className="muted">{cases.length} 份本地记录</span>
        </div>
        {cases.length === 0 ? (
          <p className="case-empty">
            创建首份案件后，可以在这里继续补证与复核。
          </p>
        ) : (
          cases.slice(0, 6).map((item) => (
            <button
              className="case-recent-row"
              key={item.id}
              onClick={() => onOpen(item.id)}
            >
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.parties.length} 方主体 · {item.progress.findings} 条线索
                  · 修订 {item.revision}
                </small>
              </span>
              <span className="badge amber">{caseState[item.status]}</span>
              <ArrowRight size={17} />
            </button>
          ))
        )}
      </section>
    </div>
  );
}
