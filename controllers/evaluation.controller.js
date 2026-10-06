import Attempt from "../models/Attempt.js";
import Assessment from "../models/Assessment.js";
import Submission from "../models/Submission.js";
import Evaluation from "../models/Evaluation.js";

import {
  calculateOverallScore,
  getRecommendation
} from "../services/scoringService.js";

export const generateEvaluation =
  async (req, res) => {
    const attempt =
      await Attempt.findById(
        req.params.attemptId
      );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Attempt not found"
      });
    }

    const assessment =
      await Assessment.findById(
        attempt.assessment
      );

    const submissions =
      await Submission.find({
        attempt: attempt._id
      }).populate(
        "question"
      );

    const coding = {
      score: 0,
      maxScore: 0
    };

    const technical = {
      score: 0,
      maxScore: 0
    };

    const communication = {
      score: 0,
      maxScore: 0
    };

    const other = {
      score: 0,
      maxScore: 0
    };

    const codingEvidence = [];
    const technicalEvidence = [];
    const communicationEvidence = [];

    for (
      const submission
      of submissions
    ) {
      const type =
        submission.question.type;

      if (
        type === "coding"
      ) {
        coding.score +=
          submission.score;

        coding.maxScore +=
          submission.maxScore;

        codingEvidence.push(
          ...submission.evidence
        );
      }

      if (
        type === "technical" ||
        type === "mcq"
      ) {
        technical.score +=
          submission.score;

        technical.maxScore +=
          submission.maxScore;

        technicalEvidence.push(
          ...submission.evidence
        );
      }

      if (
        type === "spoken"
      ) {
        communication.score +=
          submission.score;

        communication.maxScore +=
          submission.maxScore;

        communicationEvidence.push(
          ...submission.evidence
        );
      }
    }

    const {
      normalized,
      overall
    } =
      calculateOverallScore({
        coding,
        technical,
        communication,
        other
      });

    const recommendation =
      getRecommendation(
        overall
      );

    const evaluation =
      await Evaluation.findOneAndUpdate(
        {
          attempt: attempt._id
        },
        {
          attempt:
            attempt._id,

          coding: {
            ...coding,
            evidence:
              codingEvidence
          },

          technical: {
            ...technical,
            evidence:
              technicalEvidence
          },

          communication: {
            ...communication,
            evidence:
              communicationEvidence
          },

          other,

          normalizedScores:
            normalized,

          overallScore:
            overall,

          recommendation
        },
        {
          upsert: true,
          new: true
        }
      );

    attempt.status =
      "evaluated";

    attempt.score =
      overall;

    attempt.totalScore = 100;

    attempt.percentage =
      overall;

    await attempt.save();

    res.json({
      success: true,
      message:
        "Evaluation generated",
      data: {
        evaluation,
        assessment
      }
    });
  };

export const getEvaluation =
  async (req, res) => {
    const evaluation =
      await Evaluation.findOne({
        attempt:
          req.params.attemptId
      });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message:
          "Evaluation not found"
      });
    }

    res.json({
      success: true,
      data: {
        evaluation
      }
    });
  };