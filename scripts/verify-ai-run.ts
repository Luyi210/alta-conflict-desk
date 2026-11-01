import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CaseView, Run, Trace } from "../shared/types.ts";
import { evidenceFacts } from "../shared/evidence-facts.ts";

const outputDir = fileURLToPath(
  new URL("../docs/history/evidence/", import.meta.url),
);
const usage = `只读验收已有 AI 核查，不新建任务、不调用模型、不读取 .env。
用法：
  node --import tsx scripts/verify-ai-run.ts <runId>
  node --import tsx scripts/verify-ai-run.ts --case <caseId>
  可选：--base-url http://127.0.0.1:4318
  加固验收：--hardened（逐主体台账引用、事实卡与网络回执；另存 V3-AI-* 文件）
输出：docs/history/evidence/AI-LIVE-VERIFICATION.json、docs/history/evidence/SAMPLE-AI-REPORT.md`;
const sensitiveKeys = new Set([
  "apikey",
  "modelapikey",
  "authorization",
  "proxyauthorization",
  "headers",
  "requestheaders",
  "responseheaders",
  "password",
  "secret",
  "accesstoken",
  "refreshtoken",
  "reasoningcontent",
  "chainofthought",
]);
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !sensitiveKeys.has(key.toLowerCase().replace(/[^a-z0-9]/g, "")),
        )
        .map(([key, item]) => [key, clean(item)]),
    );
  }
  return value;
}
function safeTrace(trace: Trace) {
  return {
    id: trace.id,
    connector: trace.connector,
    tool: trace.tool,
    initiator: trace.initiator,
    startedAt: trace.startedAt,
    durationMs: trace.durationMs,
    status: trace.status,
    args: clean(trace.args),
    result: clean(trace.result),
    ...(trace.error ? { error: trace.error } : {}),
  };
}

// Pure validation is exported for fixture tests; importing this module does not perform I/O.
export function validateAiRun(run: Run) {
  const prefix = `核查 ${run.id || "(无编号)"}`;
  assert.equal(run.mode, "ai", `${prefix}：不是 AI 模式`);
  assert.equal(
    run.status,
    "completed",
    `${prefix}：状态为 ${run.status}，必须 completed${run.error ? `；${run.error}` : ""}`,
  );
  const execution = run.modelExecution;
  assert.ok(execution, `${prefix}：缺少模型执行记录`);
  assert.equal(
    execution.status,
    "completed",
    `${prefix}：模型执行尚未成功完成${execution.error ? `；${execution.error}` : ""}`,
  );
  assert.ok(
    typeof execution.model === "string" && execution.model.trim(),
    `${prefix}：缺少实际模型名称`,
  );
  assert.ok(
    !/mock|dummy/i.test(execution.model),
    `${prefix}：模拟模型不能作为真实 AI 验收`,
  );
  assert.ok(
    Number.isInteger(execution.rounds) && execution.rounds >= 2,
    `${prefix}：模型请求轮次不足或无效`,
  );
  assert.ok(
    typeof run.completedAt === "string" &&
      Number.isFinite(Date.parse(run.completedAt)),
    `${prefix}：缺少有效完成时间`,
  );
  assert.ok(Array.isArray(run.traces), `${prefix}：缺少调用轨迹`);
  const modelTraces = run.traces.filter((trace) => trace.initiator === "model");
  assert.ok(modelTraces.length >= 2, `${prefix}：不足两次模型发起的工具调用`);
  assert.equal(
    execution.toolCallCount,
    modelTraces.length,
    `${prefix}：模型调用计数与实际轨迹不一致`,
  );
  assert.equal(
    new Set(run.traces.map((trace) => trace.id)).size,
    run.traces.length,
    `${prefix}：调用编号存在重复`,
  );
  for (const trace of modelTraces) {
    assert.equal(
      trace.status,
      "success",
      `${prefix}：模型调用 ${trace.id} 未成功`,
    );
    assert.match(
      trace.id,
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
      `${prefix}：调用编号不是实际网关生成的 UUID`,
    );
    assert.ok(
      Number.isFinite(Date.parse(trace.startedAt)),
      `${prefix}：调用 ${trace.id} 缺少有效开始时间`,
    );
    assert.ok(
      Number.isFinite(trace.durationMs) && trace.durationMs >= 0,
      `${prefix}：调用 ${trace.id} 耗时无效`,
    );
    assert.ok(
      trace.args &&
        typeof trace.args === "object" &&
        !Array.isArray(trace.args),
      `${prefix}：调用 ${trace.id} 缺少参数`,
    );
    assert.notEqual(
      trace.result,
      undefined,
      `${prefix}：调用 ${trace.id} 缺少真实返回结果`,
    );
    if (trace.connector === "ledger")
      assert.equal(
        (trace.result as { synthetic?: unknown } | null)?.synthetic,
        true,
        `${prefix}：内部台账结果未标明虚构演示数据`,
      );
  }
  const successfulSources = new Set(
    modelTraces.map((trace) => trace.connector),
  );
  assert.ok(
    successfulSources.has("gleif") && successfulSources.has("ledger"),
    `${prefix}：模型未成功调用 GLEIF 和 ledger 两个来源`,
  );
  const summary = run.modelSummary;
  assert.ok(
    typeof summary === "string" && summary.trim(),
    `${prefix}：缺少模型摘要`,
  );
  const suffix = summary.match(/\n\n引用调用：([^\n]+)\s*$/);
  assert.ok(suffix, `${prefix}：摘要缺少可验证的引用调用编号`);
  const citedTraceIds = suffix[1]
    .trim()
    .split(/[、,，]\s*/)
    .filter(Boolean);
  assert.ok(
    citedTraceIds.length >= 2 &&
      new Set(citedTraceIds).size === citedTraceIds.length,
    `${prefix}：摘要引用不足或重复`,
  );
  const citedTraces = citedTraceIds.map((id) => {
    const trace = modelTraces.find(
      (candidate) => candidate.id === id && candidate.status === "success",
    );
    assert.ok(trace, `${prefix}：摘要引用 ${id} 不属于本次成功的模型工具调用`);
    return trace;
  });
  const citedSources = new Set(citedTraces.map((trace) => trace.connector));
  assert.ok(
    citedSources.has("gleif") && citedSources.has("ledger"),
    `${prefix}：摘要引用未覆盖两个来源`,
  );
  return {
    id: run.id,
    matterName: run.matterName,
    partyRole: run.partyRole,
    mode: run.mode,
    status: run.status,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
    entity: clean(run.entity),
    model: execution.model,
    modelExecution: {
      status: execution.status,
      model: execution.model,
      toolCallCount: execution.toolCallCount,
      rounds: execution.rounds,
    },
    summary: run.summary,
    modelSummary: summary,
    citedTraceIds,
    gaps: run.gaps,
    syntheticLedger: true,
    actualModel: true,
    calls: run.traces.map(safeTrace),
  };
}

export function validateHardenedAiRun(run: Run) {
  const verified = validateAiRun(run);
  const required = [
    ...new Set([
      run.entity.lei,
      ...run.relations.map((relation) => relation.entity.lei),
    ]),
  ];
  for (const lei of required)
    assert.ok(
      run.traces.some(
        (trace) =>
          trace.initiator === "model" &&
          trace.connector === "ledger" &&
          trace.tool === "search_matters" &&
          trace.status === "success" &&
          trace.args.lei === lei &&
          verified.citedTraceIds.includes(trace.id),
      ),
      `主体 ${lei} 缺少实际模型台账调用或引用`,
    );
  assert.ok(run.context?.trim(), "缺少实际传入的委托背景");
  assert.ok(
    run.modelBrief?.questions?.length && run.modelBrief.nextSteps?.length,
    "缺少结构化复核问题或下一步建议",
  );
  assert.deepEqual(
    run.modelBrief.citedTraceIds,
    verified.citedTraceIds,
    "结构化引用与摘要引用不一致",
  );
  const facts = evidenceFacts(run.traces);
  assert.ok(facts.length > 0, "没有可由真实工具返回生成的来源卡");
  assert.deepEqual(run.modelBrief.facts, facts, "来源卡与原始工具字段不一致");
  for (const trace of run.traces.filter(
    (t) => t.connector === "gleif" && t.status === "success",
  )) {
    const result = trace.result as {
      network?: {
        url: string;
        attempts: { status?: number; error?: string }[];
      }[];
      gaps?: string[];
    };
    const requests = result.network;
    assert.ok(requests?.length, `GLEIF 调用 ${trace.id} 缺少实际 HTTP 回执`);
    for (const request of requests) {
      assert.equal(new URL(request.url).hostname, "api.gleif.org");
      assert.ok(request.attempts.length >= 1 && request.attempts.length <= 2);
      const finalAttempt = request.attempts.at(-1)!;
      const status = finalAttempt.status;
      // A disclosed parent can itself have no parent record. A real 404 is an explicit
      // coverage gap, never a transport failure or proof that no relationship exists.
      const explicitMissingParent =
        status === 404 &&
        trace.tool === "get_relationships" &&
        /\/(direct-parent|ultimate-parent)$/.test(
          new URL(request.url).pathname,
        ) &&
        Boolean(result.gaps?.some((gap) => gap.includes("404")));
      assert.ok(
        (status === 200 && !finalAttempt.error) || explicitMissingParent,
        "GLEIF 来源请求失败，或缺少记录未明确标记为覆盖缺口",
      );
    }
  }
  return {
    ...verified,
    hardenedVerified: true,
    context: run.context,
    modelBrief: clean(run.modelBrief),
    requiredLedgerLeis: required,
  };
}

