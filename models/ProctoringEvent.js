import mongoose from "mongoose";

const proctoringEventSchema =
  new mongoose.Schema(
    {
      attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attempt",
        required: true
      },

      type: {
        type: String,
        required: true,
        enum: [
          "camera",
          "microphone",
          "tab_switch",
          "fullscreen_exit",
          "face",
          "multiple_faces",
          "looking_away",
          "browser"
        ]
      },

      message: {
        type: String,
        required: true
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed
      },

      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    {
      timestamps: true
    }
  );

const ProctoringEvent =
  mongoose.model(
    "ProctoringEvent",
    proctoringEventSchema
  );

export default ProctoringEvent;