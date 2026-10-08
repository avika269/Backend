import mongoose from "mongoose";

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    github: {
      username: {
        type: String,
        trim: true
      },
      profileUrl: {
        type: String,
        trim: true
      },
      repositories: [
        {
          name: String,
          url: String,
          description: String,
          language: String,
          stars: Number,
          forks: Number,
          topics: [String],
          technologies: [String],
          importantFiles: [
            {
              path: String,
              type: String,
              content: String
            }
          ]
        }
      ]
    },

    resume: {
      fileName: String,
      filePath: String,
      uploadedAt: Date
    },

    profile: {
      name: String,
      email: String,
      phone: String,
       phone: String,

      skills: [
        {
          type: String,
          trim: true
        }
      ],

      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
          githubUrl: String
        }
      ],

      education: [
        {
          institution: String,
          degree: String,
          year: String
        }
      ],

      experience: [
        {
          company: String,
          role: String,
          description: String
        }
      ]
    },

    rawResumeText: String,

    candidateProfileJson: mongoose.Schema.Types.Mixed,

    mlCategory: String,

    mlConfidence: Number
  },
  {
    timestamps: true
  }
);

const CandidateProfile = mongoose.model(
  "CandidateProfile",
  candidateProfileSchema
);

export default CandidateProfile;