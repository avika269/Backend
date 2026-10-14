
import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import Drive from "../models/Drive.js";

export const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(
      req.params.id
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment deleted successfully"
    });
  } catch (error) {
    console.error("Delete assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete assessment"
    });
  }
};

export const createAssessment = async (req, res) => {
  try {
    const {
      driveId,
      title,
      durationMinutes,
      instructions,
      questions,
      weights
    } = req.body;

    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: "driveId is required"
      });
    }

    const drive = await Drive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found"
      });
    }

    const existing = await Assessment.findOne({
      drive: driveId
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Assessment already exists for this drive"
      });
    }

    const assessment = await Assessment.create({
      drive: driveId,
      title,
      durationMinutes,
      instructions,
      questions,
      weights
    });

    return res.status(201).json({
      success: true,
      message: "Assessment created",
      data: { assessment }
    });
  } catch (error) {
    console.error("Create assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create assessment"
    });
  }
};

export const getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(
      req.params.id
    ).populate({
      path: "questions",
      select: "-correctAnswer -testCases.expectedOutput"
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: { assessment }
    });
  } catch (error) {
    console.error("Get assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assessment"
    });
  }
};

export const updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
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

    return res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      assessment
    });
  } catch (error) {
    console.error("Update assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update assessment"
    });
  }
};

export const startAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(
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
        message: "Assessment is not published"
      });
    }

    let attempt = await Attempt.findOne({
      candidate: req.user.id,
      assessment: assessment._id,
      status: {
        $in: ["created", "started"]
      }
    });

    if (attempt) {
      return res.status(200).json({
        success: true,
        message: "Existing attempt returned",
        data: { attempt }
      });
    }

    const startedAt = new Date();

    const expiresAt = new Date(
      startedAt.getTime() +
      assessment.durationMinutes * 60 * 1000
    );

    attempt = await Attempt.create({
      candidate: req.user.id,
      assessment: assessment._id,
      status: "started",
      startedAt,
      expiresAt
    });

    return res.status(201).json({
      success: true,
      message: "Assessment started",
      data: {
        attempt,
        expiresAt
      }
    });
  } catch (error) {
    console.error("Start assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start assessment"
    });
  }
};

export const acceptInstructions = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      candidate: req.user.id
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    attempt.instructionsAccepted = true;
    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "Instructions accepted"
    });
  } catch (error) {
    console.error("Accept instructions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept instructions"
    });
  }
};

export const completeSystemCheck = async (req, res) => {
  try {
    const {
      cameraEnabled,
      microphoneEnabled,
      fullscreenEnabled
    } = req.body;

    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      candidate: req.user.id
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    attempt.cameraEnabled = Boolean(cameraEnabled);
    attempt.microphoneEnabled = Boolean(microphoneEnabled);
    attempt.fullscreenEnabled = Boolean(fullscreenEnabled);
    attempt.systemCheckCompleted = true;

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "System check completed",
      data: {
        cameraEnabled: attempt.cameraEnabled,
        microphoneEnabled: attempt.microphoneEnabled,
        fullscreenEnabled: attempt.fullscreenEnabled
      }
    });
  } catch (error) {
    console.error("Complete system check error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete system check"
    });
  }
};

export const generateAssessment = async (req, res) => {
  try {
    const candidateId = req.user?.id;

    if (!candidateId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { driveId } = req.body || {};

    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: "driveId is required"
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(String(driveId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid driveId"
      });
    }

    const drive = await Drive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found"
      });
    }

    const assessment = await Assessment.findOne({
      drive: drive._id
    }).populate({
      path: "questions",
      select: "-correctAnswer -testCases.expectedOutput"
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "No assessment exists for this drive yet"
      });
    }

    if (!assessment.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Assessment has not been published"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment retrieved successfully",
      assessmentId: assessment._id.toString(),
      data: {
        assessmentId: assessment._id.toString(),
        assessment
      }
    });
  } catch (error) {
    console.error("Generate assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assessment"
    });
  }
};