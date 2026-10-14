
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import { env } from "./env.js";
import authRoutes from "./routes/auth.routes.js";
import driveRoutes from "./routes/drive.routes.js";
import questionRoutes from "./routes/question.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import evaluationRoutes from "./routes/evaluation.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import proctoringRoutes from "./routes/proctoring.routes.js";
import mlRoutes from "./routes/ml.routes.js";
import scorecardRoutes from "./routes/scorecard.routes.js";
import recruiterRoutes from "./routes/recruiter.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";

import {
  notFoundMiddleware,
  errorMiddleware
} from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://smart-recruit-chi.vercel.app",
  String(env.frontendUrl || "").replace(/\/$/, ""),
  ...env.corsOrigins.map((origin) => origin.replace(/\/$/, ""))
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartRecruit Backend Running"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "SmartRecruit Backend" });
});

app.use("/api/auth", authRoutes);
console.log("DRIVE ROUTES LOADED");
app.use("/api/drives", driveRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/proctoring", proctoringRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/scorecards", scorecardRoutes);
app.use("/api/recruiter", recruiterRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

mongoose
  .connect(env.mongoUri)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`ML service configured at ${env.mlApiUrl}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
