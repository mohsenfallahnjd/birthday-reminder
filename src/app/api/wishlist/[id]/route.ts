import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canEditPartyWishlist } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  link: z.string().optional().nullable(),
  ogImage: z.string().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  cost: z.number().positive().optional(),
  allowCheapIn: z.boolean().optional(),
  ceremonyId: z.string().optional().nullable(),
});

async function canEditItem(
  item: { id: string; userId: string; ceremonyId: string | null },
  userId: string,
) {
  if (item.userId === userId) return true;
  if (!item.ceremonyId) return false;
  const ceremony = await db.ceremony.findUnique({ where: { id: item.ceremonyId } });
  if (!ceremony) return false;
  return canEditPartyWishlist(ceremony, userId);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const item = await db.wishlistItem.findUnique({ where: { id } });
  if (!item || !(await canEditItem(item, user.id))) {
    return jsonError("Item not found", 404);
  }

  const body = await parseJson<unknown>(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid wishlist item");

  const data = parsed.data;
  const updated = await db.wishlistItem.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.link !== undefined ? { link: data.link || null } : {}),
      ...(data.ogImage !== undefined ? { ogImage: data.ogImage } : {}),
      ...(data.ogDescription !== undefined ? { ogDescription: data.ogDescription } : {}),
      ...(data.cost !== undefined ? { cost: data.cost } : {}),
      ...(data.allowCheapIn !== undefined ? { allowCheapIn: data.allowCheapIn } : {}),
      ...(data.ceremonyId !== undefined ? { ceremonyId: data.ceremonyId } : {}),
    },
  });

  return jsonOk(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const item = await db.wishlistItem.findUnique({ where: { id } });
  if (!item || !(await canEditItem(item, user.id))) {
    return jsonError("Item not found", 404);
  }

  const payments = await db.payment.count({ where: { wishlistItemId: id } });
  if (payments > 0) {
    return jsonError("Cannot delete: payments are linked to this item", 409);
  }

  await db.wishlistItem.delete({ where: { id } });
  return jsonOk({ ok: true });
}