type VerifiedRun = ReturnType<typeof validateAiRun>;
const oneLine = (value: string) =>
  value.replace(/[\r\n]+/g, " ").replace(/[<>]/g, "");
function report(
  verifiedAt: string,
  runs: VerifiedRun[],
  caseInfo?: {
    id: string;
    name: string;
    status: string;
    unconfirmedParties: string[];
    blockers: string[];
  },
) {
  return [
    "# 真实 AI 工具调用验收记录",
    "",
    `- 核验时间：${verifiedAt}`,
    "- 方式：只读读取本机已完成记录；此验收脚本没有新建任务或调用模型。",
    "- 核验依据：服务保存的模型执行状态、模型发起的 MCP 轨迹与摘要引用；不等于模型服务商独立账单证明。",
    "- 内部台账：全部为虚构演示数据；公开企业名称与 LEI 不代表真实委托关系。",
    "- 结果仅证明本次 AI 工具调用流程通过，不表示案件补证完备、无利益冲突或获准收案。",
    ...(caseInfo
      ? [
          `- 案件：${oneLine(caseInfo.name)} / ${caseInfo.id}；当前状态 ${caseInfo.status}`,
          `- 尚未确认主体：${caseInfo.unconfirmedParties.length ? caseInfo.unconfirmedParties.map(oneLine).join("、") : "无"}`,
          "",
          "## 案件尚待处理项",
          "",
          ...(caseInfo.blockers.length
            ? caseInfo.blockers.map((item) => `- ${oneLine(item)}`)
            : ["当前没有系统阻塞项；仍需律师判断。"]),
        ]
      : []),
    ...runs.flatMap((run) => [
      "",
      `## ${oneLine(run.matterName)} / ${run.id}`,
      "",
      `- 实际模型：${oneLine(run.model)}`,
      `- 模型执行：${run.modelExecution.status}；${run.modelExecution.rounds} 轮；${run.modelExecution.toolCallCount} 次模型工具调用。`,
      `- 核查开始：${run.createdAt}；完成：${run.completedAt}`,
      `- 主体角色：${oneLine(run.partyRole)}`,
      "",
      "### 模型辅助摘要与已验证引用",
      "",
      run.modelSummary,
      "",
      "### 范围与缺口",
      "",
      ...run.gaps.map((gap) => `- ${oneLine(gap)}`),
      "",
      "### 实际 MCP 调用记录",
      "",
      ...run.calls.flatMap((trace) => [
        `#### ${trace.connector} / ${trace.tool}`,
        "",
        `- 调用编号：${trace.id}；发起方：${trace.initiator || "未注明"}；状态：${trace.status}`,
        `- 开始：${trace.startedAt}；耗时：${trace.durationMs} ms`,
        "",
        "```json",
        JSON.stringify(
          {
            args: trace.args,
            result: trace.result,
            ...(trace.error ? { error: trace.error } : {}),
          },
          null,
          2,
        ).replace(/```/g, "\\`\\`\\`"),
        "```",
        "",
      ]),
    ]),
    "---",
    "不包含 API 密钥、请求头、响应头或模型思考内容。",
    "",
  ].join("\n");
}

async function main() {
  const hardened = process.argv.slice(2).includes("--hardened");
  const jsonFile = hardened
    ? "V3-AI-VERIFICATION.json"
    : "AI-LIVE-VERIFICATION.json";
  const reportFile = hardened ? "V3-AI-REPORT.md" : "SAMPLE-AI-REPORT.md";
  let source: { baseUrl?: string; kind?: string; id?: string } = {};
  const verifiedAt = new Date().toISOString();
  try {
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
      console.log(usage);
      return;
    }
    let base = "http://127.0.0.1:4318";
    let kind: "run" | "case" = "run";
    let id: string | undefined;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === "--hardened") continue;
      if (arg === "--base-url") {
        assert.ok(args[index + 1], "--base-url 缺少地址");
        base = args[++index];
      } else if (arg === "--case") {
        assert.ok(!id && args[index + 1], "--case 缺少编号或重复指定目标");
        kind = "case";
        id = args[++index];
      } else {
        assert.ok(!arg.startsWith("-") && !id, `未知或重复参数：${arg}`);
        id = arg;
      }
    }
    assert.ok(
      id && /^[a-zA-Z0-9_-]{1,200}$/.test(id),
      `请提供有效的 runId 或 --case caseId。\n${usage}`,
    );
    const url = new URL(base);
    assert.ok(
      ["http:", "https:"].includes(url.protocol) &&
        ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        url.pathname === "/",
      "只允许不含凭证或额外路径的本机 API 地址",
    );
    base = url.origin;
    source = { baseUrl: base, kind, id };
    const get = async <T>(path: string): Promise<T> => {
      const response = await fetch(`${base}/api${path}`, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      assert.ok(response.ok, `读取本机 ${path} 失败：HTTP ${response.status}`);
      return (await response.json()) as T;
    };
    let caseInfo: Parameters<typeof report>[2];
    let runs: Run[];
    if (kind === "case") {
      const file = await get<CaseView>(`/cases/${encodeURIComponent(id)}`);
      assert.equal(file.mode, "ai", "所选案件不是 AI 模式");
      const confirmed = file.parties.filter((party) => party.confirmed);
      if (hardened)
        assert.equal(
          confirmed.length,
          file.parties.length,
          "加固案件验收要求所有案件主体都已确认身份",
        );
      assert.ok(
        confirmed.length > 0 && confirmed.every((party) => party.runId),
        "案件没有已启动核查的确认主体，或存在缺失的子核查",
      );
      const ids = [...new Set(confirmed.map((party) => party.runId!))];
      runs = await Promise.all(
        ids.map((runId) => get<Run>(`/runs/${encodeURIComponent(runId)}`)),
      );
      caseInfo = {
        id: file.id,
        name: file.name,
        status: file.status,
        unconfirmedParties: file.parties
          .filter((party) => !party.confirmed)
          .map((party) => party.name),
        blockers: file.blockers,
      };
    } else runs = [await get<Run>(`/runs/${encodeURIComponent(id)}`)];
    const validated = runs.map(
      hardened ? validateHardenedAiRun : validateAiRun,
    );
    const artifact = {
      verifiedAt,
      source,
      aiVerified: true,
      hardenedVerified: hardened,
      actualModel: true,
      syntheticLedger: true,
      verificationBasis:
        "Read-only validation of saved local application model execution records and successful model-initiated MCP traces. This script does not invoke the model or independently verify provider billing.",
      modelRequestsByVerifier: 0,
      ...(caseInfo ? { case: caseInfo } : {}),
      runs: validated,
    };
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(
      resolve(outputDir, jsonFile),
      JSON.stringify(clean(artifact), null, 2) + "\n",
    );
    writeFileSync(
      resolve(outputDir, reportFile),
      report(verifiedAt, validated, caseInfo),
    );
    console.log(
      JSON.stringify(
        {
          aiVerified: true,
          hardenedVerified: hardened,
          models: [...new Set(validated.map((run) => run.model))],
          runIds: validated.map((run) => run.id),
          modelToolCalls: validated.reduce(
            (count, run) => count + run.modelExecution.toolCallCount,
            0,
          ),
          files: [resolve(outputDir, jsonFile), resolve(outputDir, reportFile)],
        },
        null,
        2,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 验收失败";
    // A failed validation overwrites an older success artifact to avoid stale acceptance claims.
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(
      resolve(outputDir, jsonFile),
      JSON.stringify(
        {
          verifiedAt,
          source,
          aiVerified: false,
          modelRequestsByVerifier: 0,
          error: message,
        },
        null,
        2,
      ) + "\n",
    );
    writeFileSync(
      resolve(outputDir, reportFile),
      `# AI 工具调用验收未通过\n\n核验时间：${verifiedAt}\n\n${message}\n\n没有新建任务或发起模型调用；请修复后对已完成记录重新执行验收。\n`,
    );
    console.error(`AI 验收未通过：${message}`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
