import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getCeremonyAdminUserIds } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive(),
  wishlistItemId: z.string().optional(),
  proofUrl: z.string().optional(),
  note: z.string().optional(),
  isDebt: z.boolean().optional(), // pledge now, pay later
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id: ceremonyId } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony) return jsonError("Party not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payment");

  const isDebt = parsed.data.isDebt === true;
  const status = isDebt ? "DEBT" : "PENDING";

  const payment = await db.payment.create({
    data: {
      ceremonyId,
      payerId: user.id,
      amount: parsed.data.amount,
      wishlistItemId: parsed.data.wishlistItemId,
      proofUrl: isDebt ? null : (parsed.data.proofUrl ?? null),
      note: parsed.data.note,
      status,
    },
  });

  // Only notify admins for real (non-debt) payments
  if (!isDebt) {
    const adminIds = await getCeremonyAdminUserIds(ceremonyId);
    const notifyTargets =
      adminIds.length > 0
        ? adminIds
        : ceremony.adminUserId
          ? [ceremony.adminUserId]
          : [];
    for (const adminId of notifyTargets) {
      notifyUserAsync({
        userId: adminId,
        type: "payment_pending",
        title: "New payment to review",
        body: `${user.name} paid ${parsed.data.amount.toLocaleString("en-US")} Toman`,
        link: `/ceremonies/${ceremonyId}`,
      });
    }
  } else {
    // Notify admin of a new debt pledge
    const adminIds = await getCeremonyAdminUserIds(ceremonyId);
    const notifyTargets =
      adminIds.length > 0
        ? adminIds
        : ceremony.adminUserId
          ? [ceremony.adminUserId]
          : [];
    for (const adminId of notifyTargets) {
      notifyUserAsync({
        userId: adminId,
        type: "payment_debt",
        title: "New debt pledge",
        body: `${user.name} pledged ${parsed.data.amount.toLocaleString("en-US")} Toman (will pay later)`,
        link: `/ceremonies/${ceremonyId}`,
      });
    }
  }

  return jsonOk(payment);
}
