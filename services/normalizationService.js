import { clamp } from "../utils/helpers.js";

export const normalizeScore = (
  score,
  maxScore
) => {
  if (
    !maxScore ||
    maxScore <= 0
  ) {
    return 0;
  }

  return clamp(
    (score / maxScore) *
      100
  );
};

export const normalizeComponents = ({
  coding,
  technical,
  communication,
  other
}) => {
  return {
    coding: normalizeScore(
      coding.score,
      coding.maxScore
    ),

    technical: normalizeScore(
      technical.score,
      technical.maxScore
    ),

    communication:
      normalizeScore(
        communication.score,
        communication.maxScore
      ),

    other: normalizeScore(
      other.score,
      other.maxScore
    )
  };
};