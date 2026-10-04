import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        "technical",
        "mcq",
        "coding",
        "spoken"
      ],
      required: true
    },

    options: {
      type: [String],
      default: []
    },

    correctAnswer: {
      type: String,
      default: null,
      select: false
    },

    expectedAnswer: {
      type: String,
      default: ""
    },

    rubric: [
      {
        criterion: {
          type: String,
          required: true
        },

        points: {
          type: Number,
          required: true
        },

        description: {
          type: String,
          default: ""
        }
      }
    ],

    starterCode: {
      type: String,
      default: ""
    },

    testCases: [
      {
        input: {
          type: String,
          default: ""
        },

        expectedOutput: {
          type: String,
          default: ""
        },

        isHidden: {
          type: Boolean,
          default: true
        }
      }
    ],

    points: {
      type: Number,
      default: 10,
      min: 0
    },

    difficulty: {
      type: String,
      enum: [
        "easy",
        "medium",
        "hard"
      ],
      default: "medium"
    },

    tags: {
      type: [String],
      default: []
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Question",
  questionSchema
);