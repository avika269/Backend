import express from "express";

import {
  createAssessment,
  getAssessment,
  startAssessment,
  acceptInstructions,
  completeSystemCheck
} from "../controllers/assessment.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router =
  express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  createAssessment
);

router.get(
  "/:id",
  authMiddleware,
  getAssessment
);

router.post(
  "/:id/start",
  authMiddleware,
  startAssessment
);

router.post(
  "/:attemptId/accept-instructions",
  authMiddleware,
  acceptInstructions
);

router.post(
  "/:attemptId/system-check",
  authMiddleware,
  completeSystemCheck
);

export default router;