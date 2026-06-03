import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFriendRelationsForUsers } from "@/lib/friends";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return jsonOk([]);

  const users = await db.user.findMany({
    where: {
      id: { not: user.id },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      birthMonth: true,
      birthDay: true,
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  const relations = await getFriendRelationsForUsers(
    user.id,
    users.map((u) => u.id),
  );

  const results = users.map((u) => {
    const rel = relations.get(u.id) ?? { relation: "none" as const, friendshipId: null };
    return {
      ...u,
      relation: rel.relation,
      friendshipId: rel.friendshipId,
    };
  });

  return jsonOk(results);
}
