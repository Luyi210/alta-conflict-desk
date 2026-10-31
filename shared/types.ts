export type ConnectorId = "gleif" | "ledger" | "documents";
export type ToolInfo = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  enabled?: boolean;
  readOnly?: boolean;
};
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
  review: "pending" | "escalated" | "retained" | "dismissed";
  reviewNote: string;
  reviewedAt?: string;
};
export type ModelBrief = {
  summary: string;
  citedTraceIds: string[];
  facts?: { text: string; traceIds: string[] }[];
  questions?: { text: string; traceIds: string[] }[];
  nextSteps?: { text: string; traceIds: string[] }[];
};
export type Run = {
  id: string;
  matterName: string;
  prospectiveClient: string;
  context?: string;
  jurisdiction?: string;
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
  modelBrief?: ModelBrief;
  error?: string;
  modelExecution?: {
    status: "running" | "completed" | "failed";
    model: string;
    toolCallCount: number;
    rounds: number;
    error?: string;
  };
};
export type RunInput = {
  matterName: string;
  prospectiveClient: string;
  context?: string;
  jurisdiction?: string;
  partyRole: string;
  entity: Entity;
  mode: "rules" | "ai";
};
export type AppStatus = {
  connectors: Connector[];
  model: { configured: boolean; model: string; modeLabel: string };
  ledger: { count: number; synthetic: true };
};

export type PartyRole = "拟委托人" | "交易对方" | "担保方" | "其他相关方";
export type CaseParty = {
  id: string;
  name: string;
  role: PartyRole;
  confirmed: boolean;
  entity?: Entity;
  runId?: string;
};
export type CaseInput = {
  name: string;
  context: string;
  jurisdiction: string;
  mode: "rules" | "ai";
  parties: CaseParty[];
};
export type CaseTask = {
  id: string;
  kind: "identity" | "coverage" | "scope" | "confidentiality";
  title: string;
  description: string;
  partyIds: string[];
  required: boolean;
  systemManaged: boolean;
  status: "open" | "resolved";
  note: string;
  reference: string;
  updatedAt?: string;
};
export type CaseDecision = {
  status:
    | "draft"
    | "needs-information"
    | "needs-partner-review"
    | "review-recorded"
    | "declined";
  note: string;
  reviewer: string;
  recordedAt?: string;
  invalidatedAt?: string;
  revision: number;
};
export type CaseActivity = {
  id: string;
  at: string;
  type: string;
  message: string;
};
export type CaseFile = {
  id: string;
  name: string;
  context: string;
  jurisdiction: string;
  mode: "rules" | "ai";
  createdAt: string;
  updatedAt: string;
  revision: number;
  parties: CaseParty[];
  tasks: CaseTask[];
  decision: CaseDecision;
  activity: CaseActivity[];
};
export type CaseView = CaseFile & {
  runs: Run[];
  status:
    | "running"
    | "needs-attention"
    | "ready-for-review"
    | "recorded"
    | "closed";
  blockers: string[];
  progress: {
    total: number;
    confirmed: number;
    completed: number;
    findings: number;
    pendingFindings: number;
    openTasks: number;
  };
};
export type CatalogTool = ToolInfo & {
  connector: ConnectorId;
  available: boolean;
  enabled: boolean;
  readOnly: boolean;
  inputSchema: Record<string, unknown>;
};
export type ToolExecution = {
  id: string;
  connector: ConnectorId;
  tool: string;
  args: Record<string, unknown>;
  status: "queued" | "running" | "success" | "error";
  createdAt: string;
  completedAt?: string;
  trace?: Trace;
  error?: string;
  retryOf?: string;
};
