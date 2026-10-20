/** Sends a password reset email through the configured Brevo account. */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@example.com";
  const senderName = process.env.BREVO_SENDER_NAME ?? "CRM";
  const isDevelopment = process.env.NODE_ENV !== "production";
  const recipient = isDevelopment && process.env.DEV_EMAIL_OVERRIDE
    ? process.env.DEV_EMAIL_OVERRIDE
    : to;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: recipient }],
        subject: "Reset your CRM password",
        htmlContent: `<p>A password reset was requested for your CRM account.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in one hour.</p>`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
