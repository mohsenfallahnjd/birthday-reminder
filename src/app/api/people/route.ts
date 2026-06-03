import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const addSchema = z.object({ email: z.email() });

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
  if (!parsed.success) return jsonError("Invalid email");

  const friend = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!friend) return jsonError("No user with this email", 404);
  if (friend.id === user.id) return jsonError("Cannot add yourself");

  const friendship = await db.friendship.upsert({
    where: { userId_friendId: { userId: user.id, friendId: friend.id } },
    create: { userId: user.id, friendId: friend.id, status: "PENDING" },
    update: {},
  });

  await notifyUser({
    userId: friend.id,
    type: "friend_request",
    title: "Friend request",
    body: `${user.name} wants to add you as a friend`,
    link: "/people",
  });

  return jsonOk(friendship);
}
