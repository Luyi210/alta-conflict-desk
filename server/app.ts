import express from "express";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { ZodError } from "zod";
import { Store, dataDir } from "./store.ts";
import {
  ConnectorManager,
  connectorIds,
  HttpError,
  ToolError,
} from "./connectors.ts";
import { ScreeningService, runInputSchema, reviewSchema } from "./screening.ts";
import { modelConfigured, modelName } from "./model.ts";
import { report } from "./report.ts";
import type { ConnectorId, Entity } from "../shared/types.ts";

export function createBackend(dir = dataDir) {
  const app = express();
  const store = new Store(dir);
  const connectors = new ConnectorManager(dir, (kind, data) =>
    store.audit(kind, data),
  );
  const screening = new ScreeningService(store, connectors);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    if (!["127.0.0.1", "localhost", "[::1]"].includes(req.hostname)) {
      res.status(403).json({ error: "仅允许本机访问" });
      return;
    }
    const origin = req.get("origin");
    if (origin) {
      try {
        const u = new URL(origin);
        if (!["127.0.0.1", "localhost"].includes(u.hostname)) throw new Error();
      } catch {
        res.status(403).json({ error: "仅允许本地工作台访问" });
        return;
      }
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  const id = (value: string): ConnectorId => {
    if (!connectorIds.includes(value as ConnectorId))
      throw new HttpError(404, "未知连接器");
    return value as ConnectorId;
  };
  const getRun = (runId: string) => {
    const run = store.get(runId);
    if (!run) throw new HttpError(404, "核查不存在");
    return run;
  };
  app.get("/api/status", (_req, res) =>
    res.json({
      connectors: connectors.list(),
      model: {
        configured: modelConfigured(),
        model: modelName(),
        modeLabel: modelConfigured()
          ? "AI 工具核查可用"
          : "规则预览 · 模型待配置",
      },
      ledger: { count: store.countLedger(), synthetic: true },
    }),
  );
  app.post("/api/connectors/:id/connect", async (req, res) =>
    res.json(await connectors.connect(id(req.params.id))),
  );
  app.post("/api/connectors/:id/test", async (req, res) =>
    res.json(await connectors.test(id(req.params.id))),
  );
  app.post("/api/connectors/:id/disconnect", async (req, res) =>
    res.json(await connectors.disconnect(id(req.params.id))),
  );
  app.get("/api/entities", async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 2 || query.length > 200)
      throw new HttpError(400, "查询名称需为 2–200 字符");
    const result = await connectors.call<{ entities: Entity[] }>(
      "gleif",
      "search_entities",
      { query },
    );
    res.json({ entities: result.data.entities, trace: result.trace });
  });
  app.post("/api/runs", (req, res) => {
    const input = runInputSchema.parse(req.body);
    res.status(201).json(screening.create(input));
  });
  app.get("/api/runs", (_req, res) => res.json({ runs: store.list() }));
  app.get("/api/runs/:id", (req, res) => res.json(getRun(req.params.id)));
  app.post("/api/runs/:runId/findings/:findingId/review", (req, res) => {
    const input = reviewSchema.parse(req.body);
    res.json(
      screening.review(
        req.params.runId,
        req.params.findingId,
        input.review,
        input.note,
      ),
    );
  });
  app.get("/api/runs/:id/report", (req, res) => {
    const run = getRun(req.params.id);
    if (run.status === "running") throw new HttpError(409, "核查尚未完成");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="conflict-screening-${run.id}.md"`,
    );
    res.type("text/markdown").send(report(run));
  });
  app.use("/api", (_req, res) => res.status(404).json({ error: "API 不存在" }));
  const dist = resolve(fileURLToPath(new URL("../", import.meta.url)), "dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(resolve(dist, "index.html")),
    );
  }
  app.use(
    (
      error: Error & { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json({
            error: error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("；"),
          });
        return;
      }
      const code =
        error instanceof HttpError
          ? error.status
          : error instanceof ToolError
            ? 502
            : error.status === 400
              ? 400
              : 500;
      res
        .status(code)
        .json({
          error:
            code === 500 ? "服务处理失败，请检查本地服务状态。" : error.message,
        });
    },
  );
  return {
    app,
    store,
    connectors,
    screening,
    async close() {
      await screening.close();
      await connectors.close();
      store.close();
    },
  };
}
