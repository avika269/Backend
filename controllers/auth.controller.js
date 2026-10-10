
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

// REGISTER
export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            confirmPassword
        } = req.body;

        if (!name || !email || !password || !confirmPassword) {
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

        const normalizedEmail = email.trim().toLowerCase();

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

        // Send OTP before responding with success.
        try {
            const info = await sendOTPEmail(
                user.email,
                otp
            );

            console.log("OTP email send operation completed.");
            console.log("Message ID:", info?.messageId);
            console.log("Accepted:", info?.accepted);
            console.log("Rejected:", info?.rejected);

            return res.status(201).json({
                success: true,
                message: "Account created. OTP sent to your email.",
                userId: user._id
            });
        } catch (emailError) {
            console.error(
                "OTP EMAIL ERROR:",
                emailError.message
            );

            return res.status(500).json({
                success: false,
                message: "Account created, but OTP email could not be sent. Please contact support or request a new OTP."
            });
        }
    } catch (error) {
        console.error("Register error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// VERIFY REGISTRATION OTP
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
            email: email.trim().toLowerCase()
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

        if (!user.otp || user.otp !== String(otp)) {
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

        return res.json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
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

        return res.json({
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
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.json({
                success: true,
                message: "If the email exists, an OTP has been sent"
            });
        }

        const otp = generateOTP();

        user.resetOtp = otp;
        user.resetOtpExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await user.save();

        try {
            const info = await sendOTPEmail(
                user.email,
                otp,
                "reset"
            );

            console.log("Password reset email send operation completed.");
            console.log("Message ID:", info?.messageId);

            return res.json({
                success: true,
                message: "Password reset OTP sent"
            });
        } catch (emailError) {
            console.error(
                "Password reset email error:",
                emailError.message
            );

            return res.status(500).json({
                success: false,
                message: "Could not send password reset email. Please try again."
            });
        }
    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send reset OTP"
        });
    }
};

// RESET PASSWORD
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

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (
            !user.resetOtp ||
            user.resetOtp !== String(otp)
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

        return res.json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};

// GOOGLE LOGIN
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

        return res.json({
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
        console.error("Google login error:", error);

        return res.status(401).json({
            success: false,
            message: "Google authentication failed"
        });
    }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(
            req.user.id
        ).select("-password -otp -resetOtp");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get me error:", error);
        console.error("Error message:", error.message);
        console.error("req.user:", req.user);

        return res.status(500).json({
            success: false,
            message: "Failed to get user"
        });
    }
};

// LOGOUT
export const logout = async (req, res) => {
    return res.json({
        success: true,
        message: "Logout successful"
    });
};

