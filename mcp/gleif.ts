import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchEntities, getEntity, getRelationships } from "./gleif-api.ts";

const leiSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{20}$/,
    "LEI must have 20 uppercase alphanumeric characters",
  );
const server = new McpServer({ name: "conflict-desk-gleif", version: "0.1.0" });
const result = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
});
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
};
server.registerTool(
  "search_entities",
  {
    description:
      "Search public GLEIF legal entity records by legal name or exact LEI. Only LEI-registered entities are covered. Human identity confirmation is required.",
    inputSchema: { query: z.string().trim().min(2).max(200) },
    annotations,
  },
  async ({ query }) => result(await searchEntities(query)),
);
server.registerTool(
  "get_entity",
  {
    description:
      "Get the current public legal entity identity by its exact LEI; does not determine legal conflicts.",
    inputSchema: { lei: leiSchema },
    annotations,
  },
  async ({ lei }) => result(await getEntity(lei)),
);
server.registerTool(
  "get_relationships",
  {
    description:
      "Read public direct and ultimate accounting-consolidation parent relationships for a LEI. Gaps are explicit; affiliation is not automatically a legal conflict.",
    inputSchema: { lei: leiSchema },
    annotations,
  },
  async ({ lei }) => result(await getRelationships(lei)),
);
await server.connect(new StdioServerTransport());
