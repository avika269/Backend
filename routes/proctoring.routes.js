
import express from "express";

import {
  createProctoringEvent,
  getProctoringEvaluation,
  analyzeProctoring
} from "../controllers/proctoring.controller.js";

const router = express.Router();

router.post(
  "/:attemptId/events",
  createProctoringEvent
);

router.get(
  "/:attemptId/evaluation",
  getProctoringEvaluation
);

router.post(
  "/:attemptId/analyze",
  analyzeProctoring
);

export default router;
