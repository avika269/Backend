import CandidateInterviewResult from "../models/CandidateInterviewResult.js";

export const getCandidateResults = async (req, res) => {
  try {
    if (!req.user?.id || req.user.role !== "candidate") {
      return res.status(403).json({
        success: false,
        message: "Candidate access is required."
      });
    }

    const result = await CandidateInterviewResult.findOne({
      candidate: req.user.id,
      status: "submitted",
      gradingStatus: "graded"
    })
      .sort({ submittedAt: -1 })
      .populate("candidate", "name email");

    if (!result) {
      return res.json({
        success: true,
        results: null,
        message:
          "No graded interview results are available yet."
      });
    }

    const questions = (result.questions || []).map(
      (question) => ({
        questionText: question.prompt,

        candidateAnswer:
          question.selectedOptionText ||
          (question.selectedOptionId
            ? `Option ${question.selectedOptionId}`
            : "Not answered"),

        correctAnswer:
          question.correctOptionText ||
          "Correct answer unavailable",

        isCorrect: question.isCorrect === true,

        explanation: question.topic
          ? `Topic: ${question.topic}${
              question.difficulty
                ? ` · Difficulty: ${question.difficulty}`
                : ""
            }`
          : ""
      })
    );

    const correctCount = questions.filter(
      (question) => question.isCorrect
    ).length;

    const incorrectCount = questions.length - correctCount;

    const passingThreshold = Number(
      process.env.PASSING_THRESHOLD || 60
    );

    return res.json({
      success: true,

      results: {
        candidateName:
          result.candidate?.name || "Candidate",

        assessmentTitle:
          result.assessmentTitle ||
          "Personalized AI Technical Interview",

        status: result.status,

        overallScore: result.percentage,

        passingThreshold,

        correctCount,

        incorrectCount,

        totalQuestions: questions.length,

        questions,

        statusMessage:
          result.percentage >= passingThreshold
            ? "Passed"
            : "Needs improvement",

        verificationStatus:
          result.proctoringAnalytics
            ? "Proctoring data recorded"
            : "Not recorded",

        syncStatus: "Saved to backend",

        roleMatches: []
      }
    });
  } catch (error) {
    console.error("Get candidate results error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve candidate results."
    });
  }
};