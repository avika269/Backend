import express from "express";

import {
  createAssessment,
  getAssessment
} from "../controllers/assessment.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

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

export default router;