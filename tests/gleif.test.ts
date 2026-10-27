import { test } from "node:test";
import assert from "node:assert/strict";
import { searchEntities, getRelationships } from "../mcp/gleif-api.ts";

const lei = "MP6I5ZYZBEU3UXPYFY54";
const publicRecord = {
  id: lei,
  attributes: {
    entity: {
      legalName: { name: "HSBC BANK PLC" },
      jurisdiction: "GB",
      status: "ACTIVE",
    },
  },
};
test("a LEI search uses the exact entity endpoint and normalizes letter case", async () => {
  const fetcher = (async (url: string) => {
    assert.equal(url, `https://api.gleif.org/api/v1/lei-records/${lei}`);
    return Response.json({ data: publicRecord });
  }) as typeof fetch;
  const result = await searchEntities(lei.toLowerCase(), fetcher);
  assert.equal(result.entities.length, 1);
  assert.equal(result.entities[0].lei, lei);
});
test("missing exact LEI returns no candidates; service failures are not disguised as no match", async () => {
  assert.equal(
    (
      await searchEntities(
        lei,
        (async () => new Response("", { status: 404 })) as typeof fetch,
      )
    ).entities.length,
    0,
  );
  await assert.rejects(
    searchEntities(
      lei,
      (async () => new Response("", { status: 503 })) as typeof fetch,
    ),
    /503/,
  );
});
test("name search preserves the legal-name filter and unavailable parent data remains an explicit gap", async () => {
  const fetcher = (async (url: string) => {
    assert.equal(
      new URL(url).searchParams.get("filter[entity.legalName]"),
      "HSBC BANK PLC",
    );
    return Response.json({ data: [publicRecord] });
  }) as typeof fetch;
  assert.equal(
    (await searchEntities("HSBC BANK PLC", fetcher)).entities.length,
    1,
  );
  const result = await getRelationships(
    lei,
    (async () => new Response("", { status: 404 })) as typeof fetch,
  );
  assert.equal(result.relations.length, 0);
  assert.equal(result.gaps.length, 2);
  assert.ok(result.gaps.every((gap) => gap.includes("未完成")));
});
