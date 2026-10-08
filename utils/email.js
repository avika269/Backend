import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOTPEmail = async (
  email,
  otp,
  type = "verification"
) => {
  const subject =
    type === "reset"
      ? "SmartRecruit Password Reset OTP"
      : "SmartRecruit Email Verification OTP";

  const message =
    type === "reset"
      ? `Your SmartRecruit password reset OTP is ${otp}. It is valid for 10 minutes.`
      : `Your SmartRecruit verification OTP is ${otp}. It is valid for 10 minutes.`;

  console.log("Attempting to send email...");
  console.log("From:", process.env.EMAIL_USER);
  console.log("To:", email);

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message
  });

  console.log("EMAIL SENT SUCCESSFULLY");
  console.log("Message ID:", info.messageId);
  console.log("Accepted:", info.accepted);
  console.log("Rejected:", info.rejected);

  return info;
};