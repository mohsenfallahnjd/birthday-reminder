import { db } from "@/lib/db";

export type FriendRelation =
  | "none"
  | "friends"
  | "pending_sent"
  | "pending_received";

export async function getFriendRelation(
  userId: string,
  otherUserId: string,
): Promise<{ relation: FriendRelation; friendshipId: string | null }> {
  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId: otherUserId },
        { userId: otherUserId, friendId: userId },
      ],
    },
  });

  if (!friendship) return { relation: "none", friendshipId: null };
  if (friendship.status === "ACCEPTED") {
    return { relation: "friends", friendshipId: friendship.id };
  }
  if (friendship.userId === userId) {
    return { relation: "pending_sent", friendshipId: friendship.id };
  }
  return { relation: "pending_received", friendshipId: friendship.id };
}

export async function getFriendRelationsForUsers(
  userId: string,
  otherUserIds: string[],
) {
  if (otherUserIds.length === 0) return new Map<string, { relation: FriendRelation; friendshipId: string | null }>();

  const friendships = await db.friendship.findMany({
    where: {
      OR: [
        { userId, friendId: { in: otherUserIds } },
        { userId: { in: otherUserIds }, friendId: userId },
      ],
    },
  });

  const map = new Map<string, { relation: FriendRelation; friendshipId: string | null }>();
  for (const id of otherUserIds) {
    map.set(id, { relation: "none", friendshipId: null });
  }

  for (const f of friendships) {
    const otherId = f.userId === userId ? f.friendId : f.userId;
    if (f.status === "ACCEPTED") {
      map.set(otherId, { relation: "friends", friendshipId: f.id });
    } else if (f.userId === userId) {
      map.set(otherId, { relation: "pending_sent", friendshipId: f.id });
    } else {
      map.set(otherId, { relation: "pending_received", friendshipId: f.id });
    }
  }

  return map;
}
