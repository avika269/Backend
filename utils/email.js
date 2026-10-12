
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "SmartRecruit";

let cachedSenderEmail = null;
const getBrevoSenderEmail = async () => {
    if (process.env.BREVO_SENDER_EMAIL) {
        return process.env.BREVO_SENDER_EMAIL;
    }
    if (cachedSenderEmail) {
        return cachedSenderEmail;
    }
    try {
        const res = await fetch("https://api.brevo.com/v3/senders", {
            headers: { "api-key": BREVO_API_KEY }
        });
        if (res.ok) {
            const data = await res.json();
            const activeSender = data.senders?.find((s) => s.active)?.email;
            if (activeSender) {
                cachedSenderEmail = activeSender;
                return activeSender;
            }
        }
    } catch (e) {
        console.warn("Could not fetch Brevo senders list:", e.message);
    }
    return "agarwalsanyam150@gmail.com";
};

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log("Email configuration:");
console.log("BREVO_API_KEY exists:", Boolean(BREVO_API_KEY));
console.log("EMAIL_USER exists:", Boolean(EMAIL_USER));
console.log("EMAIL_PASS exists:", Boolean(EMAIL_PASS));

// Nodemailer transport as fallback when BREVO_API_KEY is not set
let transporter = null;
if (!BREVO_API_KEY && EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });
}

export const verifyEmailConfiguration = async () => {
    if (BREVO_API_KEY) {
        try {
            const response = await fetch("https://api.brevo.com/v3/account", {
                headers: { "api-key": BREVO_API_KEY }
            });
            if (response.ok) {
                console.log("Brevo API connection verified successfully.");
                return true;
            }
            const err = await response.json().catch(() => ({}));
            console.error("Brevo API verification failed:", err);
            return false;
        } catch (error) {
            console.error("Brevo API verification failed:", error.message);
            return false;
        }
    }

    if (transporter) {
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
    }

    console.warn("No valid email configuration found (neither BREVO_API_KEY nor EMAIL credentials).");
    return false;
};

const sendViaBrevo = async (email, otp, isReset) => {
    const subject = isReset
        ? "SmartRecruit Password Reset OTP"
        : "SmartRecruit Email Verification OTP";

    const textContent = isReset
        ? `Your SmartRecruit password reset OTP is ${otp}. It is valid for 10 minutes.`
        : `Your SmartRecruit verification OTP is ${otp}. It is valid for 10 minutes.`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-top: 0; text-align: center;">SmartRecruit</h2>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p style="font-size: 15px; color: #374151;">Hello,</p>
            <p style="font-size: 15px; color: #374151;">
                ${isReset ? "You requested to reset your password. Use the following One-Time Password (OTP) to proceed:" : "Thank you for registering. Use the following One-Time Password (OTP) to verify your account:"}
            </p>
            <div style="background-color: #f3f4f6; padding: 18px; border-radius: 6px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                This OTP is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
                &copy; SmartRecruit. All rights reserved.
            </p>
        </div>
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
        const senderEmail = await getBrevoSenderEmail();
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: BREVO_SENDER_NAME,
                    email: senderEmail
                },
                to: [{ email }],
                subject,
                htmlContent,
                textContent
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errMsg = data.message || `Brevo API returned status ${response.status}`;
            throw new Error(errMsg);
        }

        console.log("Brevo email accepted. Message ID:", data.messageId);

        return {
            messageId: data.messageId,
            accepted: [email],
            rejected: []
        };
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
};

const sendViaNodemailer = async (email, otp, isReset) => {
    if (!transporter) {
        throw new Error("Nodemailer transporter is not configured.");
    }

    const subject = isReset
        ? "SmartRecruit Password Reset OTP"
        : "SmartRecruit Email Verification OTP";

    const textContent = isReset
        ? `Your SmartRecruit password reset OTP is ${otp}. It is valid for 10 minutes.`
        : `Your SmartRecruit verification OTP is ${otp}. It is valid for 10 minutes.`;

    const info = await transporter.sendMail({
        from: {
            name: "SmartRecruit",
            address: EMAIL_USER
        },
        to: email,
        subject,
        text: textContent
    });

    if (info.rejected?.length && !info.accepted?.length) {
        throw new Error("The mail server rejected the recipient address.");
    }

    return info;
};

export const sendOTPEmail = async (
    email,
    otp,
    type = "verification"
) => {
    if (!email || !otp) {
        throw new Error("Recipient email and OTP are required.");
    }

    const isReset = type === "reset";
    console.log("Attempting to send OTP email to:", email, `(Type: ${type})`);

    try {
        if (BREVO_API_KEY) {
            console.log("Sending email via Brevo REST API (HTTPS)...");
            return await sendViaBrevo(email, otp, isReset);
        }

        if (EMAIL_USER && EMAIL_PASS) {
            console.log("Sending email via Nodemailer SMTP fallback...");
            return await sendViaNodemailer(email, otp, isReset);
        }

        throw new Error(
            "Neither BREVO_API_KEY nor EMAIL_USER/EMAIL_PASS is configured."
        );
    } catch (error) {
        console.error("OTP EMAIL FAILED:", {
            message: error.message,
            code: error.code
        });
        throw error;
    }
};


