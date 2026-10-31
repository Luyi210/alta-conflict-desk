import type { Connector } from "./types";

export type OverviewStage =
  | "identity"
  | "evidence"
  | "review"
  | "recorded"
  | "closed";
export type Overview = {
  generatedAt: string;
  period: {
    days: 7 | 30;
    start: string;
    end: string;
    timeZone: "Asia/Shanghai";
  };
  totals: {
    cases: number;
    active: number;
    pendingFindings: number;
    openIssues: number;
    staleIssues: number;
    openTasks: number;
    documents: number;
    versions: number;
    pages: number;
    authorizedLatest: number;
  };
  stages: { key: OverviewStage; label: string; count: number }[];
  queue: {
    id: string;
    name: string;
    updatedAt: string;
    stage: OverviewStage;
    pendingFindings: number;
    openTasks: number;
    openIssues: number;
    staleIssues: number;
    confirmed: number;
    parties: number;
  }[];
  issues: {
    id: string;
    caseId: string;
    caseName: string;
    title: string;
    status: string;
    owner: string;
    updatedAt: string;
  }[];
  activity: {
    id: string;
    caseId: string;
    caseName: string;
    at: string;
    message: string;
  }[];
  trend: { date: string; cases: number; calls: number; errors: number }[];
  tools: {
    total: number;
    success: number;
    errors: number;
    model: number;
    rules: number;
    user: number;
    connectors: {
      id: Connector["id"];
      name: string;
      connected: boolean;
      status: Connector["status"];
      enabledTools: number;
      calls: number;
      errors: number;
    }[];
  };
};
