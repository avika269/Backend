import ProctoringEvent from "../models/ProctoringEvent.js";
import ProctoringEvaluation from "../models/ProctoringEvaluation.js";
import Attempt from "../models/Attempt.js";

export const createProctoringEvent = async (
  req,
  res
) => {
  try {
    const { attemptId } = req.params;

    const {
      type,
      message,
      metadata
    } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Event type and message are required"
      });
    }

    const attempt =
      await Attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    const event =
      await ProctoringEvent.create({
        attemptId,
        type,
        message,
        metadata
      });

    res.status(201).json({
      success: true,
      message:
        "Proctoring event saved",
      event
    });
  } catch (error) {
    console.error(
      "Proctoring event error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to save proctoring event"
    });
  }
};

export const getProctoringEvaluation =
  async (req, res) => {
    try {
      const { attemptId } = req.params;

      const events =
        await ProctoringEvent.find({
          attemptId
        });

      const evaluation =
        await ProctoringEvaluation.findOne({
          attemptId
        });

      res.json({
        success: true,
        events,
        evaluation
      });
    } catch (error) {
      console.error(
        "Get proctoring evaluation error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };

export const generateProctoringEvaluation =
  async (req, res) => {
    try {
      const { attemptId } = req.params;

      const events =
        await ProctoringEvent.find({
          attemptId
        });

      if (!events.length) {
        return res.status(404).json({
          success: false,
          message:
            "No proctoring events found"
        });
      }

      const evaluationData = {
        attemptId,

        cameraWorking:
          events.some(
            (event) =>
              event.type === "camera"
          ),

        microphoneWorking:
          events.some(
            (event) =>
              event.type === "microphone"
          ),

        faceDetected:
          events.some(
            (event) =>
              event.type === "face"
          ),

        multipleFacesDetected:
          events.some(
            (event) =>
              event.type ===
              "multiple_faces"
          ),

        lookingAwayEvents:
          events.filter(
            (event) =>
              event.type ===
              "looking_away"
          ).length,

        cameraDisconnects:
          events.filter(
            (event) =>
              event.type ===
              "camera"
          ).length,

        microphoneDisconnects:
          events.filter(
            (event) =>
              event.type ===
              "microphone"
          ).length,

        tabSwitches:
          events.filter(
            (event) =>
              event.type ===
              "tab_switch"
          ).length,

        fullscreenExits:
          events.filter(
            (event) =>
              event.type ===
              "fullscreen_exit"
          ).length,

        totalEvents: events.length
      };

      const suspicious =
        evaluationData.multipleFacesDetected ||
        evaluationData.lookingAwayEvents > 3 ||
        evaluationData.tabSwitches > 3 ||
        evaluationData.fullscreenExits > 1;

      evaluationData.evaluation =
        suspicious
          ? "review_required"
          : "normal";

      const evaluation =
        await ProctoringEvaluation.findOneAndUpdate(
          { attemptId },
          evaluationData,
          {
            new: true,
            upsert: true
          }
        );

      res.json({
        success: true,
        evaluation
      });
    } catch (error) {
      console.error(
        "Generate proctoring evaluation error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate proctoring evaluation"
      });
    }
  };