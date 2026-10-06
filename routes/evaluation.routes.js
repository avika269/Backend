import express from "express";

import {
  generateEvaluation,
  getEvaluation
} from "../controllers/evaluation.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.post(
  "/:attemptId/generate",
  authMiddleware,
  generateEvaluation
);

router.get(
  "/:attemptId",
  authMiddleware,
  getEvaluation
);

export default router;