
import express from "express";

import {
  analyzeCandidateProfile,
  getCandidateProfile,
  updateCandidateProfile,
  deleteCandidateProfile,
  getCandidateInterview,
   submitCandidateInterview
} from "../controllers/profile.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/analyze",
  authMiddleware,
  upload.single("resume"),
  analyzeCandidateProfile
);

router.get(
  "/",
  authMiddleware,
  getCandidateProfile
);

router.get(
  "/interview",
  authMiddleware,
  getCandidateInterview
);

router.post(
  "/interview/submit",
  authMiddleware,
  roleMiddleware("candidate"),
  submitCandidateInterview
);

router.put(
  "/",
  authMiddleware,
  upload.single("resume"),
  updateCandidateProfile
);

router.delete(
  "/",
  authMiddleware,
  deleteCandidateProfile
);

export default router;
