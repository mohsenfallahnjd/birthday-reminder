import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isValidAvatarUrl } from "@/lib/avatars";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().nullable().optional(),
  birthMonth: z.number().min(1).max(12).optional(),
  birthDay: z.number().min(1).max(31).optional(),
  birthYear: z.number().optional().nullable(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores")
    .nullable()
    .optional(),
  cardNumber: z.string().max(19).nullable().optional(),
  cardHolder: z.string().max(80).nullable().optional(),
});

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input");

  if (
    parsed.data.avatarUrl !== undefined &&
    !isValidAvatarUrl(parsed.data.avatarUrl)
  ) {
    return jsonError("Invalid avatar", 400);
  }

  if (parsed.data.username) {
    const taken = await db.user.findUnique({
      where: { username: parsed.data.username },
      select: { id: true },
    });
    if (taken && taken.id !== user.id) return jsonError("Username already taken", 409);
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return jsonOk({
    id: updated.id,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
    birthMonth: updated.birthMonth,
    birthDay: updated.birthDay,
    birthYear: updated.birthYear,
    username: updated.username,
    cardNumber: updated.cardNumber,
    cardHolder: updated.cardHolder,
  });
}
