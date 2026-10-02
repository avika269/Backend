import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./models/User.js";
import Assessment from "./models/Assessment.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected"
    );

    const recruiter =
      await User.findOne({
        email:
          "recruiter@smartrecruit.com"
      });

    let recruiterUser =
      recruiter;

    if (!recruiterUser) {
      recruiterUser =
        await User.create({
          name:
            "SmartRecruit Recruiter",

          email:
            "recruiter@smartrecruit.com",

          password:
            "$2b$12$abcdefghijklmnopqrstuu",

          role:
            "recruiter"
        });
    }

    await Assessment.deleteMany({});

    const assessment =
      await Assessment.create({
        recruiterId:
          recruiterUser._id,

        title:
          "Frontend Developer Assessment",

        description:
          "Technical screening assessment for frontend developer candidates.",

        duration: 30,

        totalQuestions: 6,

        assessmentType:
          "Technical Screening",

        role:
          "Frontend Developer",

        active: true,

        questions: [
          {
            questionNumber: 1,

            type: "mcq",

            category:
              "Technical Knowledge",

            question:
              "Which JavaScript method is used to select an HTML element by its ID?",

            options: [
              "getElementByClass()",
              "getElementById()",
              "queryElement()",
              "selectById()"
            ],

            correctAnswer:
              "getElementById()",

            points: 1,

            order: 1
          },

          {
            questionNumber: 2,

            type: "mcq",

            category:
              "Technical Knowledge",

            question:
              "Which CSS property controls the space inside an element?",

            options: [
              "margin",
              "padding",
              "border",
              "spacing"
            ],

            correctAnswer:
              "padding",

            points: 1,

            order: 2
          },

          {
            questionNumber: 3,

            type: "mcq",

            category:
              "Technical Knowledge",

            question:
              "Which JavaScript keyword creates a block-scoped variable?",

            options: [
              "var",
              "let",
              "define",
              "variable"
            ],

            correctAnswer:
              "let",

            points: 1,

            order: 3
          },

          {
            questionNumber: 4,

            type: "mcq",

            category:
              "Technical Knowledge",

            question:
              "Which CSS layout system is designed for one-dimensional layouts?",

            options: [
              "Flexbox",
              "Grid",
              "Float",
              "Table"
            ],

            correctAnswer:
              "Flexbox",

            points: 1,

            order: 4
          },

          {
            questionNumber: 5,

            type: "spoken",

            category:
              "Spoken Technical Response",

            question:
              "Explain the difference between let, const and var in JavaScript.",

            points: 2,

            timeLimit: 120,

            order: 5
          },

          {
            questionNumber: 6,

            type: "coding",

            category:
              "Coding Challenge",

            question:
              "Write a JavaScript function to reverse a string.",

            points: 5,

            timeLimit: 900,

            order: 6
          }
        ]
      });

    console.log(
      "Assessment created:"
    );

    console.log(
      assessment._id.toString()
    );

    console.log(
      "Recruiter:",
      recruiterUser.email
    );

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();