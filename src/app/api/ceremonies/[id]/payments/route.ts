import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive(),
  wishlistItemId: z.string().optional(),
  proofUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const { id: ceremonyId } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony) return jsonError("جشن یافت نشد", 404);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("اطلاعات پرداخت نامعتبر");

  const payment = await db.payment.create({
    data: {
      ceremonyId,
      payerId: user.id,
      amount: parsed.data.amount,
      wishlistItemId: parsed.data.wishlistItemId,
      proofUrl: parsed.data.proofUrl,
      note: parsed.data.note,
    },
  });

  if (ceremony.adminUserId) {
    await notifyUser({
      userId: ceremony.adminUserId,
      type: "payment_pending",
      title: "پرداخت جدید در انتظار تأیید",
      body: `${user.name} مبلغ ${parsed.data.amount.toLocaleString("fa-IR")} تومان پرداخت کرد`,
      link: `/ceremonies/${ceremonyId}`,
    });
  }

  return jsonOk(payment);
}
