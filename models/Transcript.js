import mongoose from "mongoose";

const transcriptSchema = new mongoose.Schema(
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

    audioUrl: {
      type: String,
      default: ""
    },

    text: {
      type: String,
      required: true
    },

    confidence: {
      type: Number,
      default: 0
    },

    provider: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Transcript",
  transcriptSchema
);