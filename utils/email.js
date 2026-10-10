
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log("Email configuration:");
console.log("EMAIL_USER exists:", Boolean(EMAIL_USER));
console.log("EMAIL_PASS exists:", Boolean(EMAIL_PASS));

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error(
        "Email configuration missing. Check EMAIL_USER and EMAIL_PASS in your .env file."
    );
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

export const verifyEmailConfiguration = async () => {
    try {
        await transporter.verify();
        console.log("Gmail SMTP connection verified successfully.");
        return true;
    } catch (error) {
        console.error("Gmail SMTP verification failed:", {
            code: error.code,
            command: error.command,
            message: error.message
        });
        return false;
    }
};

export const sendOTPEmail = async (
    email,
    otp,
    type = "verification"
) => {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error(
            "EMAIL_USER or EMAIL_PASS is missing from the environment."
        );
    }

    if (!email || !otp) {
        throw new Error("Recipient email and OTP are required.");
    }

    const isReset = type === "reset";

    const subject = isReset
        ? "SmartRecruit Password Reset OTP"
        : "SmartRecruit Email Verification OTP";

    const message = isReset
        ? `Your SmartRecruit password reset OTP is ${otp}. It is valid for 10 minutes.`
        : `Your SmartRecruit verification OTP is ${otp}. It is valid for 10 minutes.`;

    console.log("Attempting to send OTP email.");
    console.log("Recipient:", email);

    try {
        const info = await transporter.sendMail({
            from: {
                name: "SmartRecruit",
                address: EMAIL_USER
            },
            to: email,
            subject,
            text: message
        });

        console.log("Email accepted by mail server.");
        console.log("Message ID:", info.messageId);
        console.log("Accepted recipients:", info.accepted);
        console.log("Rejected recipients:", info.rejected);

        if (
            info.rejected?.length &&
            !info.accepted?.length
        ) {
            throw new Error(
                "The mail server rejected the recipient address."
            );
        }

        return info;
    } catch (error) {
        console.error("OTP EMAIL FAILED:", {
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
            message: error.message
        });

        throw error;
    }
};

