import express from "express";

import {
  createAssessment,
  getAssessment,
  updateAssessment,
  deleteAssessment
} from "../controllers/assessment.controller.js";

const router = express.Router();

router.post("/", createAssessment);

router.get("/", getAssessment);

router.put("/:assessmentId", updateAssessment);

router.delete("/:assessmentId", deleteAssessment);

export default router;