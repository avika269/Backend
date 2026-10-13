import mongoose from "mongoose";
import User from "../models/User.js";
import Drive from "../models/Drive.js";
import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import Submission from "../models/Submission.js";
import Evaluation from "../models/Evaluation.js";
import Scorecard from "../models/Scorecard.js";
import CandidateInterviewResult from "../models/CandidateInterviewResult.js";
import CandidateProfile from "../models/CandidateProfile.js";
import { gradePersonalizedInterviewAnswers } from "../services/personalizedInterviewScoring.js";

const isAdmin = (req) => req.user.role === "admin";
const driveFilter = (req) => isAdmin(req) ? {} : { createdBy: req.user.id };

const timeAgo = (value) => {
  if (!value) return "No activity yet";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const statusLabel = (status) => {
  if (["submitted", "evaluated", "expired"].includes(status)) return "Completed";
  if (["started", "evaluating"].includes(status)) return "In progress";
  return "Invited";
};


const gradeUnscoredInterviewResults = async (results) => {
  const pending = results.filter(
    (result) =>
      !result.legacySummaryOnly &&
      result.gradingStatus !== "graded" &&
      result.candidate?._id &&
      Array.isArray(result.questions) &&
      result.questions.length > 0
  );

  if (!pending.length) return;

  const candidateIds = [...new Set(
    pending.map((result) => String(result.candidate._id))
  )];

  const profiles = await CandidateProfile.find({
    userId: { $in: candidateIds }
  }).select("userId mlInterview");

  const profileByUser = new Map(
    profiles.map((profile) => [String(profile.userId), profile])
  );

  for (const result of pending) {
    const profile = profileByUser.get(String(result.candidate._id));
    const grading = gradePersonalizedInterviewAnswers(
      result.questions,
      profile?.mlInterview?.questions || []
    );

    if (grading.gradingStatus !== "graded") continue;

    result.questions = grading.questions;
    result.score = grading.score;
    result.maxScore = grading.maxScore;
    result.percentage = grading.percentage;
    result.gradingStatus = grading.gradingStatus;
    result.gradedAt = grading.gradedAt;
    await result.save();
  }
};

const getRecruiterContext = async (req) => {
  const drives = await Drive.find(driveFilter(req)).sort({ createdAt: -1 });
  const driveIds = drives.map((drive) => drive._id);
  const assessments = driveIds.length
    ? await Assessment.find({ drive: { $in: driveIds } }).populate("drive", "title company role isActive invitedCandidates")
      .sort({ createdAt: -1 })
    : [];
  const assessmentIds = assessments.map((assessment) => assessment._id);
  const attempts = assessmentIds.length
    ? await Attempt.find({ assessment: { $in: assessmentIds } })
      .populate("candidate", "name email role")
      .populate({ path: "assessment", select: "title drive questions isPublished", populate: { path: "drive", select: "title company role isActive createdBy" } })
      .sort({ updatedAt: -1 })
    : [];
  return { drives, assessments, attempts };
};

export const getRecruiterDashboard = async (req, res) => {
  const [{ drives, assessments, attempts }, recruiter, interviewResults] = await Promise.all([
    getRecruiterContext(req),
    User.findById(req.user.id).select("name email role phone createdAt"),
    CandidateInterviewResult.find({ status: "submitted" })
      .populate("candidate", "name email role")
      .sort({ submittedAt: -1 })
      .limit(500)
  ]);

  const driveMap = new Map(drives.map((drive) => [String(drive._id), drive]));
  const attemptIds = attempts.map((attempt) => attempt._id);
  const scorecards = attemptIds.length
    ? await Scorecard.find({ attempt: { $in: attemptIds } }).select("attempt overallScore recruiterDecision")
    : [];
  const scoreByAttempt = new Map(scorecards.map((scorecard) => [String(scorecard.attempt), scorecard]));
  const candidateIds = new Set();
  for (const drive of drives) for (const candidateId of drive.invitedCandidates || []) candidateIds.add(String(candidateId));
  for (const attempt of attempts) if (attempt.candidate?._id) candidateIds.add(String(attempt.candidate._id));
  for (const result of interviewResults) if (result.candidate?._id) candidateIds.add(String(result.candidate._id));

  const activeAssessmentsList = assessments.slice(0, 8).map((assessment) => {
    const drive = assessment.drive || driveMap.get(String(assessment.drive));
    const relatedAttempts = attempts.filter((attempt) => String(attempt.assessment?._id || attempt.assessment) === String(assessment._id));
    const invitedCount = (drive?.invitedCandidates || []).length;
    return {
      id: String(assessment._id),
      name: assessment.title,
      details: [drive?.company, drive?.role].filter(Boolean).join(" · "),
      type: "Assessment",
      candidates: Math.max(invitedCount, relatedAttempts.length),
      status: assessment.isPublished && drive?.isActive ? "Active" : "Draft"
    };
  });

  const activityItems = [
    ...attempts.map((attempt) => {
      const candidateName = attempt.candidate?.name || "Candidate";
      const assessmentName = attempt.assessment?.title || "assessment";
      const status = attempt.status;
      return {
        _sortAt: new Date(attempt.updatedAt || attempt.createdAt || 0).getTime(),
        text: `${candidateName} ${status === "started" ? "started" : ["submitted", "evaluated", "expired"].includes(status) ? "completed" : "updated"} the ${assessmentName} assessment.`,
        time: timeAgo(attempt.updatedAt || attempt.createdAt),
        icon: status === "evaluated" ? "fa-solid fa-check text-emerald-400" : status === "started" ? "fa-solid fa-laptop-code text-slate-400" : "fa-solid fa-file-lines text-slate-400"
      };
    }),
    ...interviewResults.map((result) => ({
      _sortAt: new Date(result.submittedAt || result.createdAt || 0).getTime(),
      text: `${result.candidate?.name || "Candidate"} submitted the ${result.assessmentTitle || "personalized AI interview"}.`,
      time: timeAgo(result.submittedAt || result.createdAt),
      icon: "fa-solid fa-check text-emerald-400"
    }))
  ];
  const recentActivityList = activityItems
    .sort((a, b) => b._sortAt - a._sortAt)
    .slice(0, 6)
    .map(({ _sortAt, ...item }) => item);

  const inProgress = attempts.filter((attempt) => ["created", "started", "evaluating"].includes(attempt.status)).length;
  const readyForReview = attempts.filter((attempt) => ["submitted", "evaluated"].includes(attempt.status)).length + interviewResults.filter((result) => result.recruiterDecision === "pending").length;
  return res.json({
    success: true,
    recruiter: recruiter ? { id: String(recruiter._id), name: recruiter.name, email: recruiter.email, role: recruiter.role, phone: recruiter.phone } : null,
    stats: {
      activeAssessments: assessments.filter((assessment) => assessment.isPublished && assessment.drive?.isActive).length,
      totalCandidates: candidateIds.size,
      inProgress,
      readyForReview
    },
    activeAssessmentsList,
    recentActivityList
  });
};

export const getRecruiterCandidates = async (req, res) => {
  const { drives, assessments, attempts } = await getRecruiterContext(req);
  const assessmentById = new Map(assessments.map((assessment) => [String(assessment._id), assessment]));
  const attemptIds = attempts.map((attempt) => attempt._id);
  const submissionCounts = attemptIds.length
    ? await Submission.aggregate([
      { $match: { attempt: { $in: attemptIds } } },
      { $group: { _id: "$attempt", count: { $sum: 1 } } }
    ])
    : [];
  const submissionCountByAttempt = new Map(submissionCounts.map((item) => [String(item._id), item.count]));
  const scorecards = attemptIds.length
    ? await Scorecard.find({ attempt: { $in: attemptIds } }).select("attempt overallScore recruiterDecision")
    : [];
  const scorecardByAttempt = new Map(scorecards.map((item) => [String(item.attempt), item]));
  // Personalized interviews currently have no drive/recruiter foreign key in the candidate flow,
  // so they appear in the shared recruiter workspace until drive assignment is implemented.
  const interviewResults = await CandidateInterviewResult.find({ status: "submitted" })
    .populate("candidate", "name email role")
    .sort({ submittedAt: -1 })
    .limit(500);
  await gradeUnscoredInterviewResults(interviewResults);
  const rows = [];
  const representedCandidates = new Set();

  for (const attempt of attempts) {
    if (!attempt.candidate) continue;
    const attemptId = String(attempt._id);
    const assessmentId = String(attempt.assessment?._id || attempt.assessment);
    const assessment = assessmentById.get(assessmentId);
    const drive = assessment?.drive;
    const completedTasks = submissionCountByAttempt.get(attemptId) || 0;
    const totalTasks = assessment?.questions?.length || 0;
    const percentage = typeof attempt.percentage === "number" && attempt.percentage > 0
      ? Math.round(attempt.percentage)
      : (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (["submitted", "evaluated"].includes(attempt.status) ? 100 : 0));
    const scorecard = scorecardByAttempt.get(attemptId);
    representedCandidates.add(`${String(attempt.candidate._id)}:${assessmentId}`);
    rows.push({
      attemptId,
      candidateId: String(attempt.candidate._id),
      initials: (attempt.candidate.name || "CN").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      name: attempt.candidate.name || "Candidate",
      email: attempt.candidate.email || "",
      role: drive?.role || assessment?.title || "Candidate",
      assessmentName: assessment?.title || "Assessment",
      status: statusLabel(attempt.status),
      tasksCompleted: `${completedTasks} / ${totalTasks || "—"} tasks`,
      percentage: `${percentage}%`,
      progressWidth: `${percentage}%`,
      lastActivity: timeAgo(attempt.updatedAt || attempt.createdAt),
      overallScore: scorecard?.overallScore ?? (attempt.status === "evaluated" ? attempt.percentage : null),
      decision: scorecard?.recruiterDecision || "pending"
    });
  }

  for (const result of interviewResults) {
    const candidate = result.candidate;
    if (!candidate) continue;
    const resultId = String(result._id);
    const total = result.totalQuestions || result.questions?.length || 0;
    const answered = result.answeredQuestions || 0;
    const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
    rows.push({
      attemptId: resultId,
      resultType: "personalized-interview",
      candidateId: String(candidate._id),
      initials: (candidate.name || "CN").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      name: candidate.name || "Candidate",
      email: candidate.email || "",
      role: result.candidateJobRole || "Personalized AI interview",
      assessmentName: result.assessmentTitle || "Personalized AI Technical Interview",
      status: "Completed",
      tasksCompleted: result.legacySummaryOnly
        ? `${answered} responses · legacy summary`
        : `${answered} / ${total || "—"} responses`,
      percentage: result.legacySummaryOnly ? "—" : `${progress}%`,
      progressWidth: `${progress}%`,
      lastActivity: timeAgo(result.submittedAt || result.createdAt),
      overallScore: result.gradingStatus === "graded" ? result.percentage : null,
      scorePoints: result.score,
      maxScore: result.maxScore,
      correctCount: (result.questions || []).filter((question) => question.isCorrect === true).length,
      gradingStatus: result.gradingStatus || "ungraded",
      decision: result.recruiterDecision || "pending"
    });
  }

  const inviteIds = [...new Set(drives.flatMap((drive) => (drive.invitedCandidates || []).map(String)))];
  const candidatesNotAttempted = inviteIds.filter((candidateId) => !rows.some((row) => row.candidateId === candidateId));
  if (candidatesNotAttempted.length) {
    const invitedUsers = await User.find({ _id: { $in: candidatesNotAttempted }, role: "candidate" }).select("name email");
    for (const candidate of invitedUsers) {
      const drive = drives.find((item) => (item.invitedCandidates || []).some((id) => String(id) === String(candidate._id)));
      rows.push({
        attemptId: null,
        candidateId: String(candidate._id),
        initials: (candidate.name || "CN").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        name: candidate.name || "Candidate",
        email: candidate.email || "",
        role: drive?.role || "Candidate",
        assessmentName: "Not started",
        status: "Invited",
        tasksCompleted: "0 / — tasks",
        percentage: "0%",
        progressWidth: "0%",
        lastActivity: "No activity yet",
        overallScore: null,
        decision: "pending"
      });
    }
  }

  rows.sort((a, b) => {
    if (!a.lastActivity) return 1;
    if (!b.lastActivity) return -1;
    return 0;
  });
  return res.json({ success: true, candidates: rows });
};

const findRecruiterAttempt = async (req, attemptId) => {
  if (!mongoose.isValidObjectId(attemptId)) return null;
  const attempt = await Attempt.findById(attemptId)
    .populate("candidate", "name email role")
    .populate({ path: "assessment", select: "title drive questions isPublished", populate: { path: "drive", select: "title company role createdBy isActive" } });
  if (!attempt || !attempt.assessment?.drive) return null;
  if (!isAdmin(req) && String(attempt.assessment.drive.createdBy) !== String(req.user.id)) return null;
  return attempt;
};

export const getRecruiterCandidateReview = async (req, res) => {
  if (mongoose.isValidObjectId(req.params.attemptId)) {
    const interviewResult = await CandidateInterviewResult.findById(req.params.attemptId)
      .populate("candidate", "name email role");
    if (interviewResult?.candidate) {
      await gradeUnscoredInterviewResults([interviewResult]);
      const analytics = interviewResult.proctoringAnalytics || {};
      const questions = interviewResult.questions || [];
      const answeredCount = questions.filter((question) => Boolean(question.selectedOptionId)).length;
      const correctCount = questions.filter((question) => question.isCorrect === true).length;
      const isGraded = !interviewResult.legacySummaryOnly &&
        interviewResult.gradingStatus === "graded" &&
        interviewResult.percentage != null;
      const evidence = interviewResult.legacySummaryOnly
        ? [{
            type: "mcq",
            title: "Previous interview submission summary",
            meta: `${interviewResult.answeredQuestions || 0} responses were reported by the older frontend. Individual question answers were not saved by that version and cannot be recovered from the summary.`,
            score: null,
            maxScore: null,
            actionText: "Summary only"
          }]
        : questions.map((question) => {
            let answerStatus = "NOT GRADED";
            if (!question.selectedOptionId) answerStatus = "UNANSWERED";
            else if (question.isCorrect === true) answerStatus = "CORRECT";
            else if (question.isCorrect === false) answerStatus = "INCORRECT";

            const candidateChoice = question.selectedOptionText
              ? `Candidate choice (${question.selectedOptionId}): ${question.selectedOptionText}`
              : "Candidate did not select an option";
            const correctChoice = question.correctOptionText
              ? `Correct answer (${question.correctOptionId}): ${question.correctOptionText}`
              : "Correct answer unavailable";

            return {
              type: "mcq",
              title: question.prompt,
              meta: [candidateChoice, `Result: ${answerStatus}`, correctChoice, `Response: ${question.responseStatus}`].join(" · "),
              score: question.points > 0 && question.isCorrect !== null ? question.pointsAwarded : null,
              maxScore: question.points > 0 ? question.points : null,
              actionText: "Review answer"
            };
          });
      evidence.push({
        type: "technical",
        title: "Proctoring summary",
        meta: `Face presence ${Math.round(Number(analytics.facePresencePct) || 0)}% · Tab switches ${Number(analytics.tabSwitchesCount) || 0} · Activity ${analytics.finalActivityStatus || "Not recorded"} · Flag ${analytics.finalVisualFlag || "NO"}`,
        score: null,
        maxScore: null,
        actionText: "Review telemetry"
      });
      return res.json({
        success: true,
        candidate: {
          attemptId: String(interviewResult._id),
          candidateId: String(interviewResult.candidate._id),
          name: interviewResult.candidate.name || "Candidate",
          email: interviewResult.candidate.email || "",
          role: interviewResult.candidateJobRole || "Personalized AI interview",
          assessmentName: interviewResult.assessmentTitle,
          overallScore: isGraded ? interviewResult.percentage : null,
          score: isGraded ? interviewResult.score : null,
          maxScore: isGraded ? interviewResult.maxScore : null,
          correctCount,
          answeredQuestions: answeredCount,
          totalQuestions: questions.length,
          gradingStatus: interviewResult.gradingStatus || "ungraded",
          completedTime: timeAgo(interviewResult.submittedAt),
          percentile: "Not calculated",
          verified: Boolean(interviewResult.proctoringAnalytics),
          sections: {
            coding: { score: null, details: "No separate coding score was generated for this personalized MCQ interview." },
            technicalKnowledge: {
              score: isGraded ? interviewResult.percentage : null,
              details: isGraded
                ? `${correctCount} correct · ${answeredCount} answered out of ${questions.length} · ${interviewResult.score}/${interviewResult.maxScore} points`
                : interviewResult.legacySummaryOnly
                  ? `${interviewResult.answeredQuestions || 0} responses were reported, but individual answers are unavailable in the older submission.`
                  : "The original answer key is unavailable or this result could not be fully graded. Retake the interview if necessary."
            },
            communication: { score: null, details: "No communication score was generated for this interview." }
          },
          evidence,
          decision: interviewResult.recruiterDecision || "pending",
          recruiterNote: interviewResult.recruiterNote || ""
        }
      });
    }
  }

  const attempt = await findRecruiterAttempt(req, req.params.attemptId);
  if (!attempt) return res.status(404).json({ success: false, message: "Candidate assessment not found" });

  const [scorecard, evaluation, submissions] = await Promise.all([
    Scorecard.findOne({ attempt: attempt._id }),
    Evaluation.findOne({ attempt: attempt._id }),
    Submission.find({ attempt: attempt._id }).populate("question", "question type points").sort({ createdAt: 1 })
  ]);
  const overallScore = scorecard?.overallScore ?? evaluation?.overallScore ?? null;
  const categoryScore = (scorecardValue, evaluationValue) => {
    if (scorecardValue !== undefined && scorecardValue !== null) return scorecardValue;
    if (evaluationValue?.maxScore > 0) return Math.round((evaluationValue.score / evaluationValue.maxScore) * 100);
    return null;
  };
  const coding = categoryScore(scorecard?.codingScore, evaluation?.coding);
  const technical = categoryScore(scorecard?.technicalScore, evaluation?.technical);
  const communication = categoryScore(scorecard?.communicationScore, evaluation?.communication);
  const evidence = submissions.map((submission) => ({
    type: submission.question?.type || "answer",
    title: submission.question?.question || "Assessment answer",
    meta: submission.evaluated ? "Answer evaluated" : "Answer submitted; evaluation unavailable",
    score: submission.score,
    maxScore: submission.maxScore,
    actionText: "Review answer"
  }));
  return res.json({
    success: true,
    candidate: {
      attemptId: String(attempt._id),
      candidateId: String(attempt.candidate._id),
      name: attempt.candidate.name,
      email: attempt.candidate.email,
      role: attempt.assessment.drive.role || attempt.assessment.title,
      assessmentName: attempt.assessment.title,
      overallScore,
      completedTime: attempt.submittedAt ? timeAgo(attempt.submittedAt) : "Not submitted",
      percentile: "Not calculated",
      verified: Boolean(attempt.systemCheckCompleted),
      sections: {
        coding: { score: coding, details: evaluation?.coding?.maxScore ? `${evaluation.coding.score} / ${evaluation.coding.maxScore} points` : "No coding evaluation saved" },
        technicalKnowledge: { score: technical, details: evaluation?.technical?.maxScore ? `${evaluation.technical.score} / ${evaluation.technical.maxScore} points` : "No technical evaluation saved" },
        communication: { score: communication, details: evaluation?.communication?.maxScore ? `${evaluation.communication.score} / ${evaluation.communication.maxScore} points` : "No communication evaluation saved" }
      },
      evidence,
      decision: scorecard?.recruiterDecision || "pending",
      recruiterNote: scorecard?.recruiterNote || ""
    }
  });
};

export const saveRecruiterDecision = async (req, res) => {
  const decisionMap = { review: "pending", pending: "pending", shortlisted: "shortlisted", not_selected: "rejected", rejected: "rejected" };
  const recruiterDecision = decisionMap[req.body.decision];
  if (!recruiterDecision) return res.status(400).json({ success: false, message: "Invalid recruiter decision" });

  if (mongoose.isValidObjectId(req.params.attemptId)) {
    const interviewResult = await CandidateInterviewResult.findById(req.params.attemptId);
    if (interviewResult) {
      interviewResult.recruiterDecision = recruiterDecision;
      interviewResult.recruiterNote = String(req.body.note || "").slice(0, 4000);
      interviewResult.humanReviewed = recruiterDecision !== "pending" || Boolean(interviewResult.recruiterNote.trim());
      await interviewResult.save();
      return res.json({ success: true, message: "Recruiter decision saved", data: { decision: interviewResult.recruiterDecision, note: interviewResult.recruiterNote } });
    }
  }

  const attempt = await findRecruiterAttempt(req, req.params.attemptId);
  if (!attempt) return res.status(404).json({ success: false, message: "Candidate assessment not found" });

  let scorecard = await Scorecard.findOne({ attempt: attempt._id });
  if (!scorecard) {
    const evaluation = await Evaluation.findOne({ attempt: attempt._id });
    if (!evaluation) return res.status(409).json({ success: false, message: "A saved evaluation is required before making a scorecard decision" });
    scorecard = await Scorecard.create({
      attempt: attempt._id,
      candidate: attempt.candidate._id,
      assessment: attempt.assessment._id,
      codingScore: evaluation.normalizedScores?.coding || 0,
      technicalScore: evaluation.normalizedScores?.technical || 0,
      communicationScore: evaluation.normalizedScores?.communication || 0,
      otherScore: evaluation.normalizedScores?.other || 0,
      overallScore: evaluation.overallScore || 0,
      recommendation: evaluation.recommendation || "needs_review"
    });
  }
  scorecard.recruiterDecision = recruiterDecision;
  scorecard.recruiterNote = String(req.body.note || "").slice(0, 4000);
  scorecard.humanReviewed = recruiterDecision !== "pending" || Boolean(scorecard.recruiterNote.trim());
  await scorecard.save();
  return res.json({ success: true, message: "Recruiter decision saved", data: { decision: scorecard.recruiterDecision, note: scorecard.recruiterNote } });
};