import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true },
    topic: { type: String, default: "" },
    difficulty: { type: String, default: "" },
    options: [{ id: String, title: String }],
    selectedOptionId: { type: String, default: "" },
    selectedOptionText: { type: String, default: "" },
    correctOptionId: { type: String, default: "" },
    correctOptionText: { type: String, default: "" },
    isCorrect: { type: Boolean, default: null },
    responseStatus: {
      type: String,
      enum: ["saved", "skipped", "unattempted"],
      default: "unattempted"
    },
    points: { type: Number, default: 0, min: 0, max: 100 },
    pointsAwarded: { type: Number, default: 0, min: 0, max: 100 }
  },
  { _id: false }
);

const candidateInterviewResultSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateProfile",
      default: null
    },
    sessionId: { type: String, required: true, trim: true, maxlength: 120 },
    candidateJobRole: { type: String, default: "", maxlength: 200 },
    assessmentTitle: {
      type: String,
      default: "Personalized AI Technical Interview",
      maxlength: 200
    },
    source: { type: String, default: "personalized-ai-interview" },
    status: { type: String, enum: ["submitted"], default: "submitted" },
    legacySummaryOnly: { type: Boolean, default: false },
    questions: { type: [answerSchema], default: [] },
    totalQuestions: { type: Number, default: 0, min: 0 },
    answeredQuestions: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: null, min: 0 },
    maxScore: { type: Number, default: null, min: 0 },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    gradingStatus: {
      type: String,
      enum: ["graded", "ungraded"],
      default: "ungraded"
    },
    gradedAt: { type: Date, default: null },
    proctoringAnalytics: { type: mongoose.Schema.Types.Mixed, default: {} },
    receiptRef: { type: String, required: true, unique: true },
    submittedAt: { type: Date, default: Date.now },
    recruiterDecision: {
      type: String,
      enum: ["pending", "shortlisted", "rejected"],
      default: "pending"
    },
    recruiterNote: { type: String, default: "", maxlength: 4000 },
    humanReviewed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

candidateInterviewResultSchema.index(
  { candidate: 1, sessionId: 1 },
  { unique: true }
);

export default mongoose.model(
  "CandidateInterviewResult",
  candidateInterviewResultSchema
);