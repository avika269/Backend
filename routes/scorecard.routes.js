import express from "express";

import {
  generateScorecard,
  getScorecard,
  updateRecruiterDecision
} from "../controllers/scorecard.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router =
  express.Router();

router.post(
  "/:attemptId/generate",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  generateScorecard
);

router.get(
  "/:attemptId",
  authMiddleware,
  getScorecard
);

router.patch(
  "/:attemptId/decision",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  updateRecruiterDecision
);

export default router;