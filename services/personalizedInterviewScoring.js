const normalizeText = (value) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const normalizeOptions = (rawOptions) => {
  if (Array.isArray(rawOptions)) {
    return rawOptions
      .map((option) => ({
        id: String(option?.id ?? option?.key ?? "").trim().toUpperCase(),
        title: String(option?.title ?? option?.text ?? option?.label ?? "").trim()
      }))
      .filter((option) => option.id);
  }

  if (rawOptions && typeof rawOptions === "object") {
    return Object.entries(rawOptions).map(([id, title]) => ({
      id: String(id).trim().toUpperCase(),
      title: String(title ?? "").trim()
    }));
  }

  return [];
};

const pointsFor = (difficulty) => {
  const value = String(difficulty || "").trim().toLowerCase();
  if (value === "hard") return 20;
  if (value === "medium") return 15;
  return 10;
};

export const gradePersonalizedInterviewAnswers = (
  submittedAnswers,
  officialQuestions
) => {
  const submitted = Array.isArray(submittedAnswers) ? submittedAnswers : [];
  const official = Array.isArray(officialQuestions) ? officialQuestions : [];

  const questions = submitted.map((answer, index) => {
    const prompt = String(answer?.prompt ?? answer?.question ?? "").trim();
    if (!prompt) return null;

    const source = official.find((question) =>
      normalizeText(question?.question ?? question?.prompt) === normalizeText(prompt)
    );

    const options = normalizeOptions(source?.options ?? answer?.options);
    const selectedOptionId = String(
      answer?.savedAnswer ?? answer?.selectedOptionId ?? ""
    ).trim().toUpperCase();
    const selectedOption = options.find((option) => option.id === selectedOptionId);

    const correctOptionId = String(
      source?.correct_answer ?? source?.correctAnswer ?? ""
    ).trim().toUpperCase();
    const correctOption = source
      ? options.find((option) => option.id === correctOptionId)
      : null;
    const hasAnswerKey = Boolean(source && correctOptionId && correctOption);
    const points = hasAnswerKey ? pointsFor(source.difficulty) : 0;
    const isCorrect = selectedOptionId && hasAnswerKey
      ? selectedOptionId === correctOptionId
      : null;

    const submittedStatus = answer?.status ?? answer?.responseStatus;
    const responseStatus = selectedOptionId
      ? "saved"
      : ["skipped", "unattempted"].includes(submittedStatus)
        ? submittedStatus
        : "unattempted";

    return {
      questionId: String(answer?.id ?? answer?.questionId ?? index + 1).slice(0, 80),
      prompt: source?.question || prompt,
      topic: String(source?.topic ?? answer?.topic ?? answer?.mlCalibratedTag ?? "").slice(0, 300),
      difficulty: String(source?.difficulty ?? answer?.difficulty ?? "").slice(0, 100),
      options,
      selectedOptionId,
      selectedOptionText: selectedOption?.title || "",
      correctOptionId: hasAnswerKey ? correctOptionId : "",
      correctOptionText: hasAnswerKey ? correctOption.title : "",
      responseStatus,
      isCorrect,
      points,
      pointsAwarded: isCorrect === true ? points : 0
    };
  }).filter(Boolean);

  const fullyGradeable = questions.length > 0 && questions.every(
    (question) => Boolean(question.correctOptionId) && question.points > 0
  );

  const score = fullyGradeable
    ? questions.reduce((sum, question) => sum + question.pointsAwarded, 0)
    : null;
  const maxScore = fullyGradeable
    ? questions.reduce((sum, question) => sum + question.points, 0)
    : null;
  const percentage = fullyGradeable && maxScore > 0
    ? Math.round((score / maxScore) * 10000) / 100
    : null;

  return {
    questions,
    score,
    maxScore,
    percentage,
    gradingStatus: fullyGradeable ? "graded" : "ungraded",
    gradedAt: fullyGradeable ? new Date() : null
  };
};