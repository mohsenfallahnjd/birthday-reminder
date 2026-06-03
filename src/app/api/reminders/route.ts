import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  targetUserId: z.string(),
  groupId: z.string().optional().nullable(),
  daysBefore: z.number().min(0).max(30).default(1),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("یادآور نامعتبر");

  const reminder = await db.reminder.upsert({
    where: {
      ownerId_targetUserId_groupId: {
        ownerId: user.id,
        targetUserId: parsed.data.targetUserId,
        groupId: parsed.data.groupId ?? null,
      },
    },
    create: {
      ownerId: user.id,
      targetUserId: parsed.data.targetUserId,
      groupId: parsed.data.groupId ?? undefined,
      daysBefore: parsed.data.daysBefore,
    },
    update: { daysBefore: parsed.data.daysBefore },
  });

  return jsonOk(reminder);
}
