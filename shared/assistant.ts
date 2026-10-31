import type { Material, MaterialCitation, MaterialReview } from "./materials";
import type { IssueView, ReviewIssue } from "./issues";

export type AssistantAction = {
  title: string;
  priority: "first" | "next";
  reason: string;
  missing: string;
  request: string;
  category: ReviewIssue["category"];
  partyIds: string[];
  targetIssueId: string | null;
  citations: MaterialCitation[];
};
export type AssistantRun = MaterialReview & {
  caseRevision: number;
  basisRevision: number;
  issueIds: string[];
  partyIds: string[];
  summary: string;
  actions: AssistantAction[];
  applications: Record<string, string>;
  adoptedDrafts?: Record<string, { missing: string; request: string }>;
};
export type AssistantSnapshot = {
  runs: AssistantRun[];
  materials: Material[];
  issues: IssueView[];
  caseRevision: number;
  model: { configured: boolean; name: string };
  ready: boolean;
};
