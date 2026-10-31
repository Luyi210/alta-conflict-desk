import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoute, routeHash } from "../src/navigation.ts";
import { parseIntakeDraft } from "../src/intake-draft.ts";

test("case deep links retain the parent, run and review tab; malformed IDs cannot become API paths", () => {
  const route = {
    page: "workspace" as const,
    caseId: "matter-123",
    runId: "run-456",
    tab: "tasks" as const,
  };
  assert.deepEqual(parseRoute(routeHash(route)), route);
  assert.deepEqual(parseRoute("#/new"), { page: "new" });
  assert.deepEqual(parseRoute(routeHash({ page: "overview" })), {
    page: "overview",
  });
  assert.deepEqual(parseRoute("#/runs/previous-run"), {
    page: "workspace",
    runId: "previous-run",
  });
  assert.deepEqual(parseRoute("#/cases/%2F..%2Fsecret"), { page: "workspace" });
  assert.equal(parseRoute("#/cases/matter-123?tab=unexpected").tab, "parties");
});

test("intake draft recovery rejects broken storage and ungrounded confirmed identities, preserving valid unconfirmed drafts", () => {
  assert.equal(parseIntakeDraft("{broken"), undefined);
  assert.equal(parseIntakeDraft(null), undefined);
  const draft = {
    version: 1,
    step: 2,
    savedAt: "2026-10-30T14:00:00Z",
    value: {
      name: "Test matter",
      context: "Test scope",
      jurisdiction: "GB",
      mode: "rules",
      parties: [
        {
          id: "one",
          name: "Pending entity",
          role: "拟委托人",
          confirmed: false,
        },
      ],
    },
  };
  assert.deepEqual(parseIntakeDraft(JSON.stringify(draft)), draft);
  draft.value.parties[0].confirmed = true;
  assert.equal(parseIntakeDraft(JSON.stringify(draft)), undefined);
  draft.value.parties[0].confirmed = false;
  draft.step = 99;
  assert.equal(parseIntakeDraft(JSON.stringify(draft)), undefined);
});
