import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import Drive from "../models/Drive.js";

export const createAssessment = async (
  req,
  res
) => {
  const {
    driveId,
    title,
    durationMinutes,
    instructions,
    questions,
    weights
  } = req.body;

  const drive =
    await Drive.findById(
      driveId
    );

  if (!drive) {
    return res.status(404).json({
      success: false,
      message: "Drive not found"
    });
  }

  const existing =
    await Assessment.findOne({
      drive: driveId
    });

  if (existing) {
    return res.status(409).json({
      success: false,
      message:
        "Assessment already exists for this drive"
    });
  }

  const assessment =
    await Assessment.create({
      drive: driveId,
      title,
      durationMinutes,
      instructions,
      questions,
      weights
    });

  res.status(201).json({
    success: true,
    message: "Assessment created",
    data: { assessment }
  });
};

export const getAssessment = async (
  req,
  res
) => {
  const assessment =
    await Assessment.findById(
      req.params.id
    ).populate({
      path: "questions",
      select:
        "-correctAnswer -testCases.expectedOutput"
    });

  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: "Assessment not found"
    });
  }

  res.json({
    success: true,
    data: { assessment }
  });
};

export const startAssessment = async (
  req,
  res
) => {
  const assessment =
    await Assessment.findById(
      req.params.id
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
      message:
        "Assessment is not published"
    });
  }

  let attempt =
    await Attempt.findOne({
      candidate: req.user.id,
      assessment: assessment._id,
      status: {
        $in: [
          "created",
          "started"
        ]
      }
    });

  if (attempt) {
    return res.json({
      success: true,
      message:
        "Existing attempt returned",
      data: { attempt }
    });
  }

  const startedAt =
    new Date();

  const expiresAt =
    new Date(
      startedAt.getTime() +
      assessment.durationMinutes *
        60 *
        1000
    );

  attempt =
    await Attempt.create({
      candidate: req.user.id,
      assessment: assessment._id,
      status: "started",
      startedAt,
      expiresAt
    });

  res.status(201).json({
    success: true,
    message:
      "Assessment started",
    data: {
      attempt,
      expiresAt
    }
  });
};

export const acceptInstructions =
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

    attempt.instructionsAccepted =
      true;

    await attempt.save();

    res.json({
      success: true,
      message:
        "Instructions accepted"
    });
  };

export const completeSystemCheck =
  async (req, res) => {
    const {
      cameraEnabled,
      microphoneEnabled,
      fullscreenEnabled
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

    attempt.cameraEnabled =
      Boolean(cameraEnabled);

    attempt.microphoneEnabled =
      Boolean(microphoneEnabled);

    attempt.fullscreenEnabled =
      Boolean(fullscreenEnabled);

    attempt.systemCheckCompleted =
      true;

    await attempt.save();

    res.json({
      success: true,
      message:
        "System check completed",
      data: {
        cameraEnabled:
          attempt.cameraEnabled,
        microphoneEnabled:
          attempt.microphoneEnabled,
        fullscreenEnabled:
          attempt.fullscreenEnabled
      }
    });
  };