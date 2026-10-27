import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createBackend } from "../server/app.ts";
import type { CatalogTool, Entity, ToolExecution } from "../shared/types.ts";

// Live public GLEIF + real local SQLite MCP. No model is invoked and no credentials are read.
const dir = mkdtempSync(join(tmpdir(), "alta-tool-live-"));
const backend = createBackend(dir);
const server = backend.app.listen(0, "127.0.0.1");
async function request<T>(
  base: string,
  path: string,
  body?: unknown,
  expected = 200,
): Promise<T> {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
  return data as T;
}
try {
  await new Promise<void>((done, fail) => {
    server.once("listening", done);
    server.once("error", fail);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("HTTP server unavailable");
  const base = `http://127.0.0.1:${address.port}`;
  const api = <T>(path: string, body?: unknown, expected = 200) =>
    request<T>(base, path, body, expected);
  const poll = async (id: string) => {
    const deadline = Date.now() + 75000;
    while (Date.now() < deadline) {
      const call = await api<ToolExecution>(`/api/tool-desk/calls/${id}`);
      if (call.status === "success" || call.status === "error") return call;
      await new Promise((done) => setTimeout(done, 150));
    }
    throw new Error("MCP call did not complete within 75 seconds");
  };
  const initial = await api<{ tools: CatalogTool[] }>("/api/tool-desk");
  assert.deepEqual(initial.tools, []);
  for (const id of ["gleif", "ledger"])
    await api(`/api/connectors/${id}/connect`, {});
  const catalog = await api<{ tools: CatalogTool[] }>("/api/tool-desk");
  assert.equal(catalog.tools.length, 5);
  assert.ok(
    catalog.tools.every(
      (tool) => tool.inputSchema.type === "object" && tool.available,
    ),
  );
  const badSchema = await api<{ error: string }>(
    "/api/tool-desk/calls",
    { connector: "gleif", tool: "get_entity", args: { lei: "bad" } },
    400,
  );
  await api("/api/tool-desk/permissions", {
    connector: "gleif",
    tool: "get_entity",
    enabled: false,
  });
  const blocked = await api<{ error: string }>(
    "/api/tool-desk/calls",
    {
      connector: "gleif",
      tool: "get_entity",
      args: { lei: "MP6I5ZYZBEU3UXPYFY54" },
    },
    403,
  );
  await api("/api/tool-desk/permissions", {
    connector: "gleif",
    tool: "get_entity",
    enabled: true,
  });
  const queued = await api<ToolExecution>(
    "/api/tool-desk/calls",
    {
      connector: "gleif",
      tool: "get_entity",
      args: { lei: "MP6I5ZYZBEU3UXPYFY54" },
    },
    201,
  );
  const gleif = await poll(queued.id);
  assert.equal(gleif.status, "success", gleif.error);
  const entity = (gleif.trace?.result as { entity: Entity }).entity;
  assert.equal(entity.lei, "MP6I5ZYZBEU3UXPYFY54");
  assert.equal(gleif.trace?.initiator, "user");
  console.log(
    "PASS live public GLEIF request through the asynchronous tool-desk HTTP API",
  );
  const ledger = new DatabaseSync(join(dir, "ledger.sqlite"));
  let failure: ToolExecution;
  let retry: ToolExecution;
  try {
    // An isolated temporary fixture makes the real SQLite tool fail; production data is untouched.
    ledger.exec(
      "ALTER TABLE matters RENAME TO temporarily_unavailable_matters",
    );
    failure = await poll(
      (
        await api<ToolExecution>(
          "/api/tool-desk/calls",
          { connector: "ledger", tool: "ledger_info", args: {} },
          201,
        )
      ).id,
    );
    assert.equal(failure.status, "error");
    assert.equal(failure.trace?.status, "error");
    ledger.exec(
      "ALTER TABLE temporarily_unavailable_matters RENAME TO matters",
    );
    retry = await poll(
      (
        await api<ToolExecution>(
          `/api/tool-desk/calls/${failure.id}/retry`,
          {},
          201,
        )
      ).id,
    );
    assert.equal(retry.status, "success", retry.error);
    assert.equal(retry.retryOf, failure.id);
    assert.notEqual(retry.id, failure.id);
    assert.equal(
      (await api<ToolExecution>(`/api/tool-desk/calls/${failure.id}`)).status,
      "error",
    );
  } finally {
    ledger.close();
  }
  await api("/api/connectors/gleif/disconnect", {});
  const afterDisconnect = await api<{ tools: CatalogTool[] }>("/api/tool-desk");
  const disconnected = await api<{ error: string }>(
    "/api/tool-desk/calls",
    { connector: "gleif", tool: "get_entity", args: { lei: entity.lei } },
    409,
  );
  assert.equal(
    afterDisconnect.tools.filter((tool) => tool.connector === "gleif").length,
    3,
  );
  assert.ok(
    afterDisconnect.tools
      .filter((tool) => tool.connector === "gleif")
      .every((tool) => !tool.available),
  );
  const artifact = {
    verifiedAt: new Date().toISOString(),
    mode: "manual-tool-desk",
    realMcp: true,
    publicNetworkService: "https://api.gleif.org/api/v1",
    modelRequests: 0,
    aiVerified: false,
    syntheticLedger: true,
    schemasFromToolsList: catalog.tools,
    checks: {
      firstConnectionHasNoInventedSchema: true,
      schemaValidation: badSchema.error,
      permissionRejection: blocked.error,
      disconnectRejection: disconnected.error,
      failureRetryCreatesNewId: true,
      originalFailurePreserved: true,
    },
    testFault:
      "Temporary isolated SQLite table renamed then restored to verify an actual MCP error and successful retry. Production data was not modified.",
    calls: [gleif, failure, retry],
  };
  writeFileSync(
    resolve("docs/TOOL-LIVE-VERIFICATION.json"),
    JSON.stringify(artifact, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        verifiedAt: artifact.verifiedAt,
        realMcp: true,
        aiVerified: false,
        discoveredTools: catalog.tools.length,
        publicEntity: entity.name,
        gleifDurationMs: gleif.trace?.durationMs,
        retryOf: retry.retryOf,
        retryStatus: retry.status,
        report: "docs/TOOL-LIVE-VERIFICATION.json",
      },
      null,
      2,
    ),
  );
} finally {
  await backend.close();
  await new Promise<void>((done) => server.close(() => done()));
  rmSync(dir, { recursive: true, force: true });
}
