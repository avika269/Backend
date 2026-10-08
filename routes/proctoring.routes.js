import express from "express";

import {
  startProctoringSession,
  analyzeProctoring,
  endProctoringSession
} from "../controllers/proctoring.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/start",
  authMiddleware,
  startProctoringSession
);

router.post(
  "/analyze-frame",
  authMiddleware,
  analyzeProctoring
);

router.post(
  "/end",
  authMiddleware,
  endProctoringSession
);

export default router;