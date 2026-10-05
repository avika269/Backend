import Question from "../models/Question.js";

const candidateProjection =
  "-correctAnswer -testCases.expectedOutput";

export const createQuestion = async (
  req,
  res
) => {
  const question =
    await Question.create({
      ...req.body,
      createdBy: req.user.id
    });

  res.status(201).json({
    success: true,
    message: "Question created",
    data: { question }
  });
};

export const getQuestions = async (
  req,
  res
) => {
  const questions =
    await Question.find()
      .select(candidateProjection);

  res.json({
    success: true,
    data: { questions }
  });
};

export const getQuestion = async (
  req,
  res
) => {
  const question =
    await Question.findById(
      req.params.id
    ).select(candidateProjection);

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found"
    });
  }

  res.json({
    success: true,
    data: { question }
  });
};

export const updateQuestion = async (
  req,
  res
) => {
  const question =
    await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found"
    });
  }

  res.json({
    success: true,
    message: "Question updated",
    data: { question }
  });
};

export const deleteQuestion = async (
  req,
  res
) => {
  const question =
    await Question.findByIdAndDelete(
      req.params.id
    );

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found"
    });
  }

  res.json({
    success: true,
    message: "Question deleted"
  });
};