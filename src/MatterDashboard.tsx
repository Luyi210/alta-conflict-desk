import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  FilePlus2,
  FolderOpen,
  LoaderCircle,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { AppStatus, CaseView } from "../shared/types";
import type { CaseTab } from "./navigation";
import { caseState } from "./CaseWorkspace";

const finished = (c: CaseView) =>
  c.status === "recorded" || c.status === "closed";
const shortDate = (date: string) =>
  new Date(date).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
export function nextAction(c: CaseView): {
  title: string;
  detail: string;
  tab: CaseTab;
} {
  if (c.status === "running")
    return {
      title: "查看核查进度",
      detail: `${c.progress.completed} / ${c.progress.total} 方已完成`,
      tab: "parties",
    };
  if (finished(c))
    return { title: "查看审查记录", detail: "意见与来源已留存", tab: "review" };
  if (c.progress.confirmed < c.progress.total)
    return {
      title: "补录主体身份",
      detail: `${c.progress.total - c.progress.confirmed} 方尚未确认`,
      tab: "parties",
    };
  if (c.runs.some((r) => r.status === "failed" || r.status === "partial"))
    return {
      title: "处理核查缺口",
      detail: "查看失败原因并重新核查",
      tab: "parties",
    };
  if (c.progress.pendingFindings)
    return {
      title: "复核核查线索",
      detail: `${c.progress.pendingFindings} 条待律师处理`,
      tab: "parties",
    };
  if (c.progress.openTasks)
    return {
      title: "补充审查材料",
      detail: `${c.progress.openTasks} 项材料待补齐`,
      tab: "tasks",
    };
  return {
    title: "记录案件总意见",
    detail: "核对本轮证据并记录判断",
    tab: "review",
  };
}

