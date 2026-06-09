import { z } from "zod";
import { db } from "@/lib/db";
import { getCeremonyAdminUserIds } from "@/lib/ceremony-roles";
import { notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  guestName: z.string().min(1).max(80),
  amount: z.number().positive(),
  wishlistItemId: z.string().optional(),
  proofUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { shareToken } });
  if (!ceremony || !ceremony.active) return jsonError("Party not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payment");

  const payment = await db.payment.create({
    data: {
      ceremonyId: ceremony.id,
      payerId: null,
      guestName: parsed.data.guestName,
      amount: parsed.data.amount,
      wishlistItemId: parsed.data.wishlistItemId ?? null,
      proofUrl: parsed.data.proofUrl ?? null,
      note: parsed.data.note ?? null,
      status: "PENDING",
    },
  });

  const adminIds = await getCeremonyAdminUserIds(ceremony.id);
  const targets = adminIds.length > 0 ? adminIds : ceremony.adminUserId ? [ceremony.adminUserId] : [];
  for (const adminId of targets) {
    notifyUserAsync({
      userId: adminId,
      type: "payment_pending",
      title: "New payment to review",
      body: `${parsed.data.guestName} paid ${parsed.data.amount.toLocaleString("en-US")} Toman`,
      link: `/ceremonies/${ceremony.id}`,
    });
  }

  return jsonOk(payment);
}
