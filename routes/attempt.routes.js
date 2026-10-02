import express from "express";

import {
  createAttempt,
  acceptInstructions,
  systemCheck,
  startAssessment,
  saveAnswer,
  saveProctorEvent,
  submitAssessment,
  getAttempt
} from "../controllers/attempt.controller.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", createAttempt);

router.post(
  "/:attemptId/accept-instructions",
  acceptInstructions
);

router.post(
  "/:attemptId/system-check",
  systemCheck
);

router.post(
  "/:attemptId/start",
  startAssessment
);

router.post(
  "/:attemptId/answer",
  saveAnswer
);

router.post(
  "/:attemptId/event",
  saveProctorEvent
);

router.post(
  "/:attemptId/submit",
  submitAssessment
);

router.get(
  "/:attemptId",
  getAttempt
);

export default router;