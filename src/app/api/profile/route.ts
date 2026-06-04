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
  });
}
