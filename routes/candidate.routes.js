import express from "express";

import {
  getCandidateResults
} from "../controllers/candidate.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/results",
  authMiddleware,
  getCandidateResults
);

export default router;