import mongoose from "mongoose";

const scorecardSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      unique: true
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },

    codingScore: {
      type: Number,
      default: 0
    },

    technicalScore: {
      type: Number,
      default: 0
    },

    communicationScore: {
      type: Number,
      default: 0
    },

    otherScore: {
      type: Number,
      default: 0
    },

    overallScore: {
      type: Number,
      default: 0
    },

    recommendation: {
      type: String,
      default: "needs_review"
    },

    evidence: [
      {
        category: String,
        questionId: mongoose.Schema.Types.ObjectId,
        evidence: [String]
      }
    ],

    humanReviewed: {
      type: Boolean,
      default: false
    },

    recruiterDecision: {
      type: String,
      enum: [
        "pending",
        "shortlisted",
        "rejected"
      ],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Scorecard",
  scorecardSchema
);