import type { Trace } from "./types.ts";

export type Material = {
  id: string;
  caseId: string;
  documentId: string;
  version: number;
  title: string;
  sha256: string;
  createdAt: string;
  pageCount: number;
  size: number;
  modelAllowed: boolean;
  latest: boolean;
};
export type MaterialPage = { material: Material; page: number; text: string };
export type MaterialCitation = {
  versionId: string;
  page: number;
  quote: string;
  traceId: string;
};
export type MaterialReview = {
  id: string;
  caseId: string;
  createdAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  model: string;
  question: string;
  versionIds: string[];
  traces: Trace[];
  rounds: number;
  formatRetries?: number;
  formatIssues?: string[];
  error?: string;
  items: { question: string; citations: MaterialCitation[] }[];
};
export type MaterialEvidence = {
  id: string;
  caseId: string;
  versionId: string;
  page: number;
  quote: string;
  note: string;
  taskId?: string;
  createdAt: string;
};
export type MaterialsSnapshot = {
  materials: Material[];
  reviews: MaterialReview[];
  evidence: MaterialEvidence[];
  connected: boolean;
  tools: { name: string; enabled: boolean }[];
};
