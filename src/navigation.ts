import { useEffect, useState } from "react";

export type Page =
  | "overview"
  | "workspace"
  | "new"
  | "tools"
  | "connectors"
  | "history"
  | "about";
export type CaseTab =
  | "assistant"
  | "parties"
  | "tasks"
  | "review"
  | "activity"
  | "materials"
  | "issues";
export type Route = {
  page: Page;
  caseId?: string;
  runId?: string;
  tab?: CaseTab;
};
const pages: Record<string, Page> = {
  overview: "overview",
  cases: "workspace",
  new: "new",
  tools: "tools",
  connectors: "connectors",
  history: "history",
  about: "about",
};
const tabs: CaseTab[] = [
  "assistant",
  "parties",
  "tasks",
  "review",
  "activity",
  "materials",
  "issues",
];
export function parseRoute(hash: string): Route {
  const [path, query] = hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/");
  const validId = (s?: string) =>
    Boolean(s && /^[a-zA-Z0-9_-]{1,200}$/.test(s));
  const tab = new URLSearchParams(query).get("tab") as CaseTab;
  if (parts[0] === "cases" && validId(parts[1]))
    return {
      page: "workspace",
      caseId: parts[1],
      ...(parts[2] === "runs" && validId(parts[3]) ? { runId: parts[3] } : {}),
      tab: tabs.includes(tab) ? tab : "parties",
    };
  if (parts[0] === "runs" && validId(parts[1]))
    return { page: "workspace", runId: parts[1] };
  return { page: pages[parts[0]] || "workspace" };
}
export function routeHash(route: Route) {
  const tab = route.tab && route.tab !== "parties" ? `?tab=${route.tab}` : "";
  if (route.caseId)
    return `#/cases/${route.caseId}${route.runId ? `/runs/${route.runId}` : ""}${tab}`;
  if (route.runId) return `#/runs/${route.runId}`;
  return `#/${route.page === "workspace" ? "cases" : route.page}`;
}
export function useAppRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const go = (next: Route) => {
    const hash = routeHash(next);
    if (window.location.hash !== hash) window.location.hash = hash;
    setRoute(next);
  };
  return { route, go };
}
