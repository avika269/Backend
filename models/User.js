import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: function () {
        return this.authProvider !== "google";
      }
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      }
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    otp: {
      type: String
    },

    otpExpiresAt: {
      type: Date
    },

    resetOtp: {
      type: String
    },

    resetOtpExpiresAt: {
      type: Date
    },

    role: {
      type: String,
      enum: ["candidate", "recruiter"],
      default: "candidate"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;