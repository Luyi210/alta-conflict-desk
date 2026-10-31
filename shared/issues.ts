import type {
  Material,
  MaterialReview,
  MaterialEvidence,
} from "./materials.ts";
import type { Trace } from "./types.ts";

export const issueCategories = {
  scope: "委托范围",
  boundary: "客户边界",
  confidentiality: "保密义务",
  other: "其他核实问题",
};
export const issueStates = {
  open: "待核实",
  reviewing: "复核中",
  resolved: "已记录处理意见",
  stale: "材料变化待复核",
};
export const citationRelations = {
  support: "支持依据",
  contradict: "矛盾依据",
  context: "背景依据",
};
export type IssueCitation = {
  id: string;
  versionId: string;
  page: number;
  quote: string;
  relation: keyof typeof citationRelations;
};
export type IssueReview = {
  id: string;
  at: string;
  reviewer: string;
  note: string;
  basis: IssueCitation[];
  versions: { documentId: string; versionId: string; sha256: string }[];
};
export type ReviewIssue = {
  id: string;
  caseId: string;
  revision: number;
  title: string;
  category: keyof typeof issueCategories;
  partyIds: string[];
  taskId?: string;
  sourceKey?: string;
  owner: string;
  missing: string;
  note: string;
  status: "open" | "reviewing" | "resolved";
  citations: IssueCitation[];
  reviews: IssueReview[];
  createdAt: string;
  updatedAt: string;
};
export type IssueImpact = {
  documentId: string;
  from: Material;
  to: Material;
  citationIds: string[];
  previousOpinion?: IssueReview;
};
export type IssueView = ReviewIssue & {
  effectiveStatus: keyof typeof issueStates;
  impacts: IssueImpact[];
};
export type IssueSnapshot = {
  issues: IssueView[];
  materials: Material[];
  reviews: MaterialReview[];
  evidence: MaterialEvidence[];
  caseRevision: number;
};
export type MaterialComparison = {
  from: Material;
  to: Material;
  affectedIssueIds: string[];
  changedPages: number;
  pages: {
    page: number;
    before: string;
    after: string;
    changed: boolean;
    truncatedDiff: boolean;
    changes: { value: string; added?: boolean; removed?: boolean }[];
  }[];
  traces: Trace[];
};