export default function MatterDashboard({
  cases,
  status,
  onNew,
  onOpen,
  onConnect,
  connecting,
  onSettings,
  onModelHelp,
}: {
  cases: CaseView[];
  status: AppStatus;
  onNew: () => void;
  onOpen: (id: string, tab?: CaseTab) => void;
  onConnect: () => Promise<void>;
  connecting: boolean;
  onSettings: () => void;
  onModelHelp: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "attention" | "running" | "finished"
  >("all");
  const [sort, setSort] = useState("updated");
  const active = cases.filter((c) => !finished(c));
  const attention = active.filter((c) => c.status !== "running");
  const connected = status.connectors.filter((c) => c.connected).length;
  const filtered = cases
    .filter((c) => {
      const search =
        `${c.name} ${c.id} ${c.parties.map((p) => `${p.name} ${p.entity?.lei || ""}`).join(" ")}`.toLocaleLowerCase();
      return (
        search.includes(query.trim().toLocaleLowerCase()) &&
        (filter === "all" ||
          (filter === "active" && !finished(c)) ||
          (filter === "attention" && !finished(c) && c.status !== "running") ||
          (filter === "running" && c.status === "running") ||
          (filter === "finished" && finished(c)))
      );
    })
    .sort((a, b) =>
      sort === "created"
        ? b.createdAt.localeCompare(a.createdAt)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  const queue = [...attention]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  const stats = [
    {
      label: "进行中的案件",
      value: active.length,
      note: "含核查与人工审查",
      filter: "active" as const,
    },
    {
      label: "待律师处理",
      value: attention.length,
      note: "主体、线索或材料待办",
      filter: "attention" as const,
    },
    {
      label: "正在核查",
      value: active.filter((c) => c.status === "running").length,
      note: "进度自动更新",
      filter: "running" as const,
    },
    {
      label: "已结束的审查",
      value: cases.filter(finished).length,
      note: "记录完备或不承接",
      filter: "finished" as const,
    },
  ];
  return (
    <div className="matter-dashboard page-enter">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">YOUR MATTERS, IN FOCUS</div>
          <h1>收案工作台</h1>
          <p>先看待办，再进入每一份委托。</p>
        </div>
        <button className="btn primary" onClick={onNew}>
          <FilePlus2 size={17} /> 新建收案审查{" "}
          <span className="button-arrow">↗</span>
        </button>
      </div>
      <div className="workspace-context">
        <span>
          <span className="live-dot" /> 澄明律师事务所 · 演示工作空间
        </span>
        <time>
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </time>
      </div>
      <div className="dashboard-stats">
        {stats.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filter)}
            className={filter === s.filter ? "selected" : ""}
          >
            <span>
              {s.label}
              <ArrowRight size={14} />
            </span>
            <strong>{String(s.value).padStart(2, "0")}</strong>
            <small>{s.note}</small>
          </button>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="work-queue">
          <div className="section-heading">
            <div>
              <span className="eyebrow small">NEXT UP</span>
              <h2>继续处理</h2>
            </div>
            <span className="subtle-count">{attention.length} 份待办案件</span>
          </div>
          {queue.length ? (
            queue.map((c, i) => {
              const next = nextAction(c);
              return (
                <button
                  key={c.id}
                  className="queue-row"
                  onClick={() => onOpen(c.id, next.tab)}
                >
                  <span className="queue-number">0{i + 1}</span>
                  <span className="queue-copy">
                    <strong>{c.name}</strong>
                    <small>{next.detail}</small>
                  </span>
                  <span className="queue-action">
                    {next.title}
                    <ArrowRight size={16} />
                  </span>
                </button>
              );
            })
          ) : (
            <div className="queue-empty">
              <CircleCheck size={24} />
              <div>
                <strong>
                  {cases.length ? "当前没有待处理的审查" : "从第一份委托开始"}
                </strong>
                <p>
                  {cases.length
                    ? "核查中的案件将在完成后进入待办。"
                    : "建立事项、确认各方身份，核查结果会汇集在这里。"}
                </p>
              </div>
            </div>
          )}
        </section>
        <aside className="readiness-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow small">WORKSPACE READY</span>
              <h2>核查环境</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <button className="readiness-row" onClick={onSettings}>
            <span className="readiness-icon">
              <Plug size={17} />
            </span>
            <span>
              <strong>数据连接</strong>
              <small>公开身份 · 本地虚构台账</small>
            </span>
            <b className={connected === 2 ? "ready" : ""}>{connected} / 2</b>
            <ChevronRight size={14} />
          </button>
          <button className="readiness-row" onClick={onModelHelp}>
            <span className="readiness-icon">
              <Sparkles size={17} />
            </span>
            <span>
              <strong>AI 辅助核查</strong>
              <small>
                {status.model.configured
                  ? status.model.model
                  : "可使用规则预览"}
              </small>
            </span>
            <b className={status.model.configured ? "ready" : ""}>
              {status.model.configured ? "已配置" : "待配置"}
            </b>
            <ChevronRight size={14} />
          </button>
          {connected < 2 ? (
            <button
              className="btn primary full"
              disabled={connecting}
              onClick={() => void onConnect()}
            >
              {connecting ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Plug size={16} />
              )}{" "}
              {connecting ? "正在连接…" : "连接核查数据源"}
            </button>
          ) : (
            <div className="ready-caption">
              <Check size={14} /> 数据源已连接，可开始查询
            </div>
          )}
          <p className="readiness-note">
            模型配置与数据连接状态分开显示；实际执行结果保存在案件中。
          </p>
        </aside>
      </div>
      <section className="matter-register" aria-label="案件列表">
        <div className="section-heading">
          <div>
            <span className="eyebrow small">MATTER REGISTER</span>
            <h2>
              全部案件 <span>{cases.length}</span>
            </h2>
          </div>
          <span className="register-note">以当前核查轮次统计</span>
        </div>
        <div className="register-toolbar">
          <div
            className="register-filters"
            role="group"
            aria-label="筛选案件状态"
          >
            {(
              [
                ["all", "全部"],
                ["active", "进行中"],
                ["attention", "待处理"],
                ["running", "核查中"],
                ["finished", "已结束"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                aria-pressed={filter === key}
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="register-search">
            <Search size={16} />
            <input
              aria-label="搜索案件、主体或 LEI"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索案件、主体或 LEI"
            />
            {query && (
              <button aria-label="清空案件搜索" onClick={() => setQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="register-sort"
            aria-label="案件排序"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">最近更新</option>
            <option value="created">最近创建</option>
          </select>
        </div>
        {filtered.length ? (
          <div className="matter-table-scroll">
            <table className="matter-table">
              <thead>
                <tr>
                  <th>事项与相关方</th>
                  <th>审查状态</th>
                  <th>核查覆盖</th>
                  <th>最近更新</th>
                  <th>
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const action = nextAction(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <button
                          className="matter-title"
                          onClick={() => onOpen(c.id)}
                        >
                          {c.name}
                        </button>
                        <span className="matter-subtitle">
                          {c.mode === "ai" ? (
                            <Sparkles size={12} />
                          ) : (
                            <ClipboardList size={12} />
                          )}{" "}
                          {c.mode === "ai" ? "AI 辅助" : "规则核查"}
                          <i /> {c.parties.length} 方 ·{" "}
                          {c.parties[0]?.entity?.name || c.parties[0]?.name}
                        </span>
                      </td>
                      <td>
                        <span className={`matter-status ${c.status}`}>
                          <span />
                          {caseState[c.status]}
                        </span>
                        <small className="matter-state-note">
                          {action.detail}
                        </small>
                      </td>
                      <td>
                        <span className="coverage-label">
                          {c.progress.completed}
                          <small> / {c.progress.total} 方</small>
                        </span>
                        <div
                          className="coverage-track"
                          aria-label={`${c.progress.completed} / ${c.progress.total} 方核查完成`}
                        >
                          <span
                            style={{
                              width: `${c.progress.total ? (c.progress.completed / c.progress.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="matter-date">{shortDate(c.updatedAt)}</td>
                      <td>
                        <button
                          className="matter-open"
                          aria-label={`打开案件 ${c.name}`}
                          onClick={() => onOpen(c.id)}
                        >
                          <ArrowRight size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="register-empty">
            <FolderOpen size={30} />
            <h3>{cases.length ? "没有符合条件的案件" : "还没有案件记录"}</h3>
            <p>
              {cases.length
                ? "试试其他名称、LEI 或状态。"
                : "新建一份收案审查，开始整理各方身份与证据。"}
            </p>
            <button
              className="btn secondary"
              onClick={() => {
                if (cases.length) {
                  setQuery("");
                  setFilter("all");
                } else onNew();
              }}
            >
              {cases.length ? "清除筛选" : "新建收案审查"}
            </button>
          </div>
        )}
        <div className="register-footer">
          <span>
            显示 {filtered.length} / {cases.length} 份案件
          </span>
          <span>
            <ShieldCheck size={13} /> 记录保存在本机
          </span>
        </div>
      </section>
      <div className="dashboard-footnote">
        独立概念原型 ·
        律所事项与委托关系为虚构演示数据；辅助核查不代替律师判断。
      </div>
    </div>
  );
}
