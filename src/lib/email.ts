import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await resend.emails.send({
    from: "Birthday App <noreply@themohsen.me>",
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Reset your password</h2>
        <p style="color:#666;margin:0 0 24px">Hi ${name}, click the button below to set a new password. The link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
          Reset password
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">If you didn't request this, ignore this email. Link: ${resetUrl}</p>
      </div>
    `,
  });
}
