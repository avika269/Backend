import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";

dotenv.config();

const app =
  express();

const PORT =
  process.env.PORT || 3500;

app.use(
  cors({
    origin: "*"
  })
);

app.use(
  express.json({
    limit: "5mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "SmartRecruit Backend Running"
    });
  }
);

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      server:
        "running",

      database:
        mongoose.connection.readyState ===
        1
          ? "connected"
          : "disconnected"
    });
  }
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/assessments",
  assessmentRoutes
);

app.use(
  "/api/attempts",
  attemptRoutes
);

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        `Route ${req.method} ${req.originalUrl} not found`
    });
  }
);

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      }
    );
  })
  .catch(
    error => {
      console.error(
        "MongoDB connection error:",
        error.message
      );
    }
  );