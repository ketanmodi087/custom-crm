import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/core/utils/mail";
import {
  findPasswordResetToken,
  findPasswordResetUser,
  replacePasswordResetToken,
  updatePasswordAndConsumeTokens,
} from "./repository";

/** Creates and emails a password-reset token when the account is eligible. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findPasswordResetUser(email);
  if (!user?.isActive) return;

  const rawToken = randomBytes(32).toString("hex");
  const token = createHash("sha256").update(rawToken).digest("hex");
  await replacePasswordResetToken(email, token, new Date(Date.now() + 60 * 60 * 1000));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await sendPasswordResetEmail(email, resetLink);
}

/**
 * Consumes a valid reset token and replaces the account password.
 *
 * @throws Error with `INVALID_TOKEN` when the link is missing, used, or expired.
 */
export async function resetPassword(email: string, rawToken: string, newPassword: string): Promise<void> {
  const token = createHash("sha256").update(rawToken).digest("hex");
  const storedToken = await findPasswordResetToken(email, token);
  if (!storedToken || storedToken.expiresAt <= new Date()) throw new Error("INVALID_TOKEN");
  await updatePasswordAndConsumeTokens(email, await bcrypt.hash(newPassword, 12));
}
