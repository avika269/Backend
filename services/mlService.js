import fs from "node:fs";
import path from "node:path";
import { env } from "../env.js";

const buildHeaders = () =>
  env.mlApiKey ? { "X-API-Key": env.mlApiKey } : {};

const request = async (
  endpoint,
  options = {},
  timeoutMs = env.mlTimeoutMs
) => {
  let response;

  try {
    response = await fetch(`${env.mlApiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...buildHeaders(),
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const err = new Error(
      `ML service unreachable at ${env.mlApiUrl}: ${error.message}`
    );
    err.statusCode = 503;
    throw err;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(
      data.detail || data.message || `ML service returned HTTP ${response.status}`
    );
    err.statusCode = response.status;
    throw err;
  }

  return data;
};

const buildResumeForm = (source, originalName) => {
  const form = new FormData();
  const bytes = Buffer.isBuffer(source)
    ? source
    : fs.readFileSync(source);

  form.append(
    "resume",
    new Blob([bytes], { type: "application/pdf" }),
    originalName ||
      (typeof source === "string"
        ? path.basename(source)
        : "resume.pdf")
  );

  return form;
};

export const mlHealth = () => request("/health", {}, 10000);

export const predictJobRole = async (source, originalName) => {
  const data = await request(
    "/predict-job",
    {
      method: "POST",
      body: buildResumeForm(source, originalName)
    },
    60000
  );

  return data.predicted_job_role || data.predictedJobRole || null;
};

export const generateInterview = async (
  source,
  originalName,
  githubUsername
) => {
  const form = buildResumeForm(source, originalName);
  form.append("github_username", githubUsername);

  return request(
    "/interview/generate",
    {
      method: "POST",
      body: form
    },
    env.mlTimeoutMs
  );
};

export const predictFaceActivity = async (metrics) => {
  const data = await request(
    "/predict-face-activity",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics)
    },
    15000
  );

  return {
    predictedActivity:
      data.predicted_activity ?? data.predictedActivity ?? "unknown",
    confidence: Number(data.confidence || 0)
  };
};