import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOTPEmail = async (email, otp, type = "verification") => {
  const subject =
    type === "reset"
      ? "SmartRecruit Password Reset OTP"
      : "SmartRecruit Email Verification OTP";

  const message =
    type === "reset"
      ? `Your SmartRecruit password reset OTP is ${otp}. It is valid for 10 minutes.`
      : `Your SmartRecruit verification OTP is ${otp}. It is valid for 10 minutes.`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message
  });
};