import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
  "MONGO_URI",
  "JWT_SECRET"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing environment variable: ${variable}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 3500),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  frontendUrl:
    process.env.FRONTEND_URL ||
    "http://localhost:5173",

  codeExecutionUrl:
    process.env.CODE_EXECUTION_URL || "",

  codeExecutionApiKey:
    process.env.CODE_EXECUTION_API_KEY || "",

  speechApiUrl:
    process.env.SPEECH_API_URL || "",

  speechApiKey:
    process.env.SPEECH_API_KEY || "",

  answerEvaluationApiUrl:
    process.env.ANSWER_EVALUATION_API_URL || "",

  answerEvaluationApiKey:
    process.env.ANSWER_EVALUATION_API_KEY || "",

  weights: {
    coding: Number(
      process.env.CODING_WEIGHT || 40
    ),

    technical: Number(
      process.env.TECHNICAL_WEIGHT || 30
    ),

    communication: Number(
      process.env.COMMUNICATION_WEIGHT || 20
    ),

    other: Number(
      process.env.OTHER_WEIGHT || 10
    )
  }
};