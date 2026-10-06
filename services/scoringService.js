const normalizeCategory = (category) => {
  const score = Number(category?.score) || 0;
  const maxScore = Number(category?.maxScore) || 0;

  if (maxScore === 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100 * 100) / 100;
};


export const calculateOverallScore = ({
  coding = {},
  technical = {},
  communication = {},
  other = {}
}) => {
  const normalized = {
    coding: normalizeCategory(coding),
    technical: normalizeCategory(technical),
    communication: normalizeCategory(communication),
    other: normalizeCategory(other)
  };

  const overall =
    normalized.coding * 0.40 +
    normalized.technical * 0.30 +
    normalized.communication * 0.20 +
    normalized.other * 0.10;

  return {
    normalized,
    overall: Math.round(overall * 100) / 100
  };
};


export const getRecommendation = (score) => {
  const value = Number(score) || 0;

  if (value >= 80) {
    return "Strongly Recommended";
  }

  if (value >= 70) {
    return "Recommended";
  }

  if (value >= 60) {
    return "Consider";
  }

  return "Not Recommended";
};


export default {
  calculateOverallScore,
  getRecommendation
};