import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canApprovePayments } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id: ceremonyId, paymentId } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony || !(await canApprovePayments(ceremonyId, user.id))) {
    return jsonError("Only party admins can approve", 403);
  }

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid status");

  const payment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: parsed.data.status,
      reviewedAt: new Date(),
    },
  });

  await notifyUser({
    userId: payment.payerId,
    type: "payment_review",
    title: parsed.data.status === "APPROVED" ? "Payment approved" : "Payment rejected",
    body:
      parsed.data.status === "APPROVED"
        ? "Your payment was approved. Thank you!"
        : "Your payment was rejected. Contact the treasurer.",
    link: `/ceremonies/${ceremonyId}`,
  });

  return jsonOk(payment);
}
