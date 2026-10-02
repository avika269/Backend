import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["mcq", "spoken", "coding"],
      required: true
    },

    category: {
      type: String,
      default: "Technical Knowledge"
    },

    question: {
      type: String,
      required: true
    },

    options: {
      type: [String],
      default: []
    },

    correctAnswer: {
      type: String,
      default: null
    },

    points: {
      type: Number,
      default: 1
    },

    timeLimit: {
      type: Number,
      default: null
    },

    order: {
      type: Number,
      default: 0
    }
  },
  {
    _id: true
  }
);

const assessmentSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    duration: {
      type: Number,
      required: true
    },

    totalQuestions: {
      type: Number,
      default: 0
    },

    assessmentType: {
      type: String,
      default: "Technical Screening"
    },

    role: {
      type: String,
      default: "Frontend Developer"
    },

    active: {
      type: Boolean,
      default: true
    },

    questions: {
      type: [questionSchema],
      default: []
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