import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canEditPartyWishlist, canEditTreasurerCard } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({
    where: { id },
    include: {
      birthdayUser: { select: { id: true, name: true, birthMonth: true, birthDay: true } },
      admin: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
      wishlistItems: {
        include: {
          payments: {
            include: { payer: { select: { id: true, name: true } } },
          },
        },
      },
      payments: {
        include: { payer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ceremony) return jsonError("Party not found", 404);
  return jsonOk(ceremony);
}

const patchSchema = z.object({
  adminUserId: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id } });
  if (!ceremony) return jsonError("Party not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input");

  const { cardNumber, cardHolder, adminUserId, active } = parsed.data;
  if (cardNumber !== undefined || cardHolder !== undefined) {
    if (!(await canEditTreasurerCard(id, user.id))) {
      return jsonError("Only party admins can edit the card", 403);
    }
  }
  if (adminUserId !== undefined || active !== undefined) {
    if (!(await canEditPartyWishlist(ceremony, user.id))) {
      return jsonError("Only holder or admins can edit party settings", 403);
    }
  }

  const updated = await db.ceremony.update({
    where: { id },
    data: parsed.data,
  });

  return jsonOk(updated);
}
