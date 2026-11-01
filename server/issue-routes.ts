import { Router } from "express";
import { z } from "zod";
import { IssueService } from "./issue-service.ts";
export function issueRouter(service: IssueService) {
  const router = Router({ mergeParams: true });
  const caseId = (req: any) => z.string().uuid().parse(req.params.id);
  router.get("/", (req, res) => res.json(service.snapshot(caseId(req))));
  router.post("/", (req, res) =>
    res.status(201).json(service.create(caseId(req), req.body)),
  );
  router.get("/comparison", async (req, res) =>
    res.json(
      await service.compare(
        caseId(req),
        z.string().uuid().parse(req.query.from),
        z.string().uuid().parse(req.query.to),
      ),
    ),
  );
  router.post("/compare-review", (req, res) =>
    res.status(201).json(service.compareReview(caseId(req), req.body)),
  );
  router.post("/:issueId", (req, res) =>
    res.json(service.update(caseId(req), req.params.issueId, req.body)),
  );
  router.post("/:issueId/citations", (req, res) =>
    res
      .status(201)
      .json(service.addCitation(caseId(req), req.params.issueId, req.body)),
  );
  return router;
}
