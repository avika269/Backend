import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import Submission from "../models/Submission.js";

const getAttemptWithAssessment = async (
  attemptId,
  candidateId
) => {
  return Attempt.findOne({
    _id: attemptId,
    candidate: candidateId
  }).populate({
    path: "assessment",
    populate: {
      path: "questions",
      select: "-correctAnswer -testCases.expectedOutput"
    }
  });
};

const checkExpiry = async (attempt) => {
  if (
    attempt.status === "started" &&
    attempt.expiresAt &&
    new Date() >= attempt.expiresAt
  ) {
    attempt.status = "expired";

    await attempt.save();

    return true;
  }

  return false;
};




export const createAttempt = async (req, res) => {
  try {
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "assessmentId is required"
      });
    }

    const assessment = await Assessment.findById(
      assessmentId
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    if (!assessment.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Assessment is not published"
      });
    }

    const existing = await Attempt.findOne({
      candidate: req.user.id,
      assessment: assessmentId,
      status: {
        $nin: [
          "submitted",
          "evaluating",
          "evaluated",
          "expired"
        ]
      }
    });

    if (existing) {
      return res.json({
        success: true,
        message: "Existing attempt found",
        data: {
          attemptId: existing._id,
          status: existing.status
        }
      });
    }

    const totalScore =
      assessment.questions.reduce(
        (sum, question) =>
          sum + (question.points || 0),
        0
      );

    const attempt = await Attempt.create({
      candidate: req.user.id,
      assessment: assessment._id,
      totalScore,
      status: "instructions"
    });

    return res.status(201).json({
      success: true,
      message: "Assessment attempt created",
      data: {
        attemptId: attempt._id,
        status: attempt.status
      }
    });
  } catch (error) {
    console.error("Create attempt error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getAttempt = async (req, res) => {
  try {
    const attempt =
      await getAttemptWithAssessment(
        req.params.attemptId,
        req.user.id
      );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    await checkExpiry(attempt);

    return res.json({
      success: true,
      data: {
        attempt
      }
    });
  } catch (error) {
    console.error("Get attempt error:", error);

    return res.status(500).json({
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
        ![
          "instructions",
          "created"
        ].includes(attempt.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Instructions cannot be accepted at this stage"
        });
      }

      attempt.instructionsAccepted = true;
      attempt.instructionsAcceptedAt =
        new Date();

      attempt.status = "system-check";

      attempt.events.push({
        type: "instructions_accepted",
        message:
          "Candidate accepted assessment instructions"
      });

      await attempt.save();

      return res.json({
        success: true,
        message: "Instructions accepted",
        data: {
          status: attempt.status
        }
      });
    } catch (error) {
      console.error(
        "Accept instructions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };



export const systemCheck = async (
  req,
  res
) => {
  try {
    const {
      cameraEnabled,
      microphoneEnabled,
      fullscreenEnabled,
      browserReady,
      connectionStable
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

    if (!attempt.instructionsAccepted) {
      return res.status(400).json({
        success: false,
        message: "Accept instructions first"
      });
    }

    attempt.cameraEnabled =
      Boolean(cameraEnabled);

    attempt.microphoneEnabled =
      Boolean(microphoneEnabled);

    attempt.fullscreenEnabled =
      Boolean(fullscreenEnabled);

    attempt.browserReady =
      Boolean(browserReady);

    attempt.connectionStable =
      Boolean(connectionStable);

    const allPassed =
      attempt.cameraEnabled &&
      attempt.microphoneEnabled &&
      attempt.fullscreenEnabled &&
      attempt.browserReady &&
      attempt.connectionStable;

    attempt.systemCheckCompleted =
      allPassed;

    if (allPassed) {
      attempt.status = "overview";
    }

    attempt.events.push({
      type: "system_check",
      message: allPassed
        ? "All system checks passed"
        : "System check incomplete",
      metadata: {
        cameraEnabled:
          attempt.cameraEnabled,
        microphoneEnabled:
          attempt.microphoneEnabled,
        fullscreenEnabled:
          attempt.fullscreenEnabled,
        browserReady:
          attempt.browserReady,
        connectionStable:
          attempt.connectionStable
      }
    });

    await attempt.save();

    return res.json({
      success: true,
      allChecksPassed: allPassed,
      data: {
        status: attempt.status,
        checks: {
          cameraEnabled:
            attempt.cameraEnabled,
          microphoneEnabled:
            attempt.microphoneEnabled,
          fullscreenEnabled:
            attempt.fullscreenEnabled,
          browserReady:
            attempt.browserReady,
          connectionStable:
            attempt.connectionStable
        }
      }
    });
  } catch (error) {
    console.error(
      "System check error:",
      error
    );

    return res.status(500).json({
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
          message: "Attempt not found"
        });
      }

      if (!attempt.instructionsAccepted) {
        return res.status(400).json({
          success: false,
          message:
            "Instructions must be accepted"
        });
      }

      if (!attempt.systemCheckCompleted) {
        return res.status(400).json({
          success: false,
          message:
            "System checks must be completed"
        });
      }

      if (attempt.status === "started") {
        return res.json({
          success: true,
          message:
            "Assessment already started",
          data: {
            startedAt:
              attempt.startedAt,
            expiresAt:
              attempt.expiresAt
          }
        });
      }

      if (
        [
          "submitted",
          "evaluating",
          "evaluated",
          "expired"
        ].includes(attempt.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assessment cannot be started"
        });
      }

      const startedAt = new Date();

      const expiresAt = new Date(
        startedAt.getTime() +
        attempt.assessment.durationMinutes *
          60 *
          1000
      );

      attempt.startedAt = startedAt;
      attempt.expiresAt = expiresAt;
      attempt.status = "started";

      attempt.events.push({
        type: "assessment_started",
        message:
          "Candidate started assessment"
      });

      await attempt.save();

      return res.json({
        success: true,
        message: "Assessment started",
        data: {
          startedAt,
          expiresAt,
          durationMinutes:
            attempt.assessment
              .durationMinutes
        }
      });
    } catch (error) {
      console.error(
        "Start assessment error:",
        error
      );

      return res.status(500).json({
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
          message: "Attempt not found"
        });
      }

      if (!attempt.systemCheckCompleted) {
        return res.status(400).json({
          success: false,
          message:
            "Complete system checks first"
        });
      }

      const assessment =
        attempt.assessment;

      const technicalQuestions =
        assessment.questions.filter(
          question =>
            question.type === "technical" ||
            question.type === "mcq"
        ).length;

      const spokenQuestions =
        assessment.questions.filter(
          question =>
            question.type === "spoken"
        ).length;

      const codingQuestions =
        assessment.questions.filter(
          question =>
            question.type === "coding"
        ).length;

      return res.json({
        success: true,
        data: {
          overview: {
            title: assessment.title,
            durationMinutes:
              assessment.durationMinutes,
            totalQuestions:
              assessment.questions.length,

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
        }
      });
    } catch (error) {
      console.error(
        "Get overview error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };



export const saveAnswer = async (
  req,
  res
) => {
  try {
    const {
      questionId,
      answer = "",
      code = "",
      language = "",
      audioUrl = ""
    } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "questionId is required"
      });
    }

    const attempt =
      await Attempt.findOne({
        _id: req.params.attemptId,
        candidate: req.user.id
      }).populate("assessment");

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

    if (await checkExpiry(attempt)) {
      return res.status(400).json({
        success: false,
        message:
          "Assessment time has expired"
      });
    }

    const question =
      await mongooseQuestion(
        questionId,
        attempt.assessment
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
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
          audioUrl
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

    return res.json({
      success: true,
      message: "Answer saved",
      data: {
        submission
      }
    });
  } catch (error) {
    console.error(
      "Save answer error:",
      error
    );

    return res.status(500).json({
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
        message = "",
        metadata = {}
      } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Event type is required"
        });
      }

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

      attempt.events.push({
        type,
        message,
        metadata,
        timestamp: new Date()
      });

      await attempt.save();

      return res.json({
        success: true,
        message:
          "Proctoring event recorded"
      });
    } catch (error) {
      console.error(
        "Save proctor event error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };




export const submitAssessment =
  async (req, res) => {
    try {
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

      if (await checkExpiry(attempt)) {
        return res.status(400).json({
          success: false,
          message:
            "Assessment has expired"
        });
      }

      attempt.status = "evaluating";
      attempt.submittedAt = new Date();

      await attempt.save();

      return res.json({
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
    } catch (error) {
      console.error(
        "Submit assessment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };




const mongooseQuestion = async (
  questionId,
  assessment
) => {
  const Question =
    (await import("../models/Question.js"))
      .default;

  return Question.findOne({
    _id: questionId,
    _id: {
      $in: assessment.questions
    }
  }).select(
    "-correctAnswer -testCases.expectedOutput"
  );
};