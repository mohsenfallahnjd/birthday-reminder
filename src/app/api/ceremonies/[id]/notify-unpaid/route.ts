import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({
    where: { id },
    include: {
      group: {
        include: { members: { select: { userId: true } } },
      },
      payments: { where: { status: "APPROVED" }, select: { payerId: true } },
    },
  });

  if (!ceremony || ceremony.adminUserId !== user.id) {
    return jsonError("Treasurer only", 403);
  }

  let memberIds: string[] = [];
  if (ceremony.groupId && ceremony.group) {
    memberIds = ceremony.group.members.map((m) => m.userId);
  } else {
    const friends = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { userId: ceremony.birthdayUserId },
          { friendId: ceremony.birthdayUserId },
        ],
      },
    });
    memberIds = friends.flatMap((f) => [f.userId, f.friendId]);
  }

  const paidSet = new Set(ceremony.payments.map((p) => p.payerId));
  const unpaid = memberIds.filter(
    (id) => id !== ceremony.birthdayUserId && id !== ceremony.adminUserId && !paidSet.has(id),
  );

  await Promise.all(
    unpaid.map((userId) =>
      notifyUser({
        userId,
        type: "payment_reminder",
        title: "Gift contribution reminder",
        body: `You have not contributed to "${ceremony.title}" yet. Any amount helps!`,
        link: `/ceremonies/${id}`,
      }),
    ),
  );

  return jsonOk({ notified: unpaid.length });
}
