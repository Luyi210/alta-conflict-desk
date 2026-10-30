import {
  ArrowUpRight,
  Check,
  CircleHelp,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import type { Run, Trace } from "../shared/types";
import { evidenceFacts } from "../shared/evidence-facts";
import "./review-refinements.css";

const toolLabels: Record<string, string> = {
  get_entity: "企业登记",
  get_relationships: "公开母公司",
  search_matters: "内部事项比对",
};

export default function ReviewBrief({
  run,
  onTrace,
}: {
  run: Run;
  onTrace: (trace: Trace) => void;
}) {
  if (!run.modelSummary) return null;
  // Historical runs retain their original text. Only verified successful model traces become links.
  const ids =
    run.modelBrief?.citedTraceIds ||
    run.modelSummary.split("引用调用：")[1]?.trim().split("、") ||
    [];
  const facts = evidenceFacts(run.traces);
  const summary =
    run.modelBrief?.summary || run.modelSummary.split("引用调用：")[0].trim();
  const factIds = new Set(facts.flatMap((fact) => fact.traceIds));
  const citations = run.traces.filter(
    (t) =>
      (ids.includes(t.id) || factIds.has(t.id)) &&
      t.status === "success" &&
      t.initiator === "model",
  );
  const sourceLinks = (traceIds: string[]) =>
    traceIds.map((id) => {
      const trace = citations.find((t) => t.id === id);
      if (!trace) return null;
      return (
        <button
          className="brief-source"
          key={id}
          onClick={() => onTrace(trace)}
          title={`查看真实工具返回 · ${trace.tool}`}
        >
          {citations.indexOf(trace) + 1} ·{" "}
          {toolLabels[trace.tool] || trace.tool}
          <ArrowUpRight size={12} />
        </button>
      );
    });
  return (
    <section className="review-brief" aria-label="AI 核查简报">
      <header>
        <div>
          <span className="eyebrow small">REVIEW BRIEF</span>
          <h2>
            <Sparkles size={19} /> AI 核查简报
          </h2>
        </div>
        <span className="badge muted">
          {run.modelExecution?.model || "AI 辅助"} ·{" "}
          {run.modelExecution?.toolCallCount || citations.length} 次工具调用
        </span>
      </header>
      {summary.length > 400 ? (
        <details className="brief-legacy">
          <summary>历史模型摘要 · 保留原文，待律师核对</summary>
          <p className="brief-summary">{summary}</p>
        </details>
      ) : (
        <p className="brief-summary">
          <span className="brief-summary-label">AI 摘要 · 待律师核对</span>
          {summary}
        </p>
      )}
      {(facts.length > 0 || run.modelBrief) && (
        <div
          className={`brief-grid ${run.modelBrief?.questions?.length || run.modelBrief?.nextSteps?.length ? "" : "single"}`}
        >
          {(
            [
              ["来源记录", facts, Check],
              ["律师待核实", run.modelBrief?.questions, CircleHelp],
              ["建议下一步", run.modelBrief?.nextSteps, FileCheck2],
            ] as const
          ).map(([title, items, Icon]) =>
            items?.length ? (
              <div key={title}>
                <h3>
                  <Icon size={16} />
                  {title}
                </h3>
                <ol>
                  {items.map((item, i) => (
                    <li key={i}>
                      <p>{item.text}</p>
                      {item.traceIds.length > 0 && (
                        <div className="brief-sources">
                          {sourceLinks(item.traceIds)}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null,
          )}
        </div>
      )}
      <footer>
        <span>来源可追溯 · 点击查看原始返回</span>
        <div className="brief-sources">
          {sourceLinks(citations.map((t) => t.id))}
        </div>
        <small>辅助整理事实与复核问题，最终意见由律师记录。</small>
      </footer>
    </section>
  );
}
