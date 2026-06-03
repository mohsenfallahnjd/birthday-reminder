import { db } from "@/lib/db";

export async function getAcceptedFriends(userId: string) {
  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userId }, { friendId: userId }],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      friend: { select: { id: true, name: true, email: true } },
    },
  });

  return friendships.map((f) => (f.userId === userId ? f.friend : f.user));
}

/** Friend user ids the inviter is allowed to add to a party */
export async function filterGuestIdsForInviter(inviterId: string, candidateIds: string[]) {
  if (candidateIds.length === 0) return [];

  const friends = await getAcceptedFriends(inviterId);
  const friendIds = new Set(friends.map((f) => f.id));
  return [...new Set(candidateIds)].filter((id) => friendIds.has(id));
}

export async function addCeremonyGuests(
  ceremonyId: string,
  userIds: string[],
  invitedById: string,
) {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return { added: 0 };

  const result = await db.ceremonyGuest.createMany({
    data: unique.map((userId) => ({
      ceremonyId,
      userId,
      invitedById,
    })),
    skipDuplicates: true,
  });

  return { added: result.count };
}

export async function getCeremonyGuestUserIds(ceremonyId: string) {
  const guests = await db.ceremonyGuest.findMany({
    where: { ceremonyId },
    select: { userId: true },
  });
  return guests.map((g) => g.userId);
}

export async function getCeremonyParticipantIds(ceremony: {
  id: string;
  birthdayUserId: string;
  adminUserId: string | null;
  groupId: string | null;
}) {
  const guestIds = await getCeremonyGuestUserIds(ceremony.id);
  const ids = new Set(guestIds);
  ids.add(ceremony.birthdayUserId);
  if (ceremony.adminUserId) ids.add(ceremony.adminUserId);

  if (ceremony.groupId) {
    const members = await db.groupMember.findMany({
      where: { groupId: ceremony.groupId },
      select: { userId: true },
    });
    for (const m of members) ids.add(m.userId);
  }

  return [...ids];
}

export function canManageCeremonyGuests(
  ceremony: { adminUserId: string | null; birthdayUserId: string },
  userId: string,
) {
  return ceremony.adminUserId === userId || ceremony.birthdayUserId === userId;
}
