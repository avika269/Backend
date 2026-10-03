import express from "express";

import {
  analyzeCandidateProfile,
  getCandidateProfile
} from "../controllers/profile.controller.js";

import upload from "../middleware/resumeUpload.middleware.js";

import authMiddleware from "../middleware/auth.middleware.js";

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

export default router;