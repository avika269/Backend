import express from "express";

import {
  createProctoringEvent,
  getProctoringEvaluation,
  generateProctoringEvaluation
} from "../controllers/proctoring.controller.js";

const router = express.Router();

router.post("/:attemptId/event", createProctoringEvent);

router.get("/:attemptId", getProctoringEvaluation);

router.post("/:attemptId/evaluate", generateProctoringEvaluation);

export default router;