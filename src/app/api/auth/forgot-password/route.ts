import { z } from "zod";
import { jsonError, jsonOk } from "@/core/api/responses";
import { requestPasswordReset } from "@/core/auth/password-reset-service";

const requestSchema = z.object({ email: z.string().email() });
const genericMessage = "If an account exists, a reset link was sent.";

/** Issues a one-hour password reset token without revealing account existence. */
export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("VALIDATION", "Enter a valid email address", 400);

  const email = parsed.data.email.toLowerCase().trim();
  await requestPasswordReset(email);
  return jsonOk({ success: true, message: genericMessage });
}
