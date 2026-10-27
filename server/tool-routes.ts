import { Router } from "express";
import {
  ToolDeskService,
  toolCallSchema,
  toolPermissionSchema,
} from "./tool-desk.ts";

export function createToolDeskRouter(toolDesk: ToolDeskService) {
  const router = Router();
  router.get("/", (_req, res) => res.json(toolDesk.snapshot()));
  router.post("/permissions", (req, res) =>
    res.json(toolDesk.permission(toolPermissionSchema.parse(req.body))),
  );
  router.post("/calls", (req, res) =>
    res.status(201).json(toolDesk.create(toolCallSchema.parse(req.body))),
  );
  router.get("/calls/:id", (req, res) => res.json(toolDesk.get(req.params.id)));
  router.post("/calls/:id/retry", (req, res) =>
    res.status(201).json(toolDesk.retry(req.params.id)),
  );
  return router;
}
