import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  link: z.string().optional().nullable(),
  cost: z.number().positive().optional(),
  allowCheapIn: z.boolean().optional(),
  ceremonyId: z.string().optional().nullable(),
});

async function getOwnedItem(id: string, userId: string) {
  const item = await db.wishlistItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) return null;
  return item;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const item = await getOwnedItem(id, user.id);
  if (!item) return jsonError("Item not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid wishlist item");

  const data = parsed.data;
  const updated = await db.wishlistItem.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.link !== undefined ? { link: data.link || null } : {}),
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
  const item = await getOwnedItem(id, user.id);
  if (!item) return jsonError("Item not found", 404);

  const payments = await db.payment.count({ where: { wishlistItemId: id } });
  if (payments > 0) {
    return jsonError("Cannot delete: payments are linked to this item", 409);
  }

  await db.wishlistItem.delete({ where: { id } });
  return jsonOk({ ok: true });
}
