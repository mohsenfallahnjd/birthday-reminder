import { z } from "zod";
import { db } from "@/lib/db";
import { notifyUserAsync } from "@/lib/notifications";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  guestName: z.string().min(1).max(80),
  amount: z.number().positive(),
  note: z.string().optional(),
  proofUrl: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const user = await db.user.findUnique({
    where: { profileToken: token },
    select: { id: true, name: true },
  });
  if (!user) return jsonError("Profile not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payment");

  const payment = await db.profilePayment.create({
    data: {
      userId: user.id,
      guestName: parsed.data.guestName,
      amount: parsed.data.amount,
      note: parsed.data.note ?? null,
      proofUrl: parsed.data.proofUrl ?? null,
    },
  });

  notifyUserAsync({
    userId: user.id,
    type: "payment_pending",
    title: "New gift contribution!",
    body: `${parsed.data.guestName} sent ${parsed.data.amount.toLocaleString("en-US")} Toman to your wishlist`,
    link: "/profile",
  });

  return jsonOk(payment);
}
