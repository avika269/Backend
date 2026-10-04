import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
      unique: true
    },

    title: {
      type: String,
      required: true
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1
    },

    instructions: {
      type: String,
      default: ""
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      }
    ],

    passingPercentage: {
      type: Number,
      default: 50
    },

    weights: {
      coding: {
        type: Number,
        default: 40
      },

      technical: {
        type: Number,
        default: 30
      },

      communication: {
        type: Number,
        default: 20
      },

      other: {
        type: Number,
        default: 10
      }
    },

    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Assessment",
  assessmentSchema
);