import { z } from "zod";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { jsonOk, jsonError, parseJson } from "@/lib/api";

const schema = z.object({ email: z.email() });

export async function POST(request: Request) {
  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid email");

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  // Always return OK — don't leak whether email exists
  if (!user) return jsonOk({ ok: true });

  // Expire previous tokens
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const reset = await db.passwordResetToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const resetUrl = `${origin}/reset-password/${reset.token}`;

  await sendPasswordResetEmail(user.email, user.name, resetUrl);

  return jsonOk({ ok: true });
}
