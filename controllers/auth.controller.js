import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import { sendOTPEmail } from "../utils/email.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const otp = generateOTP();

    console.log("REGISTRATION OTP:", otp);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
      emailVerified: false,
      otp,
      otpExpiresAt: new Date(
        Date.now() + 10 * 60 * 1000
      ),
      role: "candidate"
    });

    res.status(201).json({
      success: true,
      message: "Account created. OTP sent to your email.",
      userId: user._id
    });

    try {
  const info = await sendOTPEmail(user.email, otp);

  console.log("OTP EMAIL SENT SUCCESSFULLY");
  console.log("Message ID:", info.messageId);
  console.log("Accepted:", info.accepted);
  console.log("Rejected:", info.rejected);
} catch (error) {
  console.error("OTP EMAIL ERROR:", error);
}

  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
};

export const login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "Please login using Google"
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    if (!user.password) {
  return res.status(400).json({
    success: false,
    message: "This account does not have a password. Please login using Google."
  });
}

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.json({
        success: true,
        message: "If the email exists, an OTP has been sent"
      });
    }

    const otp = generateOTP();
    console.log("PASSWORD RESET OTP:", otp);

    user.resetOtp = otp;
    user.resetOtpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    sendOTPEmail(
      user.email,
      otp,
      "reset"
    )
      .then(() => {
        console.log(
          `Password reset OTP sent successfully to ${user.email}`
        );
      })
      .catch((error) => {
        console.error(
          "Password reset email error:",
          error.message
        );
      });

    res.json({
      success: true,
      message: "Password reset OTP sent"
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to send reset OTP"
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
      confirmPassword
    } = req.body;

    if (
      !email ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (
      !user.resetOtp ||
      user.resetOtp !== otp
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (
      !user.resetOtpExpiresAt ||
      user.resetOtpExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset OTP expired"
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    user.resetOtp = undefined;
    user.resetOtpExpiresAt = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Password reset failed"
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required"
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const {
      sub,
      email,
      name,
      email_verified
    } = payload;

    if (!email || !email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email could not be verified"
      });
    }

    let user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email: email.toLowerCase(),
        authProvider: "google",
        googleId: sub,
        emailVerified: true,
        role: "candidate"
      });
    } else {
      user.googleId = sub;
      user.emailVerified = true;

      if (!user.name && name) {
        user.name = name;
      }

      await user.save();
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    res.status(401).json({
      success: false,
      message: "Google authentication failed"
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id
    ).select(
      "-password -otp -resetOtp"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error(
      "Get me error:",
      error
    );
     console.error("Error message:", error.message);
    console.error("req.user:", req.user);

    res.status(500).json({
      success: false,
      message: "Failed to get user"
    });
  }
};

export const logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logout successful"
  });
};