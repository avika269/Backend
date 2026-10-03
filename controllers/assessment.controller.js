import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";

export const createAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.create(req.body);

    res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(
      req.params.assessmentId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    res.json({
      success: true,
      message: "Assessment updated successfully",
      assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(
      req.params.assessmentId
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    res.json({
      success: true,
      message: "Assessment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      active: true
    });

    if (!assessment) {
      return res.status(404).json({
        message: "Assessment not found"
      });
    }

    const questions = assessment.questions.map((question) => ({
      _id: question._id,
      questionNumber: question.questionNumber,
      type: question.type,
      question: question.question,
      options: question.options,
      points: question.points,
      timeLimit: question.timeLimit
    }));

    res.json({
      id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      assessmentType: assessment.assessmentType,
      questions
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const createAttempt = async (req, res) => {
  try {
    const {
      assessmentId,
      candidateName,
      candidateEmail
    } = req.body;

    if (
      !assessmentId ||
      !candidateName ||
      !candidateEmail
    ) {
      return res.status(400).json({
        message:
          "Assessment ID, candidate name and email are required"
      });
    }

    const assessment = await Assessment.findById(
      assessmentId
    );

    if (!assessment) {
      return res.status(404).json({
        message: "Assessment not found"
      });
    }

    const attempt = await Attempt.create({
       userId: req.user?.id || null,
      assessmentId,
      candidateName,
      candidateEmail,
      status: "instructions"
    });

    res.status(201).json({
      message: "Attempt created",
      attemptId: attempt._id,
      status: attempt.status
    });

  } catch (error) {
     console.error(
      "Create attempt error:",
      error
    );
    res.status(500).json({
      message: error.message
    });
  }
};


export const acceptInstructions = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    if (attempt.status !== "instructions") {
      return res.status(400).json({
        message: "Instructions have already been completed"
      });
    }

    attempt.instructionsAccepted = true;

    attempt.instructionsAcceptedAt = new Date();

    attempt.status = "system-check";

    attempt.events.push({
      type: "INSTRUCTIONS_ACCEPTED",
      message: "Candidate accepted assessment instructions"
    });

    await attempt.save();

    res.json({
      message: "Instructions accepted",
      status: attempt.status
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const systemCheck = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const {
      cameraWorking,
      microphoneWorking,
      fullscreenEnabled
    } = req.body;

    const attempt = await Attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    if (attempt.status !== "system-check") {
      return res.status(400).json({
        message: "System check is not currently active"
      });
    }

    attempt.cameraWorking =
      cameraWorking === true;

    attempt.microphoneWorking =
      microphoneWorking === true;

    attempt.fullscreenEnabled =
      fullscreenEnabled === true;

    attempt.systemCheckCompleted =
      attempt.cameraWorking &&
      attempt.microphoneWorking &&
      attempt.fullscreenEnabled;

    attempt.events.push({
      type: "SYSTEM_CHECK",
      message: JSON.stringify({
        cameraWorking,
        microphoneWorking,
        fullscreenEnabled
      })
    });

    await attempt.save();

    res.json({
      cameraWorking: attempt.cameraWorking,
      microphoneWorking: attempt.microphoneWorking,
      fullscreenEnabled: attempt.fullscreenEnabled,
      systemCheckCompleted:
        attempt.systemCheckCompleted
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const startAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(
      attemptId
    ).populate("assessmentId");

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    if (!attempt.instructionsAccepted) {
      return res.status(400).json({
        message: "Instructions must be accepted first"
      });
    }

    if (!attempt.systemCheckCompleted) {
      return res.status(400).json({
        message: "Complete the system check first"
      });
    }

    if (attempt.status === "active") {
      return res.json({
        message: "Assessment already started",
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt
      });
    }

    if (
      attempt.status === "submitted" ||
      attempt.status === "expired"
    ) {
      return res.status(400).json({
        message: "This attempt is already closed"
      });
    }

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() +
      attempt.assessmentId.duration * 60 * 1000
    );

    attempt.startedAt = now;
    attempt.expiresAt = expiresAt;
    attempt.status = "active";

    attempt.events.push({
      type: "ASSESSMENT_STARTED",
      message: "Candidate started assessment"
    });

    await attempt.save();

    res.json({
      message: "Assessment started",
      startedAt: now,
      expiresAt,
      duration:
        attempt.assessmentId.duration
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const {
      questionId,
      answer,
      code
    } = req.body;

    const attempt = await Attempt.findById(
      attemptId
    );

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    if (attempt.status !== "active") {
      return res.status(400).json({
        message: "Assessment is not active"
      });
    }

    if (
      attempt.expiresAt &&
      new Date() >= attempt.expiresAt
    ) {
      attempt.status = "expired";

      await attempt.save();

      return res.status(400).json({
        message: "Assessment time has expired"
      });
    }

    let existingAnswer =
      attempt.answers.find(
        (item) =>
          item.questionId.toString() ===
          questionId
      );

    if (existingAnswer) {
      existingAnswer.answer =
        answer || existingAnswer.answer;

      existingAnswer.code =
        code || existingAnswer.code;

      existingAnswer.savedAt = new Date();

    } else {
      attempt.answers.push({
        questionId,
        answer: answer || "",
        code: code || "",
        savedAt: new Date()
      });
    }

    await attempt.save();

    res.json({
      message: "Answer saved",
      savedAt: new Date()
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const saveProctorEvent = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const {
      type,
      message
    } = req.body;

    const attempt = await Attempt.findById(
      attemptId
    );

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    attempt.events.push({
      type,
      message: message || ""
    });

    await attempt.save();

    res.json({
      message: "Event recorded"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const submitAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(
      attemptId
    ).populate("assessmentId");

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    if (
      attempt.status === "submitted" ||
      attempt.status === "expired"
    ) {
      return res.status(400).json({
        message: "Assessment already closed"
      });
    }

    let score = 0;
    let totalScore = 0;

    for (
      const question
      of attempt.assessmentId.questions
    ) {

      totalScore += question.points;

      const answer =
        attempt.answers.find(
          (item) =>
            item.questionId.toString() ===
            question._id.toString()
        );

      if (!answer) {
        continue;
      }

      if (
        question.type === "mcq" &&
        answer.answer ===
        question.correctAnswer
      ) {
        score += question.points;
      }
    }

    attempt.score = score;
    attempt.totalScore = totalScore;

    attempt.status = "submitted";

    attempt.submittedAt = new Date();

    attempt.events.push({
      type: "ASSESSMENT_SUBMITTED",
      message: "Candidate submitted assessment"
    });

    await attempt.save();

    res.json({
      message:
        "Assessment submitted successfully",

      score,

      totalScore,

      submittedAt:
        attempt.submittedAt
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const getAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(
      req.params.attemptId
    ).populate("assessmentId");

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found"
      });
    }

    res.json(attempt);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};