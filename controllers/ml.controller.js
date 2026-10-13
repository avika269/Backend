import {
  mlHealth,
  predictFaceActivity
} from "../services/mlService.js";

export const getMlHealth = async (req, res) => {
  try {
    const data = await mlHealth();
    return res.json({ success: true, ml: data });
  } catch (error) {
    return res.status(error.statusCode || 503).json({
      success: false,
      message: error.message || "ML service unavailable"
    });
  }
};

export const predictActivity = async (req, res) => {
  try {
    const body = req.body || {};
    const gaze = body.gazeDistribution || {};

    const metrics = {
      face_presence_percent: Number(
        body.facePresencePct ?? body.face_presence_percent ?? 100
      ),
      maximum_faces_detected: Number(
        body.maxFacesDetected ?? body.maximum_faces_detected ?? 1
      ),
      longest_face_absence_sec: Number(
        body.longestFaceAbsenceSecs ?? body.longest_face_absence_sec ?? 0
      ),
      multiple_face_duration_sec: Number(
        body.multipleFaceDurationSecs ?? body.multiple_face_duration_sec ?? 0
      ),
      looking_away_events: Number(
        body.lookingAwayEvents ?? body.looking_away_events ?? 0
      ),
      looking_center_percent: Number(
        gaze.center ?? body.looking_center_percent ?? 100
      ),
      looking_left_percent: Number(
        gaze.left ?? body.looking_left_percent ?? 0
      ),
      looking_right_percent: Number(
        gaze.right ?? body.looking_right_percent ?? 0
      )
    };

    const prediction = await predictFaceActivity(metrics);

    return res.json({
      success: true,
      predictedActivity: prediction.predictedActivity,
      confidence: prediction.confidence
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Face activity prediction failed"
    });
  }
};