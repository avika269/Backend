import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import Submission from "../models/Submission.js";

import {
  evaluateCodingSubmission
} from "../services/codeExecutionService.js";

import {
  evaluateTechnicalAnswer
} from "../services/answerEvaluationService.js";

export const saveAnswer = async (
  req,
  res
) => {
  const {
    questionId,
    answer = "",
    code = "",
    language = "",
    audioUrl = ""
  } = req.body;

  const attempt =
    await Attempt.findOne({
      _id: req.params.attemptId,
      candidate: req.user.id
    });

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Attempt not found"
    });
  }

  if (attempt.status !== "started") {
    return res.status(400).json({
      success: false,
      message:
        "Assessment is not active"
    });
  }

  if (
    attempt.expiresAt &&
    new Date() >
      attempt.expiresAt
  ) {
    attempt.status =
      "expired";

    await attempt.save();

    return res.status(400).json({
      success: false,
      message:
        "Assessment has expired"
    });
  }

  const question =
    await Question.findById(
      questionId
    ).select(
      "+correctAnswer +testCases.expectedOutput"
    );

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found"
    });
  }

  let score = 0;
  let evaluated = false;
  let evidence = [];
  let executionResult = {
    passedTests: 0,
    totalTests: 0,
    runtimeMs: 0,
    memoryKb: 0,
    status: ""
  };

  if (
    question.type === "coding"
  ) {
    const result =
      await evaluateCodingSubmission({
        code,
        language,
        testCases:
          question.testCases
      });

    score = result.score;
    evaluated =
      result.evaluated;

    evidence =
      result.evidence;

    executionResult =
      result.executionResult;
  }

  if (
    question.type === "technical" ||
    question.type === "mcq"
  ) {
    const result =
      await evaluateTechnicalAnswer({
        question,
        answer
      });

    score = result.score;
    evaluated =
      result.evaluated;

    evidence =
      result.evidence;
  }

  const submission =
    await Submission.findOneAndUpdate(
      {
        attempt: attempt._id,
        question: question._id
      },
      {
        attempt: attempt._id,
        question: question._id,
        answer,
        code,
        language,
        audioUrl,
        score,
        maxScore: question.points,
        evaluated,
        evidence,
        executionResult
      },
      {
        new: true,
        upsert: true
      }
    );

  res.json({
    success: true,
    message: "Answer saved",
    data: {
      submission
    }
  });
};

export const submitAssessment =
  async (req, res) => {
    const attempt =
      await Attempt.findOne({
        _id: req.params.attemptId,
        candidate: req.user.id
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    if (
      [
        "submitted",
        "evaluating",
        "evaluated"
      ].includes(attempt.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Assessment already submitted"
      });
    }

    attempt.status =
      "evaluating";

    attempt.submittedAt =
      new Date();

    await attempt.save();

    res.json({
      success: true,
      message:
        "Assessment submitted successfully",
      data: {
        attemptId:
          attempt._id,
        status:
          attempt.status
      }
    });
  };