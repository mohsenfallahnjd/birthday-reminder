import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFriendRelation } from "@/lib/friends";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const addSchema = z
  .object({
    email: z.string().email().optional(),
    userId: z.string().optional(),
  })
  .refine((d) => d.email || d.userId, { message: "Email or userId required" });

export async function GET() {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ userId: user.id }, { friendId: user.id }],
    },
    include: {
      user: { select: { id: true, name: true, email: true, birthMonth: true, birthDay: true } },
      friend: { select: { id: true, name: true, email: true, birthMonth: true, birthDay: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships.map((f) => {
    const other = f.userId === user.id ? f.friend : f.user;
    return {
      id: f.id,
      status: f.status,
      user: other,
      isRequester: f.userId === user.id,
    };
  });

  return jsonOk(friends);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");

  let friendId = parsed.data.userId;
  if (parsed.data.email) {
    const byEmail = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!byEmail) return jsonError("No user with this email", 404);
    friendId = byEmail.id;
  }

  if (!friendId) return jsonError("User not found", 404);
  if (friendId === user.id) return jsonError("Cannot add yourself");

  const { relation, friendshipId } = await getFriendRelation(user.id, friendId);

  if (relation === "friends") {
    return jsonError("Already friends", 409);
  }
  if (relation === "pending_sent") {
    return jsonError("Friend request already sent", 409);
  }
  if (relation === "pending_received" && friendshipId) {
    const updated = await db.friendship.update({
      where: { id: friendshipId },
      data: { status: "ACCEPTED" },
    });
    const friend = await db.user.findUnique({
      where: { id: friendId },
      select: { name: true },
    });
    await notifyUser({
      userId: friendId,
      type: "friend_accepted",
      title: "Friend request accepted",
      body: `${user.name} accepted your friend request`,
      link: "/people",
    });
    return jsonOk(updated);
  }

  const friend = await db.user.findUnique({ where: { id: friendId } });
  if (!friend) return jsonError("User not found", 404);

  const friendship = await db.friendship.create({
    data: { userId: user.id, friendId, status: "PENDING" },
  });

  await notifyUser({
    userId: friendId,
    type: "friend_request",
    title: "Friend request",
    body: `${user.name} wants to add you as a friend`,
    link: "/people",
  });

  return jsonOk(friendship);
}
