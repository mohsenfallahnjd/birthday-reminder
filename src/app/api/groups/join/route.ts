import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({ inviteCode: z.string().min(4) });

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid invite code");

  const group = await db.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    include: { owner: true },
  });
  if (!group) return jsonError("Group not found", 404);

  await db.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    create: { groupId: group.id, userId: user.id },
    update: {},
  });

  if (group.ownerId !== user.id) {
    await notifyUser({
      userId: group.ownerId,
      type: "group_join",
      title: "New group member",
      body: `${user.name} joined group "${group.name}"`,
      link: `/groups/${group.id}`,
    });
  }

  return jsonOk({ groupId: group.id });
}
