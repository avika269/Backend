import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import assessmentRoutes from "./routes/assessment.routes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));


app.get("/", (req, res) => {
  res.json({
    message: "Frontend Developer Assessment Backend Running"
  });
});


app.use(
  "/api/assessment",
  assessmentRoutes
);


mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      "MongoDB connected successfully"
    );

    app.listen(
      process.env.PORT,
      () => {

        console.log(
          `Server running on http://localhost:${process.env.PORT}`
        );

      }
    );

  })

  .catch((error) => {

    console.log(
      "MongoDB connection error:",
      error.message
    );

  });