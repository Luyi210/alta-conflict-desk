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

test("transient connection failures retry once and retain both attempt receipts", async () => {
  let calls = 0;
  const fetcher = (async () => {
    calls++;
    if (calls === 1)
      throw new TypeError("fetch failed", {
        cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
      });
    return Response.json({ data: publicRecord });
  }) as typeof fetch;
  const result = await searchEntities(lei, fetcher);
  assert.equal(calls, 2);
  assert.equal(result.entities[0].lei, lei);
  assert.equal(result.network[0].attempts.length, 2);
  assert.equal(result.network[0].attempts[0].error, "UND_ERR_CONNECT_TIMEOUT");
  assert.equal(result.network[0].attempts[1].status, 200);
});

test("a transient body interruption after HTTP 200 retries instead of treating headers as a complete response", async () => {
  let calls = 0;
  const result = await searchEntities(lei, (async () => {
    calls++;
    if (calls === 1) {
      const response = Response.json({ data: publicRecord });
      response.json = async () => {
        throw new TypeError("terminated", {
          cause: { code: "UND_ERR_SOCKET" },
        });
      };
      return response;
    }
    return Response.json({ data: publicRecord });
  }) as typeof fetch);
  assert.equal(calls, 2);
  assert.equal(result.network[0].attempts[0].status, 200);
  assert.equal(result.network[0].attempts[0].error, "UND_ERR_SOCKET");
  assert.equal(result.network[0].attempts[1].error, undefined);
});

test("retryable HTTP errors can recover; 404, malformed bodies, TLS errors and long Retry-After are not retried", async () => {
  let calls = 0;
  const recovered = await searchEntities(lei, (async () => {
    calls++;
    return calls === 1
      ? new Response("", { status: 503, headers: { "Retry-After": "0" } })
      : Response.json({ data: publicRecord });
  }) as typeof fetch);
  assert.equal(calls, 2);
  assert.deepEqual(
    recovered.network[0].attempts.map((a) => a.status),
    [503, 200],
  );
  for (const scenario of ["missing", "malformed", "tls", "rate-limit"]) {
    calls = 0;
    const request = () =>
      searchEntities(lei, (async () => {
        calls++;
        if (scenario === "missing") return new Response("", { status: 404 });
        if (scenario === "malformed")
          return new Response("not JSON", { status: 200 });
        if (scenario === "tls")
          throw new TypeError("certificate failed", {
            cause: { code: "CERT_HAS_EXPIRED" },
          });
        return new Response("", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }) as typeof fetch);
    if (scenario === "missing")
      assert.equal((await request()).entities.length, 0);
    else await assert.rejects(request);
    assert.equal(calls, 1, scenario);
  }
});

test("repeated transient failure stays bounded and relation failures remain explicit gaps", async () => {
  let calls = 0;
  await assert.rejects(
    searchEntities(lei, (async () => {
      calls++;
      throw new TypeError("fetch failed", { cause: { code: "ECONNRESET" } });
    }) as typeof fetch),
    /已尝试 2 次/,
  );
  assert.equal(calls, 2);
  const result = await getRelationships(
    lei,
    (async () =>
      new Response("", {
        status: 503,
        headers: { "Retry-After": "0" },
      })) as typeof fetch,
  );
  assert.equal(result.relations.length, 0);
  assert.equal(result.gaps.length, 2);
  assert.equal(result.network.length, 2);
  assert.ok(result.network.every((request) => request.attempts.length === 2));
});
