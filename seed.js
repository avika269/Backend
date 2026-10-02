import mongoose from "mongoose";
import dotenv from "dotenv";
import Assessment from "./models/Assessment.js";

dotenv.config();

await mongoose.connect(
  process.env.MONGO_URI
);

await Assessment.deleteMany({});

const assessment =
  await Assessment.create({

    title:
      "Frontend Developer Assessment",

    description:
      "Review the instructions before starting your assessment. Ensure your setup is ready and uninterrupted.",

    duration: 30,

    totalQuestions: 6,

    assessmentType:
      "Technical Screening",

    questions: [

      {
        questionNumber: 1,

        type: "mcq",

        question:
          "Which method is used to select an element by ID?",

        options: [
          "querySelector()",
          "getElementById()",
          "getElement()",
          "selectById()"
        ],

        correctAnswer:
          "getElementById()",

        points: 1
      },


      {
        questionNumber: 2,

        type: "mcq",

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

        points: 1
      },


      {
        questionNumber: 3,

        type: "mcq",

        question:
          "Which keyword creates a block-scoped variable?",

        options: [
          "var",
          "let",
          "define",
          "variable"
        ],

        correctAnswer:
          "let",

        points: 1
      },


      {
        questionNumber: 4,

        type: "spoken",

        question:
          "Explain the difference between let, const and var.",

        points: 1
      },


      {
        questionNumber: 5,

        type: "spoken",

        question:
          "Explain what happens when a user enters a URL into a browser.",

        points: 1
      },


      {
        questionNumber: 6,

        type: "coding",

        question:
          "Write a JavaScript function to reverse a string.",

        points: 1
      }

    ]

  });


console.log(
  "Assessment created successfully"
);

console.log(
  "Assessment ID:",
  assessment._id.toString()
);

process.exit();