import { DatabaseSync } from "node:sqlite";
import { resolve, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { matchMatters, type MatterRow } from "../server/matching.ts";

// Opening with readOnly=true enforces the tool boundary at the database level.
const db = new DatabaseSync(
  join(resolve(process.env.DATA_DIR || "data"), "ledger.sqlite"),
  { readOnly: true },
);
const server = new McpServer({
  name: "conflict-desk-ledger",
  version: "0.1.0",
});
const result = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
});
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
};
server.registerTool(
  "ledger_info",
  {
    description:
      "Read the count and provenance of the strictly synthetic local law-firm engagement ledger.",
    inputSchema: {},
    annotations,
  },
  async () =>
    result({
      count: (
        db.prepare("SELECT count(*) n FROM matters").get() as { n: number }
      ).n,
      synthetic: true,
      provenance: "本地虚构律所委托台账，仅供演示；不代表任何真实客户关系。",
      permissions: "read-only",
    }),
);
server.registerTool(
  "search_matters",
  {
    description:
      "Match a confirmed entity against synthetic firm matters. Exact LEI is identity evidence; name-only or similar matches require human identity review.",
    inputSchema: {
      name: z.string().trim().min(2).max(300),
      lei: z
        .string()
        .regex(/^[A-Z0-9]{20}$/)
        .optional(),
    },
    annotations,
  },
  async ({ name, lei }) => {
    const rows = db
      .prepare("SELECT * FROM matters")
      .all() as unknown as MatterRow[];
    return result({
      matches: matchMatters(rows, name, lei),
      synthetic: true,
      coverage: "仅比对本地演示台账；非完整律所客户数据库。",
    });
  },
);
await server.connect(new StdioServerTransport());
