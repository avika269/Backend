import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: [
        "created",
        "instructions",
        "system-check",
        "overview",
        "started",
        "submitted",
        "evaluating",
        "evaluated",
        "expired"
      ],
      default: "created"
    },

    instructionsAccepted: {
      type: Boolean,
      default: false
    },

    instructionsAcceptedAt: {
      type: Date,
      default: null
    },

    systemCheckCompleted: {
      type: Boolean,
      default: false
    },

    cameraEnabled: {
      type: Boolean,
      default: false
    },

    microphoneEnabled: {
      type: Boolean,
      default: false
    },

    fullscreenEnabled: {
      type: Boolean,
      default: false
    },

    browserReady: {
      type: Boolean,
      default: false
    },

    connectionStable: {
      type: Boolean,
      default: false
    },

    startedAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      default: null
    },

    submittedAt: {
      type: Date,
      default: null
    },

    score: {
      type: Number,
      default: 0
    },

    totalScore: {
      type: Number,
      default: 0
    },

    percentage: {
      type: Number,
      default: 0
    },

    events: [
      {
        type: {
          type: String,
          required: true
        },

        message: {
          type: String,
          default: ""
        },

        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },

        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

attemptSchema.index({
  candidate: 1,
  assessment: 1
});

export default mongoose.model(
  "Attempt",
  attemptSchema
);