import { Router } from "express";
import { z } from "zod";
import { AssistantService } from "./assistant-service.ts";
export function assistantRouter(service: AssistantService) {
  const router = Router({ mergeParams: true });
  const id = (req: any) => z.string().uuid().parse(req.params.id);
  router.get("/", (req, res) => res.json(service.snapshot(id(req))));
  router.post("/runs", (req, res) =>
    res.status(201).json(service.start(id(req), req.body)),
  );
  router.post("/runs/:runId/apply", (req, res) =>
    res.json(
      service.apply(
        id(req),
        z.string().uuid().parse(req.params.runId),
        req.body,
      ),
    ),
  );
  return router;
}
