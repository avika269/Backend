import express from "express";

import {
  register,
  verifyOTP,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  logout
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logout);

export default router;