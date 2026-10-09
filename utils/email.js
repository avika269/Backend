
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

  try {
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
  } catch (error) {
    console.error("OTP EMAIL FAILED:", error.message);
    throw error;
  }
};