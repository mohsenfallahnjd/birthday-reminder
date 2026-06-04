import type { CeremonyMemberRole } from "@prisma/client";
import { db } from "@/lib/db";

/** Vibrant palette — each new party picks one at random */
export const PARTY_COLORS = [
  "#e11d48",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#059669",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#c026d3",
  "#db2777",
] as const;

export function randomPartyColor() {
  return PARTY_COLORS[Math.floor(Math.random() * PARTY_COLORS.length)];
}

export function partyGradientStyle(color: string) {
  return {
    background: `linear-gradient(135deg, ${color}22 0%, ${color}44 50%, ${color}18 100%)`,
    borderColor: color,
  } as const;
}

export async function getAcceptedFriends(userId: string) {
  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userId }, { friendId: userId }],
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      friend: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
  return friendships.map((f) => (f.userId === userId ? f.friend : f.user));
}

export async function filterFriendIdsForInviter(inviterId: string, candidateIds: string[]) {
  if (candidateIds.length === 0) return [];
  const friends = await getAcceptedFriends(inviterId);
  const friendIds = new Set(friends.map((f) => f.id));
  return [...new Set(candidateIds)].filter((id) => friendIds.has(id));
}

export async function getCeremonyMembers(ceremonyId: string) {
  return db.ceremonyMember.findMany({
    where: { ceremonyId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function getMemberRole(
  ceremonyId: string,
  userId: string,
): Promise<CeremonyMemberRole | null> {
  const row = await db.ceremonyMember.findUnique({
    where: { ceremonyId_userId: { ceremonyId, userId } },
    select: { role: true },
  });
  return row?.role ?? null;
}

export async function isCeremonyAdmin(ceremonyId: string, userId: string) {
  const role = await getMemberRole(ceremonyId, userId);
  return role === "ADMIN";
}

export async function getCeremonyAdminUserIds(ceremonyId: string) {
  const admins = await db.ceremonyMember.findMany({
    where: { ceremonyId, role: "ADMIN" },
    select: { userId: true },
  });
  return admins.map((a) => a.userId);
}

export async function isBirthdayHolder(ceremony: { birthdayUserId: string }, userId: string) {
  return ceremony.birthdayUserId === userId;
}

export async function canApprovePayments(ceremonyId: string, userId: string) {
  return isCeremonyAdmin(ceremonyId, userId);
}

export async function canEditTreasurerCard(ceremonyId: string, userId: string) {
  return isCeremonyAdmin(ceremonyId, userId);
}

export async function canManagePartyTeam(
  ceremony: { id: string; birthdayUserId: string },
  userId: string,
) {
  if (ceremony.birthdayUserId === userId) return true;
  return isCeremonyAdmin(ceremony.id, userId);
}

export async function isValidBirthdayHolderCandidate(
  ceremony: { id: string; groupId: string | null },
  userId: string,
) {
  if (ceremony.groupId) {
    const inGroup = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: ceremony.groupId, userId } },
    });
    if (inGroup) return true;
  }
  const onTeam = await db.ceremonyMember.findUnique({
    where: { ceremonyId_userId: { ceremonyId: ceremony.id, userId } },
  });
  return !!onTeam;
}

export async function changeBirthdayHolder(
  ceremonyId: string,
  newUserId: string,
  invitedById: string,
) {
  const ceremony = await db.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony) return { ok: false as const, error: "Party not found" };

  if (!(await isValidBirthdayHolderCandidate(ceremony, newUserId))) {
    return { ok: false as const, error: "That person cannot be the birthday holder" };
  }

  const oldUserId = ceremony.birthdayUserId;
  if (oldUserId === newUserId) return { ok: true as const };

  await db.$transaction(async (tx) => {
    await tx.ceremony.update({
      where: { id: ceremonyId },
      data: { birthdayUserId: newUserId },
    });

    const oldRow = await tx.ceremonyMember.findUnique({
      where: { ceremonyId_userId: { ceremonyId, userId: oldUserId } },
    });
    if (oldRow && oldRow.role === "BIRTHDAY") {
      await tx.ceremonyMember.update({
        where: { id: oldRow.id },
        data: { role: "GUEST" },
      });
    }

    await tx.ceremonyMember.upsert({
      where: { ceremonyId_userId: { ceremonyId, userId: newUserId } },
      create: {
        ceremonyId,
        userId: newUserId,
        role: "BIRTHDAY",
        invitedById,
      },
      update: { role: "BIRTHDAY" },
    });
  });

  return { ok: true as const };
}

export async function canEditPartyWishlist(
  ceremony: { id: string; birthdayUserId: string },
  userId: string,
) {
  if (ceremony.birthdayUserId === userId) return true;
  return isCeremonyAdmin(ceremony.id, userId);
}

export async function bootstrapCeremonyMembers(
  ceremonyId: string,
  opts: {
    birthdayUserId: string;
    adminUserIds: string[];
    guestUserIds: string[];
    invitedById: string;
  },
) {
  const { birthdayUserId, adminUserIds, guestUserIds, invitedById } = opts;
  const adminSet = new Set(
    adminUserIds.filter((id) => id && id !== birthdayUserId),
  );
  const guestSet = new Set(
    guestUserIds.filter((id) => id && id !== birthdayUserId && !adminSet.has(id)),
  );

  const rows: {
    ceremonyId: string;
    userId: string;
    role: CeremonyMemberRole;
    invitedById?: string;
  }[] = [
    { ceremonyId, userId: birthdayUserId, role: "BIRTHDAY" },
    ...[...adminSet].map((userId) => ({
      ceremonyId,
      userId,
      role: "ADMIN" as const,
      invitedById,
    })),
    ...[...guestSet].map((userId) => ({
      ceremonyId,
      userId,
      role: "GUEST" as const,
      invitedById,
    })),
  ];

  await db.ceremonyMember.createMany({ data: rows, skipDuplicates: true });

  const firstAdmin = [...adminSet][0];
  if (firstAdmin) {
    await db.ceremony.update({
      where: { id: ceremonyId },
      data: { adminUserId: firstAdmin },
    });
  }
}

export async function addCeremonyMembers(
  ceremonyId: string,
  userIds: string[],
  role: "ADMIN" | "GUEST",
  invitedById: string,
) {
  const ceremony = await db.ceremony.findUnique({
    where: { id: ceremonyId },
    select: { birthdayUserId: true },
  });
  if (!ceremony) return { added: 0 };

  const unique = [...new Set(userIds)].filter(
    (id) => id && id !== ceremony.birthdayUserId,
  );
  if (unique.length === 0) return { added: 0 };

  const result = await db.ceremonyMember.createMany({
    data: unique.map((userId) => ({
      ceremonyId,
      userId,
      role,
      invitedById,
    })),
    skipDuplicates: true,
  });
  return { added: result.count };
}

export async function getCeremonyParticipantIds(ceremony: {
  id: string;
  birthdayUserId: string;
  groupId: string | null;
}) {
  const members = await db.ceremonyMember.findMany({
    where: { ceremonyId: ceremony.id },
    select: { userId: true },
  });
  const ids = new Set(members.map((m) => m.userId));

  if (ceremony.groupId) {
    const groupMembers = await db.groupMember.findMany({
      where: { groupId: ceremony.groupId },
      select: { userId: true },
    });
    for (const m of groupMembers) ids.add(m.userId);
  }

  return [...ids];
}
