import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
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
});

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },

  message: {
    type: String,
    default: ""
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});

const attemptSchema = new mongoose.Schema(
  {
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

    cameraWorking: {
      type: Boolean,
      default: false
    },

    microphoneWorking: {
      type: Boolean,
      default: false
    },

    fullscreenEnabled: {
      type: Boolean,
      default: false
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

export default mongoose.model("Attempt", attemptSchema);