import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
password: { 
  type: String, minlength: 6, select: false
 },
   authProvider: { 
    type: String, enum: ["local", "google"], default: "local" },
   googleId: String,
   emailVerified: { 
    type: Boolean, default: false 
  },
   otp: String,
   otpExpiresAt: Date,
   resetOtp: String,
   resetOtpExpiresAt: Date,

    role: {
      type: String,
      enum: [
        "candidate",
        "recruiter",
        "admin"
      ],
      
      default: "candidate"
    },

    phone: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "User",
  userSchema
);