import Attempt from "../models/Attempt.js";
import Assessment from "../models/Assessment.js";

const getAttemptWithAssessment =
  async (attemptId, candidateId) => {
    return Attempt.findOne({
      _id: attemptId,
      candidateId
    }).populate(
      "assessmentId"
    );
  };

const checkExpiry = async (
  attempt
) => {
  if (
    attempt.status === "active" &&
    attempt.expiresAt &&
    new Date() >= attempt.expiresAt
  ) {
    attempt.status = "expired";
    await attempt.save();
    return true;
  }

  return false;
};

export const createAttempt =
  async (req, res) => {
    try {
      const {
        assessmentId
      } = req.body;

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message:
            "assessmentId is required"
        });
      }

      const assessment =
        await Assessment.findOne({
          _id: assessmentId,
          active: true
        });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message:
            "Assessment not found"
        });
      }

      const existing =
        await Attempt.findOne({
          candidateId:
            req.user.id,
          assessmentId,
          status: {
            $nin: [
              "submitted",
              "expired"
            ]
          }
        });

      if (existing) {
        return res.json({
          success: true,
          message:
            "Existing attempt found",
          attemptId:
            existing._id,
          status:
            existing.status
        });
      }

      const totalScore =
        assessment.questions.reduce(
          (sum, question) =>
            sum + question.points,
          0
        );

      const attempt =
        await Attempt.create({
          candidateId:
            req.user.id,

          assessmentId,

          candidateName:
            req.user.name,

          candidateEmail:
            req.user.email,

          totalScore,

          status:
            "instructions"
        });

      res.status(201).json({
        success: true,
        message:
          "Assessment attempt created",

        attemptId:
          attempt._id,

        status:
          attempt.status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const getAttempt =
  async (req, res) => {
    try {
      const attempt =
        await getAttemptWithAssessment(
          req.params.attemptId,
          req.user.id
        );

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      await checkExpiry(attempt);

      res.json({
        success: true,
        attempt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const acceptInstructions =
  async (req, res) => {
    try {
      const attempt =
        await Attempt.findOne({
          _id:
            req.params.attemptId,
          candidateId:
            req.user.id
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        attempt.status !==
        "instructions"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Instructions cannot be accepted at this stage"
        });
      }

      attempt.instructionsAccepted =
        true;

      attempt.instructionsAcceptedAt =
        new Date();

      attempt.status =
        "system-check";

      attempt.events.push({
        type:
          "instructions_accepted",

        message:
          "Candidate accepted assessment instructions"
      });

      await attempt.save();

      res.json({
        success: true,
        message:
          "Instructions accepted",
        status:
          attempt.status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const systemCheck =
  async (req, res) => {
    try {
      const attempt =
        await Attempt.findOne({
          _id:
            req.params.attemptId,
          candidateId:
            req.user.id
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        !attempt.instructionsAccepted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Accept instructions first"
        });
      }

      const {
        camera,
        microphone,
        fullscreen,
        browser,
        connection
      } = req.body;

      attempt.checks = {
        camera:
          Boolean(camera),

        microphone:
          Boolean(microphone),

        fullscreen:
          Boolean(fullscreen),

        browser:
          Boolean(browser),

        connection:
          Boolean(connection)
      };

      const allPassed =
        Object.values(
          attempt.checks
        ).every(Boolean);

      attempt.systemCheckCompleted =
        allPassed;

      if (allPassed) {
        attempt.status =
          "overview";
      }

      attempt.events.push({
        type:
          "system_check",

        message:
          allPassed
            ? "All system checks passed"
            : "System check incomplete",

        metadata:
          attempt.checks
      });

      await attempt.save();

      res.json({
        success: true,

        allChecksPassed:
          allPassed,

        checks:
          attempt.checks,

        status:
          attempt.status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const getOverview =
  async (req, res) => {
    try {
      const attempt =
        await getAttemptWithAssessment(
          req.params.attemptId,
          req.user.id
        );

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        !attempt.systemCheckCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complete system checks first"
        });
      }

      const assessment =
        attempt.assessmentId;

      const technicalQuestions =
        assessment.questions.filter(
          q =>
            q.type === "mcq"
        ).length;

      const spokenQuestions =
        assessment.questions.filter(
          q =>
            q.type === "spoken"
        ).length;

      const codingQuestions =
        assessment.questions.filter(
          q =>
            q.type === "coding"
        ).length;

      res.json({
        success: true,

        overview: {
          title:
            assessment.title,

          duration:
            assessment.duration,

          totalQuestions:
            assessment.totalQuestions,

          assessmentType:
            assessment.assessmentType,

          role:
            assessment.role,

          technicalQuestions,

          spokenQuestions,

          codingQuestions,

          sequence: [
            {
              step: 1,
              title:
                "Technical Questions",
              questions:
                technicalQuestions
            },

            {
              step: 2,
              title:
                "Spoken Response",
              questions:
                spokenQuestions
            },

            {
              step: 3,
              title:
                "Coding Challenge",
              questions:
                codingQuestions
            },

            {
              step: 4,
              title:
                "Submit & Review"
            }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const startAssessment =
  async (req, res) => {
    try {
      const attempt =
        await getAttemptWithAssessment(
          req.params.attemptId,
          req.user.id
        );

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        !attempt.instructionsAccepted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Instructions must be accepted"
        });
      }

      if (
        !attempt.systemCheckCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "System checks must be completed"
        });
      }

      if (
        attempt.status ===
        "active"
      ) {
        return res.json({
          success: true,
          message:
            "Assessment already started",
          startedAt:
            attempt.startedAt,
          expiresAt:
            attempt.expiresAt
        });
      }

      if (
        attempt.status ===
          "submitted" ||
        attempt.status ===
          "expired"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assessment cannot be started"
        });
      }

      const startedAt =
        new Date();

      const expiresAt =
        new Date(
          startedAt.getTime() +
            attempt.assessmentId
              .duration *
            60 *
            1000
        );

      attempt.startedAt =
        startedAt;

      attempt.expiresAt =
        expiresAt;

      attempt.status =
        "active";

      attempt.events.push({
        type:
          "assessment_started",

        message:
          "Candidate started assessment"
      });

      await attempt.save();

      res.json({
        success: true,
        message:
          "Assessment started",

        startedAt,

        expiresAt,

        duration:
          attempt.assessmentId
            .duration
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };


export const saveAnswer =
  async (req, res) => {
    try {
      const {
        questionId,
        answer,
        code
      } = req.body;

      const attempt =
        await Attempt.findOne({
          _id:
            req.params.attemptId,
          candidateId:
            req.user.id
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        attempt.status !==
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assessment is not active"
        });
      }

      if (
        await checkExpiry(attempt)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assessment time has expired"
        });
      }

      const assessment =
        await Assessment.findById(
          attempt.assessmentId
        );

      const question =
        assessment.questions.id(
          questionId
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found"
        });
      }

      const existing =
        attempt.answers.find(
          item =>
            item.questionId.toString() ===
            questionId
        );

      if (existing) {
        existing.answer =
          answer || "";

        existing.code =
          code || "";

        existing.savedAt =
          new Date();
      } else {
        attempt.answers.push({
          questionId,

          answer:
            answer || "",

          code:
            code || "",

          savedAt:
            new Date()
        });
      }

      await attempt.save();

      res.json({
        success: true,
        message:
          "Answer saved"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const uploadSpokenAnswer =
  async (req, res) => {
    try {
      const attempt =
        await Attempt.findOne({
          _id:
            req.params.attemptId,
          candidateId:
            req.user.id
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      if (
        attempt.status !==
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assessment is not active"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Audio file is required"
        });
      }

      const {
        questionId
      } = req.body;

      const assessment =
        await Assessment.findById(
          attempt.assessmentId
        );

      const question =
        assessment.questions.id(
          questionId
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found"
        });
      }

      if (
        question.type !==
        "spoken"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Audio can only be uploaded for spoken questions"
        });
      }

      const existing =
        attempt.answers.find(
          item =>
            item.questionId.toString() ===
            questionId
        );

      if (existing) {
        existing.audioFile =
          req.file.path;

        existing.savedAt =
          new Date();
      } else {
        attempt.answers.push({
          questionId,

          audioFile:
            req.file.path,

          savedAt:
            new Date()
        });
      }

      attempt.events.push({
        type:
          "audio_uploaded",

        message:
          "Spoken answer uploaded",

        metadata: {
          questionId,
          filename:
            req.file.filename
        }
      });

      await attempt.save();

      res.json({
        success: true,
        message:
          "Audio uploaded successfully",

        audioFile:
          req.file.path
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const saveProctorEvent =
  async (req, res) => {
    try {
      const {
        type,
        message,
        metadata
      } = req.body;

      const attempt =
        await Attempt.findOne({
          _id:
            req.params.attemptId,
          candidateId:
            req.user.id
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Attempt not found"
        });
      }

      attempt.events.push({
        type,
        message:
          message || "",
        metadata:
          metadata || {},
        timestamp:
          new Date()
      });

      await attempt.save();

      res.json({
        success: true,
        message:
          "Proctoring event recorded"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  