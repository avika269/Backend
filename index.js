import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import proctoringRoutes from "./routes/proctoring.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
     "http://localhost:5173",
      "http://localhost:3000",
      "http://smart-recruit-b5up.vercel.app/"

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

app.use("/api/auth", authRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/proctoring", proctoringRoutes);

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