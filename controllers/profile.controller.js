import fs from "fs";
import { PDFParse } from "pdf-parse";

import CandidateProfile from "../models/CandidateProfile.js";
import User from "../models/User.js";

import { analyzeGithub } from "../utils/github.js";
import { extractSkills } from "../utils/skillExtractor.js";

export const analyzeCandidateProfile = async (
  req,
  res
) => {
  try {
    const { githubUrl } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required"
      });
    }

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        message: "GitHub profile URL is required"
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const pdfBuffer = fs.readFileSync(
      req.file.path
    );

    const pdfData = await pdfParse(
      pdfBuffer
    );

    const result = await parser.getText();

    const resumeText =
      pdfData.text || "";

      await parser.destroy();

    const skills =
      extractSkills(resumeText);

    const github =
      await analyzeGithub(githubUrl);

    const candidateProfileJson = {
      candidate: {
        name: user.name,
        email: user.email,
        phone: user.phone || ""
      },

      resume: {
        fileName: req.file.originalname
      },

      github,

      skills,

      projects: [],

      education: [],

      experience: []
    };

    const existingProfile =
      await CandidateProfile.findOne({
        userId: user._id
      });

    let profile;

    if (existingProfile) {
      existingProfile.github = github;

      existingProfile.resume = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date()
      };

      existingProfile.profile = {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        skills,
        projects: [],
        education: [],
        experience: []
      };

      existingProfile.rawResumeText =
        resumeText;

      existingProfile.candidateProfileJson =
        candidateProfileJson;

      profile = await existingProfile.save();
    } else {
      profile =
        await CandidateProfile.create({
          userId: user._id,

          github,

          resume: {
            fileName: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date()
          },

          profile: {
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            skills,
            projects: [],
            education: [],
            experience: []
          },

          rawResumeText: resumeText,

          candidateProfileJson
        });
    }

    res.status(201).json({
      success: true,
      message:
        "Candidate profile analyzed successfully",

      candidateProfile: profile.candidateProfileJson,

      profileId: profile._id
    });
  } catch (error) {
    console.error(
      "Candidate profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to analyze candidate profile"
    });
  }
};

export const getCandidateProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await CandidateProfile.findOne({
        userId: req.user.id
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "Candidate profile not found"
      });
    }

    res.json({
      success: true,
      candidateProfile:
        profile.candidateProfileJson
    });
  } catch (error) {
    console.error(
      "Get candidate profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};