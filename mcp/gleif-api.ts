import type { Entity, Relation } from "../shared/types.ts";
import { setTimeout as delay } from "node:timers/promises";
import {
  retryDelay,
  transientNetworkError,
  type SourceRequest,
} from "./network-policy.ts";

const base = "https://api.gleif.org/api/v1/lei-records";
const timeout = Math.min(
  60000,
  Math.max(1000, Number(process.env.PUBLIC_API_TIMEOUT_MS) || 20000),
);
type RecordData = {
  id: string;
  attributes: {
    entity: {
      legalName: { name: string };
      jurisdiction?: string;
      status?: string;
      legalAddress?: {
        addressLines?: string[];
        city?: string;
        country?: string;
      };
    };
    registration?: { status?: string };
  };
};
class GleifHttpError extends Error {
  requestReceipt?: SourceRequest;
  constructor(public status: number) {
    super(`GLEIF HTTP ${status}${status === 404 ? ": 未提供该记录/关系" : ""}`);
  }
}
async function request(url: string, fetcher: typeof fetch = fetch) {
  const started = Date.now();
  // Both attempts, response bodies and backoff fit inside the host's 65s MCP deadline.
  const deadline = started + Math.min(60000, timeout * 2 + 1000);
  const receipt: SourceRequest = { url, attempts: [], durationMs: 0 };
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const began = Date.now();
    let status: number | undefined;
    let retryAfter: string | null = null;
    try {
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(
          Math.max(1, Math.min(timeout, deadline - began)),
        ),
        redirect: "error",
        headers: {
          Accept: "application/vnd.api+json",
          "User-Agent": "AltaConflictDeskPrototype/0.3",
        },
      });
      status = response.status;
      retryAfter = response.headers.get("retry-after");
      if (!response.ok) {
        await response.body?.cancel();
        throw new GleifHttpError(status);
      }
      const body = await response.json();
      receipt.attempts.push({
        number: attempt,
        startedAt: new Date(began).toISOString(),
        durationMs: Date.now() - began,
        status,
      });
      receipt.durationMs = Date.now() - started;
      return { body, receipt };
    } catch (error) {
      lastError = error;
      const e = error as Error & { cause?: { code?: string }; code?: string };
      receipt.attempts.push({
        number: attempt,
        startedAt: new Date(began).toISOString(),
        durationMs: Date.now() - began,
        ...(status === undefined ? {} : { status }),
        error: e.cause?.code || e.code || e.name,
      });
      const retryable =
        error instanceof GleifHttpError || transientNetworkError(error);
      const waitMs = retryable
        ? retryDelay(
            error instanceof GleifHttpError ? status : undefined,
            error instanceof GleifHttpError ? retryAfter : null,
            attempt,
          )
        : undefined;
      if (
        attempt === 2 ||
        waitMs === undefined ||
        Date.now() + waitMs >= deadline
      )
        break;
      await delay(waitMs);
    }
  }
  receipt.durationMs = Date.now() - started;
  if (lastError instanceof GleifHttpError) {
    lastError.requestReceipt = receipt;
    throw lastError;
  }
  const e = lastError as Error & { cause?: { code?: string }; code?: string };
  const message =
    e.name === "TimeoutError"
      ? `GLEIF 请求超时（单次上限 ${timeout / 1000} 秒）`
      : `GLEIF 查询失败：${e.message}${e.cause?.code ? ` (${e.cause.code})` : ""}`;
  throw Object.assign(
    new Error(`${message}；已尝试 ${receipt.attempts.length} 次`),
    { requestReceipt: receipt },
  );
}
function entity(data: RecordData, sourceUrl: string): Entity {
  if (!data?.id || !data.attributes?.entity?.legalName?.name)
    throw new Error("GLEIF 返回了无法识别的主体记录");
  const e = data.attributes.entity;
  return {
    lei: data.id,
    name: e.legalName.name,
    jurisdiction: e.jurisdiction || e.legalAddress?.country || "未知",
    status: e.status || data.attributes.registration?.status || "未知",
    address: [
      ...(e.legalAddress?.addressLines || []),
      e.legalAddress?.city,
      e.legalAddress?.country,
    ]
      .filter(Boolean)
      .join(", "),
    sourceUrl,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getEntity(lei: string, fetcher: typeof fetch = fetch) {
  const { body, receipt } = await request(`${base}/${lei}`, fetcher);
  return { entity: entity(body.data, `${base}/${lei}`), network: [receipt] };
}
export async function searchEntities(
  query: string,
  fetcher: typeof fetch = fetch,
) {
  const coverage = "仅覆盖 GLEIF LEI 注册主体；无结果不代表主体不存在。";
  const normalized = query.trim().toUpperCase();
  if (/^[A-Z0-9]{20}$/.test(normalized)) {
    try {
      const result = await getEntity(normalized, fetcher);
      return { entities: [result.entity], coverage, network: result.network };
    } catch (error) {
      if (error instanceof GleifHttpError && error.status === 404)
        return {
          entities: [],
          coverage,
          network: error.requestReceipt ? [error.requestReceipt] : [],
        };
      throw error;
    }
  }
  const url = new URL(base);
  url.searchParams.set("filter[entity.legalName]", query.trim());
  url.searchParams.set("page[size]", "12");
  const { body: json, receipt } = await request(url.toString(), fetcher);
  return {
    entities: (json.data || []).map((r: RecordData) =>
      entity(r, `${base}/${r.id}`),
    ),
    coverage,
    network: [receipt],
  };
}
export async function getRelationships(
  lei: string,
  fetcher: typeof fetch = fetch,
) {
  const relations: Relation[] = [];
  const gaps: string[] = [];
  const network: SourceRequest[] = [];
  await Promise.all(
    (["direct-parent", "ultimate-parent"] as const).map(async (type) => {
      const sourceUrl = `${base}/${lei}/${type}`;
      try {
        const { body: json, receipt } = await request(sourceUrl, fetcher);
        network.push(receipt);
        if (!json.data || Array.isArray(json.data)) {
          gaps.push(
            `GLEIF 未披露${type === "direct-parent" ? "直接" : "最终"}母公司；不能据此认定无关联。`,
          );
          return;
        }
        relations.push({
          type,
          entity: entity(json.data, `${base}/${json.data.id}`),
          sourceUrl,
          fetchedAt: new Date().toISOString(),
        });
      } catch (e) {
        const receipt = (e as { requestReceipt?: SourceRequest })
          .requestReceipt;
        if (receipt) network.push(receipt);
        gaps.push(
          `${type === "direct-parent" ? "直接母公司" : "最终母公司"}查询未完成：${(e as Error).message}`,
        );
      }
    }),
  );
  relations.sort((a, b) => a.type.localeCompare(b.type));
  return {
    relations,
    gaps,
    network: network.sort((a, b) => a.url.localeCompare(b.url)),
    coverage:
      "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。",
  };
}
