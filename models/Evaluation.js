import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      unique: true
    },

    technical: {
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
      ]
    },

    coding: {
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
      ]
    },

    communication: {
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
      ]
    },

    other: {
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
      ]
    },

    normalizedScores: {
      coding: {
        type: Number,
        default: 0
      },

      technical: {
        type: Number,
        default: 0
      },

      communication: {
        type: Number,
        default: 0
      },

      other: {
        type: Number,
        default: 0
      }
    },

    overallScore: {
      type: Number,
      default: 0
    },

    recommendation: {
      type: String,
      enum: [
        "strongly_recommended",
        "recommended",
        "needs_review",
        "rejected"
      ],
      default: "needs_review"
    },

    generatedBy: {
      type: String,
      default: "smartrecruit"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Evaluation",
  evaluationSchema
);