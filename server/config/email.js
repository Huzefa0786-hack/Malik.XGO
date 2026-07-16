import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Malik.XGO" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

export const sendDepositConfirmation = async (email: string, name: string, amount: number) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #111; color: #fff; border-radius: 10px;">
      <h1 style="color: #22c55e;">💰 Deposit Confirmed</h1>
      <p>Dear ${name},</p>
      <p>Your deposit of <strong style="color: #22c55e;">₹${amount.toLocaleString()}</strong> has been successfully added to your wallet.</p>
      <p>Your new balance is available in your dashboard.</p>
      <br>
      <p>Thank you for playing on <strong style="color: #22c55e;">Malik.XGO</strong>!</p>
    </div>
  `;
  return sendEmail(email, "💰 Deposit Confirmed - Malik.XGO", html);
};

export const sendWithdrawalConfirmation = async (email: string, name: string, amount: number) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #111; color: #fff; border-radius: 10px;">
      <h1 style="color: #22c55e;">💳 Withdrawal Request Received</h1>
      <p>Dear ${name},</p>
      <p>Your withdrawal request of <strong style="color: #22c55e;">₹${amount.toLocaleString()}</strong> has been received.</p>
      <p>We will process your request within 24 hours.</p>
      <br>
      <p>Thank you for playing on <strong style="color: #22c55e;">Malik.XGO</strong>!</p>
    </div>
  `;
  return sendEmail(email, "💳 Withdrawal Request - Malik.XGO", html);
};

export const sendPasswordReset = async (email: string, name: string, resetLink: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #111; color: #fff; border-radius: 10px;">
      <h1 style="color: #22c55e;">🔐 Reset Your Password</h1>
      <p>Dear ${name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetLink}" style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail(email, "🔐 Reset Your Password - Malik.XGO", html);
};