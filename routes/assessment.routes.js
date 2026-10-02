import Assessment from "../models/Assessment.js";

const sanitizeQuestion = (
  question
) => ({
  id: question._id,
  questionNumber:
    question.questionNumber,
  type: question.type,
  category:
    question.category,
  question:
    question.question,
  options:
    question.options,
  points:
    question.points,
  timeLimit:
    question.timeLimit,
  order:
    question.order
});

export const createAssessment =
  async (req, res) => {
    try {
      const assessment =
        await Assessment.create({
          ...req.body,
          recruiterId:
            req.user.id
        });

      res.status(201).json({
        success: true,
        message:
          "Assessment created successfully",
        assessment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const getAssessments =
  async (req, res) => {
    try {
      const assessments =
        await Assessment.find({
          recruiterId:
            req.user.id
        }).sort({
          createdAt: -1
        });

      res.json({
        success: true,
        assessments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const getPublicAssessment =
  async (req, res) => {
    try {
      const assessment =
        await Assessment.findOne({
          _id: req.params.assessmentId,
          active: true
        });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message:
            "Assessment not found"
        });
      }

      res.json({
        success: true,
        assessment: {
          id: assessment._id,
          title: assessment.title,
          description:
            assessment.description,
          duration:
            assessment.duration,
          totalQuestions:
            assessment.totalQuestions,
          assessmentType:
            assessment.assessmentType,
          role:
            assessment.role,
          questions:
            assessment.questions.map(
              sanitizeQuestion
            )
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const getAssessment =
  async (req, res) => {
    try {
      const assessment =
        await Assessment.findOne({
          _id: req.params.assessmentId,
          recruiterId:
            req.user.id
        });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message:
            "Assessment not found"
        });
      }

      res.json({
        success: true,
        assessment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const updateAssessment =
  async (req, res) => {
    try {
      const assessment =
        await Assessment.findOneAndUpdate(
          {
            _id:
              req.params.assessmentId,
            recruiterId:
              req.user.id
          },
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message:
            "Assessment not found"
        });
      }

      res.json({
        success: true,
        message:
          "Assessment updated successfully",
        assessment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

export const deleteAssessment =
  async (req, res) => {
    try {
      const assessment =
        await Assessment.findOneAndDelete({
          _id:
            req.params.assessmentId,
          recruiterId:
            req.user.id
        });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message:
            "Assessment not found"
        });
      }

      res.json({
        success: true,
        message:
          "Assessment deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };