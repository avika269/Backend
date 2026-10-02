import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },

  type: {
    type: String,
    enum: ["mcq", "spoken", "coding"],
    required: true
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
    default: 0
  }
});

const assessmentSchema = new mongoose.Schema(
  {
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
      default: 30
    },

    totalQuestions: {
      type: Number,
      default: 6
    },

    assessmentType: {
      type: String,
      default: "Technical Screening"
    },

    questions: {
      type: [questionSchema],
      default: []
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Assessment", assessmentSchema);