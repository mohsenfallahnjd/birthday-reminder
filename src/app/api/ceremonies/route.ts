import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  addCeremonyGuests,
  filterGuestIdsForInviter,
} from "@/lib/ceremony-guests";
import { db } from "@/lib/db";
import { notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  title: z.string().min(2),
  birthdayUserId: z.string(),
  groupId: z.string().optional(),
  guestIds: z.array(z.string()).optional(),
  includeGroupMembers: z.boolean().optional(),
  adminUserId: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input");

  if (parsed.data.groupId) {
    const member = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: parsed.data.groupId, userId: user.id },
      },
    });
    if (!member) return jsonError("Not a group member", 403);
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

  const friendGuestIds = await filterGuestIdsForInviter(
    user.id,
    (parsed.data.guestIds ?? []).filter((id) => id !== parsed.data.birthdayUserId),
  );
  await addCeremonyGuests(ceremony.id, friendGuestIds, user.id);

  const notifyIds = new Set<string>(friendGuestIds);

  if (parsed.data.groupId && parsed.data.includeGroupMembers !== false) {
    const members = await db.groupMember.findMany({
      where: { groupId: parsed.data.groupId },
      select: { userId: true },
    });
    for (const m of members) {
      if (m.userId !== parsed.data.birthdayUserId) notifyIds.add(m.userId);
    }
  }

  for (const guestId of notifyIds) {
    if (guestId === user.id) continue;
    notifyUserAsync({
      userId: guestId,
      type: "ceremony",
      title: "New birthday party",
      body: `You're invited to "${ceremony.title}" for ${ceremony.birthdayUser.name}`,
      link: `/ceremonies/${ceremony.id}`,
    });
  }

  return jsonOk(ceremony);
}
