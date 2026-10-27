export type ConnectorId = "gleif" | "ledger";
export type ToolInfo = { name: string; description: string };
export type Connector = {
  id: ConnectorId;
  name: string;
  connected: boolean;
  status: "connected" | "disconnected" | "error";
  tools: ToolInfo[];
  lastTestAt?: string;
  error?: string;
};
export type Entity = {
  lei: string;
  name: string;
  jurisdiction: string;
  status: string;
  address: string;
  sourceUrl: string;
  fetchedAt: string;
};
export type Relation = {
  type: "direct-parent" | "ultimate-parent";
  entity: Entity;
  sourceUrl: string;
  fetchedAt: string;
};
export type Trace = {
  id: string;
  connector: ConnectorId;
  tool: string;
  args: Record<string, unknown>;
  startedAt: string;
  durationMs: number;
  status: "success" | "error";
  result?: unknown;
  error?: string;
  initiator?: "rules" | "model" | "user";
};
export type LedgerMatch = {
  id: string;
  clientName: string;
  lei: string | null;
  matterName: string;
  matterRef: string;
  role: string;
  relationship: string;
  status: string;
  partner: string;
  matchType: "exact-lei" | "exact-name" | "similar-name";
  matchedName: string;
  note: string;
};
export type Finding = {
  id: string;
  type: "direct" | "related" | "similar";
  title: string;
  summary: string;
  entity: Entity;
  relation?: Relation;
  match: LedgerMatch;
  evidenceTraceIds: string[];
  review: "pending" | "escalated" | "dismissed";
  reviewNote: string;
  reviewedAt?: string;
};
export type Run = {
  id: string;
  matterName: string;
  prospectiveClient: string;
  partyRole: string;
  entity: Entity;
  mode: "rules" | "ai";
  status: "running" | "completed" | "partial" | "failed";
  createdAt: string;
  completedAt?: string;
  findings: Finding[];
  relations: Relation[];
  traces: Trace[];
  gaps: string[];
  summary: string;
  modelSummary?: string;
  error?: string;
};
export type RunInput = {
  matterName: string;
  prospectiveClient: string;
  partyRole: string;
  entity: Entity;
  mode: "rules" | "ai";
};
export type AppStatus = {
  connectors: Connector[];
  model: { configured: boolean; model: string; modeLabel: string };
  ledger: { count: number; synthetic: true };
};
