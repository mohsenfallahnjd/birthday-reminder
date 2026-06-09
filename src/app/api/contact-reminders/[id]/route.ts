import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  birthMonth: z.number().int().min(1).max(12).optional(),
  birthDay: z.number().int().min(1).max(31).optional(),
  daysBefore: z.number().int().min(0).max(30).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const contact = await db.contactReminder.findUnique({ where: { id } });
  if (!contact || contact.ownerId !== user.id) return jsonError("Not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid data");

  const updated = await db.contactReminder.update({
    where: { id },
    data: parsed.data,
  });
  return jsonOk(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const contact = await db.contactReminder.findUnique({ where: { id } });
  if (!contact || contact.ownerId !== user.id) return jsonError("Not found", 404);

  await db.contactReminder.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
