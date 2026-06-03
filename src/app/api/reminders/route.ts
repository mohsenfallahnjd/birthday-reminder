import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  targetUserId: z.string(),
  groupId: z.string().optional(),
  daysBefore: z.number().min(0).max(30).default(1),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid reminder");

  const groupId = parsed.data.groupId ?? null;

  const existing = await db.reminder.findFirst({
    where: {
      ownerId: user.id,
      targetUserId: parsed.data.targetUserId,
      groupId,
    },
  });

  const reminder = existing
    ? await db.reminder.update({
        where: { id: existing.id },
        data: { daysBefore: parsed.data.daysBefore },
      })
    : await db.reminder.create({
        data: {
          ownerId: user.id,
          targetUserId: parsed.data.targetUserId,
          groupId: parsed.data.groupId,
          daysBefore: parsed.data.daysBefore,
        },
      });

  return jsonOk(reminder);
}
