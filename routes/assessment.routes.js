import express from "express";

import {
  createAssessment,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  createAttempt,
  acceptInstructions,
  systemCheck,
  startAssessment,
  saveAnswer,
  saveProctorEvent,
  submitAssessment,
  getAttempt
} from "../controllers/assessment.controller.js";

const router = express.Router();

router.post("/", createAssessment);

router.get("/", getAssessment);

router.put("/:assessmentId", updateAssessment);

router.delete("/:assessmentId", deleteAssessment);

router.post("/attempt", createAttempt);

router.post(
  "/attempt/:attemptId/accept-instructions",
  acceptInstructions
);

router.post(
  "/attempt/:attemptId/system-check",
  systemCheck
);

router.post(
  "/attempt/:attemptId/start",
  startAssessment
);

router.post(
  "/attempt/:attemptId/answer",
  saveAnswer
);

router.post(
  "/attempt/:attemptId/event",
  saveProctorEvent
);

router.post(
  "/attempt/:attemptId/submit",
  submitAssessment
);

router.get(
  "/attempt/:attemptId",
  getAttempt
);

export default router;