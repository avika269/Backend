import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

import CandidateProfile from "../models/CandidateProfile.js";
import User from "../models/User.js";

import { analyzeGithub } from "../utils/github.js";
import { extractSkills } from "../utils/skillExtractor.js";

const extractResumeText = async (file) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (extension === ".pdf") {
    const pdfBuffer = fs.readFileSync(file.path);

    const parser = new PDFParse({
      data: pdfBuffer
    });

    const pdfData = await parser.getText();

    const text = pdfData.text || "";

    await parser.destroy();

    return text;
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      path: file.path
    });

    return result.value || "";
  }

  throw new Error("Unsupported resume format");
};

export const analyzeCandidateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      collegeName,
      githubUrl
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF or DOCX is required"
      });
    }

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        message: "GitHub profile URL is required"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (name) {
      user.name = name;
    }

    if (phone) {
      user.phone = phone;
    }

    if (collegeName) {
      user.collegeName = collegeName;
    }

    await user.save();

    const resumeText = await extractResumeText(req.file);

    const skills = extractSkills(resumeText);

    const github = await analyzeGithub(githubUrl);

    const candidateProfileJson = {
      candidate: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        collegeName: user.collegeName || ""
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

    const existingProfile = await CandidateProfile.findOne({
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
        collegeName: user.collegeName || "",
        skills,
        projects: [],
        education: [],
        experience: []
      };

      existingProfile.rawResumeText = resumeText;

      existingProfile.candidateProfileJson =
        candidateProfileJson;

      profile = await existingProfile.save();
    } else {
      profile = await CandidateProfile.create({
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
          collegeName: user.collegeName || "",
          skills,
          projects: [],
          education: [],
          experience: []
        },

        rawResumeText: resumeText,

        candidateProfileJson
      });
    }

    return res.status(201).json({
      success: true,
      message: "Candidate profile analyzed successfully",

      candidateProfile:
        profile.candidateProfileJson,

      profileId: profile._id
    });

  } catch (error) {
    console.error(
      "Candidate profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to analyze candidate profile",
      error: error.message
    });
  }
};

export const getCandidateProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      userId: req.user.id
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found"
      });
    }

    return res.json({
      success: true,
      candidateProfile:
        profile.candidateProfileJson
    });

  } catch (error) {
    console.error(
      "Get candidate profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const updateCandidateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      collegeName,
      githubUrl
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const profile = await CandidateProfile.findOne({
      userId: req.user.id
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found"
      });
    }

    if (name) {
      user.name = name;
    }

    if (phone) {
      user.phone = phone;
    }

    if (collegeName) {
      user.collegeName = collegeName;
    }

    await user.save();

    if (githubUrl) {
      profile.github =
        await analyzeGithub(githubUrl);
    }

    let resumeText =
      profile.rawResumeText || "";

    let skills =
      profile.profile?.skills || [];

    if (req.file) {
      resumeText =
        await extractResumeText(req.file);

      skills =
        extractSkills(resumeText);

      profile.resume = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date()
      };

      profile.rawResumeText =
        resumeText;
    }

    profile.profile.name =
      user.name;

    profile.profile.email =
      user.email;

    profile.profile.phone =
      user.phone || "";

    profile.profile.collegeName =
      user.collegeName || "";

    profile.profile.skills =
      skills;

    profile.candidateProfileJson = {
      candidate: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        collegeName:
          user.collegeName || ""
      },

      resume: {
        fileName:
          profile.resume?.fileName || ""
      },

      github:
        profile.github,

      skills,

      projects:
        profile.profile.projects || [],

      education:
        profile.profile.education || [],

      experience:
        profile.profile.experience || []
    };

    await profile.save();

    return res.json({
      success: true,
      message:
        "Candidate profile updated successfully",

      candidateProfile:
        profile.candidateProfileJson
    });

  } catch (error) {
    console.error(
      "Update candidate profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update candidate profile",
      error: error.message
    });
  }
};

export const deleteCandidateProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await CandidateProfile.findOneAndDelete({
        userId: req.user.id
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "Candidate profile not found"
      });
    }

    return res.json({
      success: true,
      message:
        "Candidate profile deleted successfully"
    });

  } catch (error) {
    console.error(
      "Delete candidate profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete candidate profile",
      error: error.message
    });
  }
};