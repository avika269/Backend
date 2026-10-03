import mongoose from "mongoose";

const proctoringEvaluationSchema =
  new mongoose.Schema(
    {
      attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attempt",
        required: true,
        unique: true
      },

      cameraWorking: {
        type: Boolean,
        default: false
      },

      microphoneWorking: {
        type: Boolean,
        default: false
      },

      faceDetected: {
        type: Boolean,
        default: false
      },

      multipleFacesDetected: {
        type: Boolean,
        default: false
      },

      lookingAwayEvents: {
        type: Number,
        default: 0
      },

      cameraDisconnects: {
        type: Number,
        default: 0
      },

      microphoneDisconnects: {
        type: Number,
        default: 0
      },

      tabSwitches: {
        type: Number,
        default: 0
      },

      fullscreenExits: {
        type: Number,
        default: 0
      },

      totalEvents: {
        type: Number,
        default: 0
      },

      evaluation: {
        type: String,
        enum: [
          "normal",
          "review_required"
        ],
        default: "normal"
      }
    },
    {
      timestamps: true
    }
  );

const ProctoringEvaluation =
  mongoose.model(
    "ProctoringEvaluation",
    proctoringEvaluationSchema
  );

export default ProctoringEvaluation;