import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  getRecruiterDashboard,
  getRecruiterCandidates,
  getRecruiterCandidateReview,
  saveRecruiterDecision
} from "../controllers/recruiter.controller.js";

const router = express.Router();
router.use(authMiddleware, roleMiddleware("recruiter", "admin"));
router.get("/dashboard", getRecruiterDashboard);
router.get("/candidates", getRecruiterCandidates);
router.get("/candidate/:attemptId", getRecruiterCandidateReview);
router.post("/candidate/:attemptId/decision", saveRecruiterDecision);
export default router;