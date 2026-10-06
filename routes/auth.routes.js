import express from "express";

import {
  register,
  login,
  getMe,
  logout
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", getMe);
router.post("/logout", logout);

export default router;