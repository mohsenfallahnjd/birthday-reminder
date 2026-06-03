import { requireUser } from "@/lib/auth";
import { canApprovePayments, getCeremonyParticipantIds } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { notifyUserAsync } from "@/lib/notifications";
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
      payments: { where: { status: "APPROVED" }, select: { payerId: true } },
    },
  });

  if (!ceremony || !(await canApprovePayments(id, user.id))) {
    return jsonError("Party admins only", 403);
  }

  const participantIds = await getCeremonyParticipantIds(ceremony);
  const adminIds = (
    await db.ceremonyMember.findMany({
      where: { ceremonyId: id, role: "ADMIN" },
      select: { userId: true },
    })
  ).map((m) => m.userId);
  const paidSet = new Set(ceremony.payments.map((p) => p.payerId));
  const unpaid = participantIds.filter(
    (pid) =>
      pid !== ceremony.birthdayUserId &&
      !adminIds.includes(pid) &&
      !paidSet.has(pid),
  );

  for (const guestId of unpaid) {
    notifyUserAsync({
      userId: guestId,
      type: "payment_reminder",
      title: "Gift contribution reminder",
      body: `You have not contributed to "${ceremony.title}" yet. Any amount helps!`,
      link: `/ceremonies/${id}`,
    });
  }

  return jsonOk({ notified: unpaid.length });
}
