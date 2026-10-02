import express from "express";

import {
  createAttempt,
  getAttempt,
  acceptInstructions,
  systemCheck,
  getOverview,
  startAssessment,
  saveAnswer,
  uploadSpokenAnswer,
  saveProctorEvent,
  submitAssessment
} from "../controllers/attempt.controller.js";

import {
  authenticate,
  requireRole
} from "../middleware/auth.middleware.js";

import {
  uploadAudio
} from "../middleware/upload.middleware.js";

const router =
  express.Router();

router.use(
  authenticate,
  requireRole("candidate")
);

router.post(
  "/",
  createAttempt
);

router.get(
  "/:attemptId",
  getAttempt
);

router.post(
  "/:attemptId/accept-instructions",
  acceptInstructions
);

router.post(
  "/:attemptId/system-check",
  systemCheck
);

router.get(
  "/:attemptId/overview",
  getOverview
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
  "/:attemptId/audio",
  uploadAudio.single("audio"),
  uploadSpokenAnswer
);

router.post(
  "/:attemptId/event",
  saveProctorEvent
);

router.post(
  "/:attemptId/submit",
  submitAssessment
);

export default router;