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

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createAttempt
);

router.post(
  "/:attemptId/accept-instructions",
  authMiddleware,
  acceptInstructions
);

router.post(
  "/:attemptId/system-check",
  authMiddleware,
  systemCheck
);

router.post(
  "/:attemptId/start",
  authMiddleware,
  startAssessment
);

router.post(
  "/:attemptId/answer",
  authMiddleware,
  saveAnswer
);

router.post(
  "/:attemptId/event",
  authMiddleware,
  saveProctorEvent
);

router.post(
  "/:attemptId/submit",
  authMiddleware,
  submitAssessment
);

router.get(
  "/:attemptId",
  authMiddleware,
  getAttempt
);

export default router;