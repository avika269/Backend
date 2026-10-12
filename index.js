import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";


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

import {
  notFoundMiddleware,
  errorMiddleware
} from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://smart-recruit-chi.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartRecruit Backend Running"
  });
});

app.get("/api/health/email", async (req, res) => {
  const rawKey = process.env.BREVO_API_KEY || "";
  const cleanKey = rawKey.trim().replace(/^['"]|['"]$/g, "");
  let brevoAccount = null;

  if (cleanKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": cleanKey }
      });
      const data = await response.json().catch(() => ({}));
      brevoAccount = {
        httpStatus: response.status,
        email: data.email,
        message: data.message || (response.ok ? "OK" : "Failed")
      };
    } catch (err) {
      brevoAccount = { error: err.message };
    }
  }

  res.json({
    brevoKeyConfigured: Boolean(cleanKey),
    keyLength: cleanKey.length,
    emailUser: process.env.EMAIL_USER || null,
    brevoAccount
  });
});

app.use("/api/auth", authRoutes);
console.log("DRIVE ROUTES LOADED");
app.use("/api/drives", driveRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/proctoring", proctoringRoutes);
app.use("/api/ml", mlRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 3500, () => {
      console.log(
        `Server running on http://localhost:${process.env.PORT || 3500}`
      );
    });
  })
  .catch((error) => {
    console.log(
      "MongoDB connection error:",
      error.message
    );
  });