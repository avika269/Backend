import express from "express";

import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion
} from "../controllers/question.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router =
  express.Router();

router.get(
  "/",
  authMiddleware,
  getQuestions
);

router.get(
  "/:id",
  authMiddleware,
  getQuestion
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  createQuestion
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  updateQuestion
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  deleteQuestion
);

export default router;