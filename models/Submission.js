import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },

    answer: {
      type: String,
      default: ""
    },

    code: {
      type: String,
      default: ""
    },

    language: {
      type: String,
      default: ""
    },

    audioUrl: {
      type: String,
      default: ""
    },

    executionResult: {
      passedTests: {
        type: Number,
        default: 0
      },

      totalTests: {
        type: Number,
        default: 0
      },

      runtimeMs: {
        type: Number,
        default: 0
      },

      memoryKb: {
        type: Number,
        default: 0
      },

      status: {
        type: String,
        default: ""
      }
    },

    score: {
      type: Number,
      default: 0
    },

    maxScore: {
      type: Number,
      default: 0
    },

    evidence: [
      {
        type: String
      }
    ],

    evaluated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

submissionSchema.index(
  {
    attempt: 1,
    question: 1
  },
  {
    unique: true
  }
);

export default mongoose.model(
  "Submission",
  submissionSchema
);