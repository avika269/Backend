
import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

router.post(
    "/interview/generate",
    upload.single("resume"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "Resume PDF is required"
                });
            }

            if (req.file.mimetype !== "application/pdf") {
                return res.status(400).json({
                    error: "Only PDF resumes are accepted"
                });
            }

            const form = new FormData();

            form.append("resume", req.file.buffer, {
                filename: req.file.originalname,
                contentType: "application/pdf"
            });

            form.append(
                "github_username",
                req.body.github_username || ""
            );

            const response = await axios.post(
                `${ML_SERVICE_URL}/interview/generate`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 330000,
                    maxBodyLength: 15 * 1024 * 1024
                }
            );

            return res.json(response.data);
        } catch (error) {
            console.error(
                "Interview generation error:",
                error.response?.data || error.message
            );

            return res.status(error.response?.status || 502).json({
                error:
                    error.response?.data?.detail ||
                    "ML service request failed"
            });
        }
    }
);

router.post(
    "/predict-job",
    upload.single("resume"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "Resume PDF is required"
                });
            }

            const form = new FormData();

            form.append("resume", req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            const response = await axios.post(
                `${ML_SERVICE_URL}/predict-job`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 30000
                }
            );

            return res.json(response.data);
        } catch (error) {
            console.error(
                "Job prediction error:",
                error.response?.data || error.message
            );

            return res.status(error.response?.status || 502).json({
                error:
                    error.response?.data?.detail ||
                    "Job prediction failed"
            });
        }
    }
);

export default router;

