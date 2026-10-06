import express from "express";

import {
  saveAnswer,
  submitAssessment
} from "../controllers/submission.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.post(
  "/:attemptId/answer",
  authMiddleware,
  saveAnswer
);

router.post(
  "/:attemptId/submit",
  authMiddleware,
  submitAssessment
);

export default router;