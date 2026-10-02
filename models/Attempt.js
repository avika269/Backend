import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
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

    audioFile: {
      type: String,
      default: ""
    },

    savedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const eventSchema = new mongoose.Schema(
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
  },
  {
    _id: false
  }
);

const attemptSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },

    candidateName: {
      type: String,
      required: true
    },

    candidateEmail: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "instructions",
        "system-check",
        "overview",
        "active",
        "submitted",
        "expired"
      ],
      default: "instructions"
    },

    instructionsAccepted: {
      type: Boolean,
      default: false
    },

    instructionsAcceptedAt: {
      type: Date,
      default: null
    },

    checks: {
      camera: {
        type: Boolean,
        default: false
      },

      microphone: {
        type: Boolean,
        default: false
      },

      fullscreen: {
        type: Boolean,
        default: false
      },

      browser: {
        type: Boolean,
        default: false
      },

      connection: {
        type: Boolean,
        default: false
      }
    },

    systemCheckCompleted: {
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

    answers: {
      type: [answerSchema],
      default: []
    },

    events: {
      type: [eventSchema],
      default: []
    },

    score: {
      type: Number,
      default: 0
    },

    totalScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Attempt",
  attemptSchema
);