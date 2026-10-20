import { z } from "zod";
import { jsonError, jsonOk } from "@/core/api/responses";
import { resetPassword } from "@/core/auth/password-reset-service";

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().length(64),
  newPassword: z.string().min(10).max(128),
});

/** Validates a one-time token and updates the password atomically. */
export async function POST(request: Request) {
  const parsed = resetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("VALIDATION", "Invalid reset request", 400, parsed.error.flatten());

  const email = parsed.data.email.toLowerCase().trim();
  try {
    await resetPassword(email, parsed.data.token, parsed.data.newPassword);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_TOKEN") {
      return jsonError("INVALID_TOKEN", "Invalid or expired reset link", 400);
    }
    throw error;
  }

  return jsonOk({ success: true, message: "Password reset successfully" });
}
