import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, requireUserOrThrow } from "@/lib/auth";
import { jsonOk, jsonError, parseJson } from "@/lib/api";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(request: Request) {
  const user = await requireUserOrThrow();

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return jsonError("Not found", 404);

  const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) return jsonError("Current password is wrong", 400);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return jsonOk({ ok: true });
}
