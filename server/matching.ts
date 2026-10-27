import type { LedgerMatch } from "../shared/types.ts";

export const normalizeName = (name: string) =>
  name
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const corporateWords = new Set([
  "PLC",
  "LIMITED",
  "LTD",
  "INC",
  "LLC",
  "CO",
  "CORPORATION",
  "COMPANY",
  "THE",
]);
export function nameSimilarity(a: string, b: string) {
  const aa = new Set(
    normalizeName(a)
      .split(" ")
      .filter((w) => !corporateWords.has(w)),
  );
  const bb = new Set(
    normalizeName(b)
      .split(" ")
      .filter((w) => !corporateWords.has(w)),
  );
  if (!aa.size || !bb.size) return 0;
  const overlap = [...aa].filter((w) => bb.has(w)).length;
  return overlap / Math.max(aa.size, bb.size);
}
export type MatterRow = Omit<LedgerMatch, "matchType" | "matchedName">;
export function matchMatters(
  rows: MatterRow[],
  name: string,
  lei?: string,
): LedgerMatch[] {
  return rows.flatMap((row) => {
    const exactLei = !!lei && row.lei === lei;
    const exactName = normalizeName(row.clientName) === normalizeName(name);
    const similar = nameSimilarity(name, row.clientName) >= 0.6;
    if (!exactLei && !exactName && !similar) return [];
    return [
      {
        ...row,
        matchType: exactLei
          ? ("exact-lei" as const)
          : exactName
            ? ("exact-name" as const)
            : ("similar-name" as const),
        matchedName: name,
      },
    ];
  });
}
