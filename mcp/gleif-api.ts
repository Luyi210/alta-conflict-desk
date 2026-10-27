import type { Entity, Relation } from "../shared/types.ts";

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
  constructor(public status: number) {
    super(`GLEIF HTTP ${status}${status === 404 ? ": 未提供该记录/关系" : ""}`);
  }
}
async function request(url: string, fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(timeout),
      headers: {
        Accept: "application/vnd.api+json",
        "User-Agent": "AltaConflictDeskPrototype/0.1",
      },
    });
    if (!response.ok) throw new GleifHttpError(response.status);
    return await response.json();
  } catch (error) {
    if (error instanceof GleifHttpError) throw error;
    const e = error as Error & { cause?: { code?: string } };
    throw new Error(
      e.name === "TimeoutError"
        ? `GLEIF 请求超时（${timeout / 1000} 秒）`
        : `GLEIF 查询失败：${e.message}${e.cause?.code ? ` (${e.cause.code})` : ""}`,
    );
  }
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
  return {
    entity: entity(
      (await request(`${base}/${lei}`, fetcher)).data,
      `${base}/${lei}`,
    ),
  };
}
export async function searchEntities(
  query: string,
  fetcher: typeof fetch = fetch,
) {
  const coverage = "仅覆盖 GLEIF LEI 注册主体；无结果不代表主体不存在。";
  const normalized = query.trim().toUpperCase();
  if (/^[A-Z0-9]{20}$/.test(normalized)) {
    try {
      return {
        entities: [(await getEntity(normalized, fetcher)).entity],
        coverage,
      };
    } catch (error) {
      if (error instanceof GleifHttpError && error.status === 404)
        return { entities: [], coverage };
      throw error;
    }
  }
  const url = new URL(base);
  url.searchParams.set("filter[entity.legalName]", query.trim());
  url.searchParams.set("page[size]", "12");
  const json = await request(url.toString(), fetcher);
  return {
    entities: (json.data || []).map((r: RecordData) =>
      entity(r, `${base}/${r.id}`),
    ),
    coverage,
  };
}
export async function getRelationships(
  lei: string,
  fetcher: typeof fetch = fetch,
) {
  const relations: Relation[] = [];
  const gaps: string[] = [];
  await Promise.all(
    (["direct-parent", "ultimate-parent"] as const).map(async (type) => {
      const sourceUrl = `${base}/${lei}/${type}`;
      try {
        const json = await request(sourceUrl, fetcher);
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
    coverage:
      "仅 GLEIF 披露的会计合并口径母公司；不覆盖所有股东、自然人控制、董事或全部关联企业。",
  };
}
