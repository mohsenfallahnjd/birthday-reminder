import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({ friendshipId: z.string() });

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");

  const friendship = await db.friendship.findUnique({
    where: { id: parsed.data.friendshipId },
  });
  if (!friendship || friendship.friendId !== user.id) {
    return jsonError("Request not found", 404);
  }
  if (friendship.status !== "PENDING") {
    return jsonError("Request is no longer pending", 409);
  }

  const updated = await db.friendship.update({
    where: { id: friendship.id },
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
