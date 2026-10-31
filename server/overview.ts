import type { AssistantRun } from "../shared/assistant.ts";
import type { IssueView } from "../shared/issues.ts";
import type { Material, MaterialReview } from "../shared/materials.ts";
import type { Overview, OverviewStage } from "../shared/overview.ts";
import type { CaseView, Connector, Run, Trace } from "../shared/types.ts";

type MatterSource = {
  matter: CaseView;
  issues: IssueView[];
  materials: Material[];
  reviews: MaterialReview[];
  assistants: AssistantRun[];
};
const day = 86_400_000;
const offset = 8 * 3_600_000;
const dateKey = (ms: number) =>
  new Date(ms + offset).toISOString().slice(0, 10);
const ended = (m: CaseView) => m.status === "recorded" || m.status === "closed";
export function buildOverview(
  input: {
    matters: MatterSource[];
    runs: Run[];
    manualTraces: Trace[];
    connectors: Connector[];
  },
  days: 7 | 30,
  now = new Date(),
): Overview {
  const end = now.getTime();
  const start =
    Math.floor((end + offset) / day) * day - offset - (days - 1) * day;
  const trend = Array.from({ length: days }, (_, i) => ({
    date: dateKey(start + i * day),
    cases: 0,
    calls: 0,
    errors: 0,
  }));
  const buckets = new Map(trend.map((d) => [d.date, d]));
  const traces = new Map<string, Trace>();
  const add = (items: Trace[]) => items.forEach((t) => traces.set(t.id, t));
  input.runs.forEach((r) => add(r.traces));
  input.matters.forEach((m) =>
    [...m.reviews, ...m.assistants].forEach((r) => add(r.traces)),
  );
  add(input.manualTraces);
  const calls = [...traces.values()].filter(
    (t) => Date.parse(t.startedAt) >= start && Date.parse(t.startedAt) <= end,
  );
  for (const t of calls) {
    const bucket = buckets.get(dateKey(Date.parse(t.startedAt)));
    if (bucket) {
      bucket.calls++;
      if (t.status === "error") bucket.errors++;
    }
  }
  const stageOf = (m: CaseView): OverviewStage => {
    if (m.status === "closed") return "closed";
    if (m.status === "recorded") return "recorded";
    if (m.progress.confirmed < m.progress.total) return "identity";
    if (
      m.status === "running" ||
      m.progress.completed < m.progress.total ||
      m.runs.some((r) => r.status === "partial" || r.status === "failed")
    )
      return "evidence";
    return "review";
  };
  const stages: Overview["stages"] = [
    { key: "identity", label: "身份待确认", count: 0 },
    { key: "evidence", label: "证据待完善", count: 0 },
    { key: "review", label: "律师复核中", count: 0 },
    { key: "recorded", label: "记录已完备", count: 0 },
    { key: "closed", label: "不承接结案", count: 0 },
  ];
  const queue: Overview["queue"] = [];
  const issues: Overview["issues"] = [];
  const activity: Overview["activity"] = [];
  const totals: Overview["totals"] = {
    cases: input.matters.length,
    active: 0,
    pendingFindings: 0,
    openIssues: 0,
    staleIssues: 0,
    openTasks: 0,
    documents: 0,
    versions: 0,
    pages: 0,
    authorizedLatest: 0,
  };
  const documents = new Set<string>();
  for (const { matter: m, issues: is, materials: ms } of input.matters) {
    const stage = stageOf(m);
    stages.find((s) => s.key === stage)!.count++;
    const pending = is.filter((i) => i.effectiveStatus !== "resolved");
    const stale = pending.filter((i) => i.effectiveStatus === "stale").length;
    queue.push({
      id: m.id,
      name: m.name,
      updatedAt: m.updatedAt,
      stage,
      pendingFindings: m.progress.pendingFindings,
      openTasks: m.progress.openTasks,
      openIssues: pending.length,
      staleIssues: stale,
      confirmed: m.progress.confirmed,
      parties: m.progress.total,
    });
    if (!ended(m)) {
      totals.active++;
      totals.pendingFindings += m.progress.pendingFindings;
      totals.openTasks += m.progress.openTasks;
      totals.openIssues += pending.length;
      totals.staleIssues += stale;
      pending.forEach((i) =>
        issues.push({
          id: i.id,
          caseId: m.id,
          caseName: m.name,
          title: i.title,
          status: i.effectiveStatus,
          owner: i.owner,
          updatedAt: i.updatedAt,
        }),
      );
    }
    const created = Date.parse(m.createdAt);
    if (created >= start && created <= end)
      buckets.get(dateKey(created))!.cases++;
    ms.forEach((v) => {
      documents.add(`${m.id}:${v.documentId}`);
      totals.versions++;
      totals.pages += v.pageCount;
      if (v.latest && v.modelAllowed) totals.authorizedLatest++;
    });
    m.activity.forEach((a) =>
      activity.push({ ...a, caseId: m.id, caseName: m.name }),
    );
  }
  totals.documents = documents.size;
  queue.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  issues.sort(
    (a, b) =>
      Number(b.status === "stale") - Number(a.status === "stale") ||
      b.updatedAt.localeCompare(a.updatedAt),
  );
  activity.sort((a, b) => b.at.localeCompare(a.at));
  return {
    generatedAt: now.toISOString(),
    period: {
      days,
      start: new Date(start).toISOString(),
      end: now.toISOString(),
      timeZone: "Asia/Shanghai",
    },
    totals,
    stages,
    queue,
    issues,
    activity: activity.slice(0, 20),
    trend,
    tools: {
      total: calls.length,
      success: calls.filter((t) => t.status === "success").length,
      errors: calls.filter((t) => t.status === "error").length,
      model: calls.filter((t) => t.initiator === "model").length,
      rules: calls.filter((t) => t.initiator === "rules").length,
      user: calls.filter((t) => t.initiator === "user").length,
      connectors: input.connectors.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        connected: c.connected,
        enabledTools: c.tools.filter((t) => t.enabled !== false).length,
        calls: calls.filter((t) => t.connector === c.id).length,
        errors: calls.filter(
          (t) => t.connector === c.id && t.status === "error",
        ).length,
      })),
    },
  };
}
