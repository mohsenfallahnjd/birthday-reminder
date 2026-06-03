import { z } from "zod";
import { requireUser } from "@/lib/auth";
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
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const { id: ceremonyId, paymentId } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony || ceremony.adminUserId !== user.id) {
    return jsonError("فقط ادمین مالی می‌تواند تأیید کند", 403);
  }

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("وضعیت نامعتبر");

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
    title: parsed.data.status === "APPROVED" ? "پرداخت تأیید شد" : "پرداخت رد شد",
    body:
      parsed.data.status === "APPROVED"
        ? "پرداخت شما توسط ادمین جشن تأیید شد. ممنون از مشارکتتان!"
        : "پرداخت شما تأیید نشد. با ادمین تماس بگیرید.",
    link: `/ceremonies/${ceremonyId}`,
  });

  return jsonOk(payment);
}
