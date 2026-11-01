import { Router, raw } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { MaterialService } from "./material-service.ts";
import { HttpError } from "./connectors.ts";

export function materialRouter(service: MaterialService) {
  const router = Router({ mergeParams: true });
  const caseId = (req: any) => z.string().uuid().parse(req.params.id);
  router.get("/", (req, res) => res.json(service.snapshot(caseId(req))));
  router.post(
    "/upload",
    raw({ type: "application/pdf", limit: "8mb" }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body))
        throw new HttpError(400, "请使用 application/pdf 上传文件");
      const title = z.string().min(1).max(160).parse(req.query.title);
      const previous = z.string().uuid().optional().parse(req.query.previous);
      res
        .status(201)
        .json(await service.upload(caseId(req), title, req.body, previous));
    },
  );
  router.post("/sample", async (req, res) => {
    const input = z
      .object({
        variant: z.enum(["original", "updated"]).default("original"),
        previous: z.string().uuid().optional(),
      })
      .strict()
      .parse(req.body);
    const bytes = readFileSync(
      fileURLToPath(
        new URL(
          `../examples/pdf/fictional-engagement-${input.variant}.pdf`,
          import.meta.url,
        ),
      ),
    );
    res
      .status(201)
      .json(
        await service.upload(
          caseId(req),
          "DEMO-2026-014 委托范围说明（虚构）",
          bytes,
          input.previous,
        ),
      );
  });
  router.post("/:versionId/permission", (req, res) =>
    res.json(
      service.permit(
        caseId(req),
        req.params.versionId,
        z.object({ allowed: z.boolean() }).strict().parse(req.body).allowed,
      ),
    ),
  );
  router.get("/:versionId/pdf", (req, res) => {
    const bytes = service.data.bytes(caseId(req), req.params.versionId);
    res
      .type("application/pdf")
      .set("Content-Disposition", 'inline; filename="case-material.pdf"')
      .send(bytes);
  });
  router.get("/:versionId/pages/:page", async (req, res) =>
    res.json(
      await service.read(
        caseId(req),
        req.params.versionId,
        Number(req.params.page),
      ),
    ),
  );
  router.post("/reviews", (req, res) =>
    res.status(201).json(service.start(caseId(req), req.body)),
  );
  router.post("/evidence", (req, res) =>
    res.status(201).json(service.record(caseId(req), req.body)),
  );
  return router;
}
