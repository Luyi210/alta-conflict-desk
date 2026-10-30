// GLEIF's dual-stack endpoint can stall on IPv6 on local networks where IPv4 works.
// Apply only to the isolated GLEIF process; keep IPv6 fallback and TLS validation.
export const gleifNodeNetworkArgs = [
  "--dns-result-order=ipv4first",
  "--network-family-autoselection-attempt-timeout=2000",
];

export type SourceAttempt = {
  number: number;
  startedAt: string;
  durationMs: number;
  status?: number;
  error?: string;
};
export type SourceRequest = {
  url: string;
  attempts: SourceAttempt[];
  durationMs: number;
};

export function transientNetworkError(error: unknown) {
  const e = error as {
    name?: string;
    cause?: { code?: string };
    code?: string;
  };
  return (
    e?.name === "TimeoutError" ||
    [
      "UND_ERR_CONNECT_TIMEOUT",
      "UND_ERR_HEADERS_TIMEOUT",
      "UND_ERR_BODY_TIMEOUT",
      "UND_ERR_SOCKET",
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "EAI_AGAIN",
      "ENETUNREACH",
      "EHOSTUNREACH",
    ].includes(e?.cause?.code || e?.code || "")
  );
}

export function retryDelay(
  status: number | undefined,
  retryAfter: string | null,
  attempt: number,
  now = Date.now(),
): number | undefined {
  if (status !== undefined && ![408, 429, 500, 502, 503, 504].includes(status))
    return undefined;
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const ms =
      Number.isFinite(seconds) && seconds >= 0
        ? seconds * 1000
        : Date.parse(retryAfter) - now;
    // Never retry sooner than the service asks; long rate limits must surface to the caller.
    if (Number.isFinite(ms) && ms > 5000) return undefined;
    if (Number.isFinite(ms)) return Math.max(0, ms);
  }
  return Math.min(1000, 300 * attempt);
}
