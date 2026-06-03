import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  addCeremonyGuests,
  canManageCeremonyGuests,
  filterGuestIdsForInviter,
} from "@/lib/ceremony-guests";
import { db } from "@/lib/db";
import { notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const postSchema = z.object({
  userIds: z.array(z.string()).min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id } });
  if (!ceremony) return jsonError("Party not found", 404);

  const guests = await db.ceremonyGuest.findMany({
    where: { ceremonyId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk(guests.map((g) => g.user));
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
  if (!canManageCeremonyGuests(ceremony, user.id)) {
    return jsonError("Only party organizer can invite", 403);
  }

  const body = await parseJson<unknown>(request);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");

  const allowed = await filterGuestIdsForInviter(
    user.id,
    parsed.data.userIds.filter((uid) => uid !== ceremony.birthdayUserId),
  );
  if (allowed.length === 0) {
    return jsonError("No valid friends to add", 400);
  }

  const { added } = await addCeremonyGuests(id, allowed, user.id);

  for (const guestId of allowed) {
    notifyUserAsync({
      userId: guestId,
      type: "ceremony_invite",
      title: "Party invitation",
      body: `${user.name} added you to "${ceremony.title}" (${ceremony.birthdayUser.name}'s birthday)`,
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
  if (!canManageCeremonyGuests(ceremony, user.id)) {
    return jsonError("Only party organizer can remove guests", 403);
  }

  const guestUserId = new URL(request.url).searchParams.get("userId");
  if (!guestUserId) return jsonError("userId required", 400);

  await db.ceremonyGuest.deleteMany({
    where: { ceremonyId: id, userId: guestUserId },
  });

  return jsonOk({ ok: true });
}
