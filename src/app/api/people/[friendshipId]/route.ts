import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk } from "@/lib/api";

async function getFriendshipForUser(friendshipId: string, userId: string) {
  const friendship = await db.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      user: { select: { id: true, name: true } },
      friend: { select: { id: true, name: true } },
    },
  });
  if (!friendship) return null;
  if (friendship.userId !== userId && friendship.friendId !== userId) return null;
  return friendship;
}

/** Accept incoming friend request */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ friendshipId: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { friendshipId } = await params;
  const friendship = await getFriendshipForUser(friendshipId, user.id);
  if (!friendship) return jsonError("Request not found", 404);
  if (friendship.friendId !== user.id) {
    return jsonError("Only the recipient can accept", 403);
  }
  if (friendship.status !== "PENDING") {
    return jsonError("Request is no longer pending", 409);
  }

  const updated = await db.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
  });

  await notifyUser({
    userId: friendship.userId,
    type: "friend_accepted",
    title: "Friend request accepted",
    body: `${user.name} accepted your friend request`,
    link: "/people",
  });

  return jsonOk(updated);
}

/** Decline incoming, cancel outgoing, or remove friend */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ friendshipId: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { friendshipId } = await params;
  const friendship = await getFriendshipForUser(friendshipId, user.id);
  if (!friendship) return jsonError("Not found", 404);

  const isRequester = friendship.userId === user.id;
  const isRecipient = friendship.friendId === user.id;

  if (friendship.status === "PENDING") {
    if (!isRequester && !isRecipient) return jsonError("Forbidden", 403);
  } else if (friendship.status === "ACCEPTED") {
    // either party can unfriend
  } else {
    return jsonError("Invalid state", 409);
  }

  await db.friendship.delete({ where: { id: friendshipId } });
  return jsonOk({ ok: true });
}
