import Attempt from "../models/Attempt.js";
import Evaluation from "../models/Evaluation.js";
import Scorecard from "../models/Scorecard.js";

export const generateScorecard =
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

    const evaluation =
      await Evaluation.findOne({
        attempt:
          attempt._id
      });

    if (!evaluation) {
      return res.status(400).json({
        success: false,
        message:
          "Generate evaluation first"
      });
    }

    const scorecard =
      await Scorecard.findOneAndUpdate(
        {
          attempt:
            attempt._id
        },
        {
          attempt:
            attempt._id,

          candidate:
            attempt.candidate,

          assessment:
            attempt.assessment,

          codingScore:
            evaluation
              .normalizedScores
              .coding,

          technicalScore:
            evaluation
              .normalizedScores
              .technical,

          communicationScore:
            evaluation
              .normalizedScores
              .communication,

          otherScore:
            evaluation
              .normalizedScores
              .other,

          overallScore:
            evaluation.overallScore,

          recommendation:
            evaluation.recommendation,

          evidence: [
            {
              category:
                "coding",

              evidence:
                evaluation
                  .coding
                  .evidence
            },

            {
              category:
                "technical",

              evidence:
                evaluation
                  .technical
                  .evidence
            },

            {
              category:
                "communication",

              evidence:
                evaluation
                  .communication
                  .evidence
            }
          ]
        },
        {
          upsert: true,
          new: true
        }
      );

    res.json({
      success: true,
      message:
        "Scorecard generated",
      data: {
        scorecard
      }
    });
  };

export const getScorecard =
  async (req, res) => {
    const scorecard =
      await Scorecard.findOne({
        attempt:
          req.params.attemptId
      })
        .populate(
          "candidate",
          "name email"
        )
        .populate(
          "assessment",
          "title"
        );

    if (!scorecard) {
      return res.status(404).json({
        success: false,
        message:
          "Scorecard not found"
      });
    }

    res.json({
      success: true,
      data: {
        scorecard
      }
    });
  };

export const updateRecruiterDecision =
  async (req, res) => {
    const {
      decision
    } = req.body;

    if (
      ![
        "pending",
        "shortlisted",
        "rejected"
      ].includes(decision)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid recruiter decision"
      });
    }

    const scorecard =
      await Scorecard.findOneAndUpdate(
        {
          attempt:
            req.params.attemptId
        },
        {
          recruiterDecision:
            decision,

          humanReviewed:
            true
        },
        {
          new: true
        }
      );

    if (!scorecard) {
      return res.status(404).json({
        success: false,
        message:
          "Scorecard not found"
      });
    }

    res.json({
      success: true,
      message:
        "Recruiter decision updated",
      data: {
        scorecard
      }
    });
  };