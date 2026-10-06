import { env } from "./env.js";

export const evaluateTechnicalAnswer =
  async ({
    question,
    answer
  }) => {
    if (!answer) {
      return {
        score: 0,
        evaluated: true,
        evidence: [
          "No answer submitted"
        ]
      };
    }

    if (
      question.type === "mcq"
    ) {
      const correct =
        String(answer)
          .trim()
          .toLowerCase() ===
        String(
          question.correctAnswer
        )
          .trim()
          .toLowerCase();

      return {
        score: correct
          ? question.points
          : 0,

        evaluated: true,

        evidence: [
          correct
            ? "Answer matches the expected answer"
            : "Answer does not match the expected answer"
        ]
      };
    }

    if (
      !env.answerEvaluationApiUrl
    ) {
      return evaluateUsingRubric(
        question,
        answer
      );
    }

    const response =
      await fetch(
        env.answerEvaluationApiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...(env.answerEvaluationApiKey
              ? {
                  Authorization:
                    `Bearer ${env.answerEvaluationApiKey}`
                }
              : {})
          },

          body: JSON.stringify({
            question:
              question.question,

            answer,

            rubric:
              question.rubric
          })
        }
      );

    if (!response.ok) {
      throw new Error(
        "Answer evaluation service failed"
      );
    }

    return response.json();
  };

const evaluateUsingRubric = (
  question,
  answer
) => {
  const normalized =
    answer
      .trim()
      .toLowerCase();

  if (
    !question.rubric ||
    !question.rubric.length
  ) {
    return {
      score: 0,
      evaluated: false,
      evidence: [
        "No evaluation rubric configured"
      ]
    };
  }

  let matched = 0;

  const evidence = [];

  for (
    const criterion
    of question.rubric
  ) {
    const words =
      criterion.description
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 4
        );

    const found =
      words.filter(
        (word) =>
          normalized.includes(word)
      ).length;

    if (found > 0) {
      matched +=
        criterion.points;

      evidence.push(
        `Evidence found for: ${criterion.criterion}`
      );
    }
  }

  const maxScore =
    question.rubric.reduce(
      (sum, item) =>
        sum + item.points,
      0
    );

  const percentage =
    maxScore > 0
      ? (matched / maxScore) *
        100
      : 0;

  return {
    score:
      question.points *
      (percentage / 100),

    evaluated: true,

    evidence:
      evidence.length
        ? evidence
        : [
            "No strong rubric evidence detected"
          ]
  };
};