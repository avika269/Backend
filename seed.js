import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import User from "./models/User.js";
import Drive from "./models/Drive.js";
import Question from "./models/Question.js";
import Assessment from "./models/Assessment.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const recruiterPassword =
      await bcrypt.hash("Recruiter@123", 10);

    const recruiterUser =
      await User.findOneAndUpdate(
        {
          email: "recruiter@smartrecruit.com"
        },
        {
          name: "SmartRecruit Recruiter",
          email: "recruiter@smartrecruit.com",
          password: recruiterPassword,
          authProvider: "local",
          emailVerified: true,
          role: "recruiter",
          isActive: true
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

    console.log(
      "Recruiter ready:",
      recruiterUser.email
    );

    const candidatePassword =
      await bcrypt.hash("Candidate@123", 10);

    const candidateUser =
      await User.findOneAndUpdate(
        {
          email: "candidate@smartrecruit.com"
        },
        {
          name: "Priya Tiwari",
          email: "candidate@smartrecruit.com",
          password: candidatePassword,
          authProvider: "local",
          emailVerified: true,
          role: "candidate",
          phone: "9876543210",
          isActive: true
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

    console.log(
      "Candidate ready:",
      candidateUser.email
    );

    await Assessment.deleteMany({});
    await Drive.deleteMany({});
    await Question.deleteMany({});

    console.log("Old assessment data removed");

    const startDate = new Date();

    const endDate = new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000
    );

    const drive =
      await Drive.create({
        title:
          "Frontend Developer Hiring Drive",

        company:
          "SmartRecruit",

        role:
          "Frontend Developer",

        description:
          "Hiring drive for frontend developers with a technical screening assessment.",

        location:
          "Remote",

        startDate,

        endDate,

        createdBy:
          recruiterUser._id,

        invitedCandidates: [
          candidateUser._id
        ],

        isActive: true
      });

    console.log(
      "Drive created:",
      drive._id.toString()
    );

    const questions =
      await Question.create([
        {
          question:
            "Which JavaScript method is used to select an HTML element by its ID?",

          type:
            "mcq",

          options: [
            "getElementByClass()",
            "getElementById()",
            "queryElement()",
            "selectById()"
          ],

          correctAnswer:
            "getElementById()",

          points: 1,

          difficulty:
            "easy",

          tags: [
            "javascript",
            "dom"
          ],

          createdBy:
            recruiterUser._id
        },

        {
          question:
            "Which CSS property controls the space inside an element?",

          type:
            "mcq",

          options: [
            "margin",
            "padding",
            "border",
            "spacing"
          ],

          correctAnswer:
            "padding",

          points: 1,

          difficulty:
            "easy",

          tags: [
            "css",
            "box-model"
          ],

          createdBy:
            recruiterUser._id
        },

        {
          question:
            "Which JavaScript keyword creates a block-scoped variable?",

          type:
            "mcq",

          options: [
            "var",
            "let",
            "define",
            "variable"
          ],

          correctAnswer:
            "let",

          points: 1,

          difficulty:
            "easy",

          tags: [
            "javascript",
            "variables"
          ],

          createdBy:
            recruiterUser._id
        },

        {
          question:
            "Which CSS layout system is designed for one-dimensional layouts?",

          type:
            "mcq",

          options: [
            "Flexbox",
            "Grid",
            "Float",
            "Table"
          ],

          correctAnswer:
            "Flexbox",

          points: 1,

          difficulty:
            "easy",

          tags: [
            "css",
            "flexbox",
            "layout"
          ],

          createdBy:
            recruiterUser._id
        },

        {
          question:
            "Explain the difference between let, const and var in JavaScript.",

          type:
            "spoken",

          expectedAnswer:
            "let and const are block scoped while var is function scoped. let can be reassigned, const cannot be reassigned, and var has function scope with different hoisting behavior.",

          rubric: [
            {
              criterion:
                "Scope",

              points: 1,

              description:
                "Explains the difference between block scope and function scope."
            },

            {
              criterion:
                "Reassignment",

              points: 1,

              description:
                "Explains reassignment differences between let, const and var."
            }
          ],

          points: 2,

          difficulty:
            "medium",

          tags: [
            "javascript",
            "spoken",
            "communication"
          ],

          createdBy:
            recruiterUser._id
        },

        {
          question:
            "Write a JavaScript function to reverse a string.",

          type:
            "coding",

          starterCode:
            `function reverseString(str) {
  // Write your solution here
}`,

          testCases: [
            {
              input:
                "hello",

              expectedOutput:
                "olleh",

              isHidden:
                false
            },

            {
              input:
                "SmartRecruit",

              expectedOutput:
                "tiurceRtramS",

              isHidden:
                true
            },

            {
              input:
                "frontend",

              expectedOutput:
                "dnetnorf",

              isHidden:
                true
            }
          ],

          points: 5,

          difficulty:
            "easy",

          tags: [
            "javascript",
            "coding",
            "strings"
          ],

          createdBy:
            recruiterUser._id
        }
      ]);

    console.log(
      `${questions.length} questions created`
    );

    const assessment =
      await Assessment.create({
        drive:
          drive._id,

        title:
          "Frontend Developer Assessment",

        durationMinutes:
          30,

        instructions:
          "Complete the assessment within 30 minutes. Make sure your camera and microphone are working before you begin. Read each question carefully and submit your answers before the timer expires.",

        questions:
          questions.map(
            (question) =>
              question._id
          ),

        passingPercentage:
          50,

        weights: {
          coding: 40,
          technical: 30,
          communication: 20,
          other: 10
        },

        isPublished:
          true
      });

    console.log(
      "Assessment created:",
      assessment._id.toString()
    );

    console.log("\n========================================");
    console.log("SEED COMPLETED");
    console.log("========================================");

    console.log("\nRecruiter login:");
    console.log(
      "Email: recruiter@smartrecruit.com"
    );
    console.log(
      "Password: Recruiter@123"
    );

    console.log("\nCandidate login:");
    console.log(
      "Email: candidate@smartrecruit.com"
    );
    console.log(
      "Password: Candidate@123"
    );

    console.log("\nAssessment:");
    console.log(
      "ID:",
      assessment._id.toString()
    );

    console.log(
      "Title:",
      assessment.title
    );

    console.log(
      "Duration:",
      assessment.durationMinutes,
      "minutes"
    );

    console.log(
      "Questions:",
      questions.length
    );

    console.log(
      "Drive ID:",
      drive._id.toString()
    );

    console.log("\n========================================");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("\nSeed failed:");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seed();