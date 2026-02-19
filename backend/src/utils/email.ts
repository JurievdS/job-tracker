import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "Job Tracker <noreply@jobtracker.app>";

const smtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (transporter) {
    await transporter.sendMail({ from: SMTP_FROM, ...options });
  } else {
    console.log("\n────────────────────────────────────────");
    console.log("📧 Email (SMTP not configured — logged to console)");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text}`);
    console.log("────────────────────────────────────────\n");
  }
}

export function buildPasswordResetEmail(resetUrl: string) {
  const subject = "Reset your password";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px;">Reset your password</h2>
      <p style="color: #555; line-height: 1.5;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in 1 hour.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
      </div>
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
      </p>
      <p style="color: #888; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `.trim();

  const text = [
    "Reset your password",
    "",
    "We received a request to reset your password.",
    "Visit the link below to choose a new one (expires in 1 hour):",
    "",
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");

  return { subject, html, text };
}
