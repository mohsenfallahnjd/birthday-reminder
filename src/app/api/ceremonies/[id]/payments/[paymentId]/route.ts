import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canApprovePayments, getCeremonyAdminUserIds } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { notifyUser, notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

// Admin: approve/reject
const adminSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

// Admin: edit amount/note on any payment
const adminEditSchema = z.object({
  amount: z.number().positive().optional(),
  note: z.string().nullable().optional(),
  wishlistItemId: z.string().nullable().optional(),
});

// Payer: settle a DEBT by uploading proof
const settleSchema = z.object({
  settle: z.literal(true),
  proofUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id: ceremonyId, paymentId } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony) return jsonError("Party not found", 404);

  const body = await parseJson<unknown>(request);

  // ── Settle debt (payer action) ──────────────────────────────────────────
  const settled = settleSchema.safeParse(body);
  if (settled.success) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return jsonError("Payment not found", 404);
    if (payment.payerId !== user.id) return jsonError("Not your payment", 403);
    if (payment.status !== "DEBT") return jsonError("Only debt payments can be settled", 400);

    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING",
        proofUrl: settled.data.proofUrl ?? null,
        note: settled.data.note ?? payment.note,
      },
    });

    // Notify admins
    const adminIds = await getCeremonyAdminUserIds(ceremonyId);
    const targets = adminIds.length > 0 ? adminIds : ceremony.adminUserId ? [ceremony.adminUserId] : [];
    for (const adminId of targets) {
      notifyUserAsync({
        userId: adminId,
        type: "payment_pending",
        title: "Debt settled — payment to review",
        body: `${user.name} settled their debt of ${payment.amount.toLocaleString("en-US")} Toman`,
        link: `/ceremonies/${ceremonyId}`,
      });
    }

    return jsonOk(updated);
  }

  // ── Admin edit amount / note ────────────────────────────────────────────
  const editParsed = adminEditSchema.safeParse(body);
  if (editParsed.success && Object.keys(editParsed.data).length > 0 && !("status" in (body as object))) {
    if (!(await canApprovePayments(ceremonyId, user.id))) {
      return jsonError("Only party admins can edit payments", 403);
    }
    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        ...(editParsed.data.amount !== undefined && { amount: editParsed.data.amount }),
        ...(editParsed.data.note !== undefined && { note: editParsed.data.note }),
        ...(editParsed.data.wishlistItemId !== undefined && { wishlistItemId: editParsed.data.wishlistItemId }),
      },
    });
    return jsonOk(updated);
  }

  // ── Admin approve/reject ────────────────────────────────────────────────
  if (!(await canApprovePayments(ceremonyId, user.id))) {
    return jsonError("Only party admins can approve", 403);
  }

  const parsed = adminSchema.safeParse(body);
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
    title: parsed.data.status === "APPROVED" ? "Payment approved 🎉" : "Payment rejected",
    body:
      parsed.data.status === "APPROVED"
        ? "Your contribution was approved. Thank you!"
        : "Your payment was rejected. Contact the treasurer.",
    link: `/ceremonies/${ceremonyId}`,
  });

  return jsonOk(payment);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id: ceremonyId, paymentId } = await params;
  if (!(await canApprovePayments(ceremonyId, user.id))) {
    return jsonError("Only party admins can delete payments", 403);
  }

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.ceremonyId !== ceremonyId) return jsonError("Payment not found", 404);

  await db.payment.delete({ where: { id: paymentId } });
  return jsonOk({ deleted: true });
}
