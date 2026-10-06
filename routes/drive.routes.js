import express from "express";

import {
  createDrive,
  getDrives,
  getDrive,
  updateDrive,
  deleteDrive,
  inviteCandidate
} from "../controllers/drive.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router =
  express.Router();

router.get(
  "/",
  authMiddleware,
  getDrives
);

router.get(
  "/:id",
  authMiddleware,
  getDrive
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  createDrive
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  updateDrive
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  deleteDrive
);

router.post(
  "/:id/invite",
  authMiddleware,
  roleMiddleware(
    "recruiter",
    "admin"
  ),
  inviteCandidate
);

export default router;