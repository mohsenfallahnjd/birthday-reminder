import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  addCeremonyMembers,
  canManagePartyTeam,
  filterFriendIdsForInviter,
  getCeremonyMembers,
} from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const postSchema = z.object({
  userIds: z.array(z.string()).min(1),
  role: z.enum(["ADMIN", "GUEST"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const members = await getCeremonyMembers(id);
  return jsonOk(
    members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    })),
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({
    where: { id },
    include: { birthdayUser: { select: { name: true } } },
  });
  if (!ceremony) return jsonError("Party not found", 404);
  if (!(await canManagePartyTeam(ceremony, user.id))) {
    return jsonError("Only holder or admins can manage the team", 403);
  }

  const body = await parseJson<unknown>(request);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");

  let userIds = parsed.data.userIds;
  if (parsed.data.role === "GUEST") {
    userIds = await filterFriendIdsForInviter(user.id, userIds);
  }

  const { added } = await addCeremonyMembers(
    id,
    userIds,
    parsed.data.role,
    user.id,
  );

  for (const uid of userIds) {
    notifyUserAsync({
      userId: uid,
      type: "ceremony_invite",
      title: "Party invitation",
      body: `You're invited to "${ceremony.title}" (${ceremony.birthdayUser.name}'s birthday)`,
      link: `/ceremonies/${id}`,
    });
  }

  return jsonOk({ added });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id } });
  if (!ceremony) return jsonError("Party not found", 404);
  if (!(await canManagePartyTeam(ceremony, user.id))) {
    return jsonError("Only holder or admins can manage the team", 403);
  }

  const targetUserId = new URL(request.url).searchParams.get("userId");
  if (!targetUserId) return jsonError("userId required", 400);
  if (targetUserId === ceremony.birthdayUserId) {
    return jsonError("Cannot remove the birthday holder", 400);
  }

  await db.ceremonyMember.deleteMany({
    where: { ceremonyId: id, userId: targetUserId },
  });

  return jsonOk({ ok: true });
}
