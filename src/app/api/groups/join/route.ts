import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({ inviteCode: z.string().min(4) });

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("کد دعوت نامعتبر");

  const group = await db.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    include: { owner: true },
  });
  if (!group) return jsonError("گروه یافت نشد", 404);

  await db.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    create: { groupId: group.id, userId: user.id },
    update: {},
  });

  if (group.ownerId !== user.id) {
    await notifyUser({
      userId: group.ownerId,
      type: "group_join",
      title: "عضو جدید در گروه",
      body: `${user.name} به گروه «${group.name}» پیوست`,
      link: `/groups/${group.id}`,
    });
  }

  return jsonOk({ groupId: group.id });
}
