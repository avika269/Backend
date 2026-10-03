import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import User from "../models/User.js";
import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import CandidateProfile from "../models/CandidateProfile.js";
import ProctoringEvent from "../models/ProctoringEvent.js";
import ProctoringEvaluation from "../models/ProctoringEvaluation.js";

dotenv.config();

const exportDirectory = path.join(process.cwd(), "ml_export");

if (!fs.existsSync(exportDirectory)) {
  fs.mkdirSync(exportDirectory, { recursive: true });
}

const writeJson = (fileName, data) => {
  const filePath = path.join(exportDirectory, fileName);

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  console.log(`Created: ${fileName}`);
};

const createCandidateIdMap = (users) => {
  const map = new Map();

  users.forEach((user, index) => {
    map.set(
      user._id.toString(),
      `candidate_${String(index + 1).padStart(4, "0")}`
    );
  });

  return map;
};

const exportCandidateProfiles = async (candidateIdMap) => {
  const profiles = await CandidateProfile.find().lean();

  const data = profiles.map((profile) => {
    const userId = profile.userId?.toString();

    return {
      candidateId: candidateIdMap.get(userId) || `candidate_unknown`,
      profile: {
        name: profile.profile?.name || "",
        skills: profile.profile?.skills || [],
        projects: profile.profile?.projects || [],
        education: profile.profile?.education || [],
        experience: profile.profile?.experience || []
      },
      github: {
        username: profile.github?.username || "",
        profileUrl: profile.github?.profileUrl || "",
        repositoryCount: profile.github?.repositories?.length || 0,
        repositories:
          profile.github?.repositories?.map((repo) => ({
            name: repo.name || "",
            description: repo.description || "",
            language: repo.language || "",
            stars: repo.stars || 0,
            forks: repo.forks || 0,
            topics: repo.topics || [],
            technologies: repo.technologies || []
          })) || []
      },
      mlCategory: profile.mlCategory || "",
      mlConfidence: profile.mlConfidence || 0
    };
  });

  writeJson("candidate_profiles.json", data);
};

const exportQuestions = async () => {
  const assessments = await Assessment.find().lean();

  const questions = [];

  for (const assessment of assessments) {
    for (const question of assessment.questions || []) {
      questions.push({
        questionId: question._id,
        assessmentId: assessment._id,
        assessmentType: assessment.assessmentType,
        type: question.type,
        question: question.question,
        options: question.options || [],
        points: question.points || 0,
        timeLimit: question.timeLimit || 0
      });
    }
  }

  writeJson("questions.json", questions);
};

const exportAttempts = async (candidateIdMap) => {
  const attempts = await Attempt.find().lean();

  const data = attempts.map((attempt) => ({
    attemptId: attempt._id,
    candidateId:
      candidateIdMap.get(
        attempt.userId?.toString()
      ) || "candidate_unknown",
    assessmentId: attempt.assessmentId,
    status: attempt.status,
    instructionsAccepted: attempt.instructionsAccepted,
    systemCheckCompleted: attempt.systemCheckCompleted,
    cameraWorking: attempt.cameraWorking,
    microphoneWorking: attempt.microphoneWorking,
    fullscreenEnabled: attempt.fullscreenEnabled,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answers:
      attempt.answers?.map((answer) => ({
        questionId: answer.questionId,
        answer: answer.answer || "",
        code: answer.code || "",
        audioFile: answer.audioFile || "",
        savedAt: answer.savedAt
      })) || [],
    score: attempt.score || 0,
    totalScore: attempt.totalScore || 0
  }));

  writeJson("attempts.json", data);
};

const exportEvaluations = async (candidateIdMap) => {
  const evaluations = await ProctoringEvaluation.find().lean();

  const data = [];

  for (const evaluation of evaluations) {
    const attempt = await Attempt.findById(
      evaluation.attemptId
    ).lean();

    data.push({
      attemptId: evaluation.attemptId,
      candidateId:
        candidateIdMap.get(
          attempt?.userId?.toString()
        ) || "candidate_unknown",
      cameraWorking: evaluation.cameraWorking,
      microphoneWorking: evaluation.microphoneWorking,
      faceDetected: evaluation.faceDetected,
      multipleFacesDetected:
        evaluation.multipleFacesDetected,
      lookingAwayEvents:
        evaluation.lookingAwayEvents,
      cameraDisconnects:
        evaluation.cameraDisconnects,
      microphoneDisconnects:
        evaluation.microphoneDisconnects,
      tabSwitches: evaluation.tabSwitches,
      fullscreenExits:
        evaluation.fullscreenExits,
      totalEvents: evaluation.totalEvents,
      evaluation: evaluation.evaluation
    });
  }

  writeJson("evaluations.json", data);
};

const exportProctoring = async () => {
  const events = await ProctoringEvent.find().lean();

  const data = events.map((event) => ({
    attemptId: event.attemptId,
    type: event.type,
    message: event.message,
    metadata: event.metadata || {},
    timestamp: event.timestamp
  }));

  writeJson("proctoring.json", data);
};

const writeReadme = () => {
  const readme = `
SMARTRECRUIT ML DATASET

This folder contains sanitized data exported for ML development.

Files:

1. candidate_profiles.json
   Candidate skills, projects, education, experience,
   GitHub technologies and repository information.

2. questions.json
   Assessment questions and metadata.

3. attempts.json
   Candidate assessment attempts, answers and scores.

4. evaluations.json
   Proctoring evaluation summaries.

5. proctoring.json
   Proctoring events such as tab switches,
   fullscreen exits and camera events.

IMPORTANT:

This dataset does not contain:
- passwords
- password hashes
- JWT secrets
- JWT tokens
- OTP values
- email passwords
- MongoDB connection strings

Candidate emails and phone numbers are not exported.

Candidate IDs are anonymized.

Do not upload this dataset to a public GitHub repository.
`;

  writeJson("README.json", {
    description: readme.trim()
  });
};

const exportMlData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const users = await User.find({
      role: "candidate"
    })
      .select("_id")
      .lean();

    console.log(`Found ${users.length} candidates`);

    const candidateIdMap =
      createCandidateIdMap(users);

    await exportCandidateProfiles(
      candidateIdMap
    );

    await exportQuestions();

    await exportAttempts(
      candidateIdMap
    );

    await exportEvaluations(
      candidateIdMap
    );

    await exportProctoring();

    writeReadme();

    console.log("");
    console.log("ML data export completed successfully.");
    console.log(`Location: ${exportDirectory}`);
  } catch (error) {
    console.error(
      "ML data export failed:",
      error.message
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

exportMlData();