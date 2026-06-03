import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).optional(),
  birthMonth: z.number().min(1).max(12).optional(),
  birthDay: z.number().min(1).max(31).optional(),
  birthYear: z.number().optional().nullable(),
});

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("اطلاعات نامعتبر");

  const updated = await db.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return jsonOk({
    id: updated.id,
    name: updated.name,
    birthMonth: updated.birthMonth,
    birthDay: updated.birthDay,
    birthYear: updated.birthYear,
  });
}
