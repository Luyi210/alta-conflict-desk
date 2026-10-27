import { Router } from "express";
import { CaseService } from "./cases.ts";
import { caseReport } from "./case-report.ts";

export function createCaseRouter(cases: CaseService) {
  const router = Router();
  router.get("/", (_req, res) => res.json({ cases: cases.list() }));
  router.post("/", (req, res) => res.status(201).json(cases.create(req.body)));
  router.get("/:id", (req, res) => res.json(cases.get(req.params.id)));
  router.post("/:id/parties/:partyId/resolve", (req, res) =>
    res.json(cases.resolveParty(req.params.id, req.params.partyId, req.body)),
  );
  router.post("/:id/parties/:partyId/retry", (req, res) =>
    res.json(cases.retryParty(req.params.id, req.params.partyId)),
  );
  router.post("/:id/tasks/:taskId", (req, res) =>
    res.json(cases.updateTask(req.params.id, req.params.taskId, req.body)),
  );
  router.post("/:id/decision", (req, res) =>
    res.json(cases.recordDecision(req.params.id, req.body)),
  );
  router.get("/:id/report", (req, res) => {
    const file = cases.get(req.params.id);
    res
      .type("text/markdown; charset=utf-8")
      .set("Content-Disposition", `attachment; filename="case-${file.id}.md"`)
      .send(caseReport(file));
  });
  return router;
}
