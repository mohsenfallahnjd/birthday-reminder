import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyMany } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  title: z.string().min(2),
  birthdayUserId: z.string(),
  groupId: z.string().optional(),
  adminUserId: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("اطلاعات نامعتبر");

  if (parsed.data.groupId) {
    const member = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: parsed.data.groupId, userId: user.id },
      },
    });
    if (!member) return jsonError("عضو گروه نیستید", 403);
  }

  const ceremony = await db.ceremony.create({
    data: {
      title: parsed.data.title,
      birthdayUserId: parsed.data.birthdayUserId,
      groupId: parsed.data.groupId,
      adminUserId: parsed.data.adminUserId ?? user.id,
      cardNumber: parsed.data.cardNumber,
      cardHolder: parsed.data.cardHolder,
    },
    include: { birthdayUser: { select: { name: true } } },
  });

  let notifyIds: string[] = [];
  if (parsed.data.groupId) {
    const members = await db.groupMember.findMany({
      where: { groupId: parsed.data.groupId },
      select: { userId: true },
    });
    notifyIds = members.map((m) => m.userId);
  } else {
    const friends = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { userId: parsed.data.birthdayUserId },
          { friendId: parsed.data.birthdayUserId },
        ],
      },
    });
    notifyIds = friends.flatMap((f) => [f.userId, f.friendId]);
  }

  await notifyMany(notifyIds.filter((id) => id !== user.id), {
    type: "ceremony",
    title: "جشن تولد جدید",
    body: `جشن «${ceremony.title}» برای ${ceremony.birthdayUser.name} ساخته شد`,
    link: `/ceremonies/${ceremony.id}`,
  });

  return jsonOk(ceremony);
}
