import express from "express";
import {
  getMlHealth,
  predictActivity
} from "../controllers/ml.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/health", getMlHealth);
router.post("/predict-face-activity", authMiddleware, predictActivity);

export default router;