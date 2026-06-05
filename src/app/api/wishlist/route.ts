import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canEditPartyWishlist } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1),
  link: z.string().optional(),
  ogImage: z.string().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  cost: z.number().positive(),
  allowCheapIn: z.boolean().default(false),
  ceremonyId: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid wishlist item");

  let ownerId = user.id;
  if (parsed.data.ceremonyId) {
    const ceremony = await db.ceremony.findUnique({
      where: { id: parsed.data.ceremonyId },
    });
    if (!ceremony) return jsonError("Party not found", 404);
    if (!(await canEditPartyWishlist(ceremony, user.id))) {
      return jsonError("Only holder or admins can add party items", 403);
    }
    ownerId = ceremony.birthdayUserId;
  }

  const item = await db.wishlistItem.create({
    data: {
      userId: ownerId,
      title: parsed.data.title,
      link: parsed.data.link || null,
      ogImage: parsed.data.ogImage ?? null,
      ogDescription: parsed.data.ogDescription ?? null,
      cost: parsed.data.cost,
      allowCheapIn: parsed.data.allowCheapIn,
      ceremonyId: parsed.data.ceremonyId,
    },
  });

  return jsonOk(item);
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const url = new URL(request.url);
  const ceremonyId = url.searchParams.get("ceremonyId");
  const userId = url.searchParams.get("userId") ?? user.id;

  const items = await db.wishlistItem.findMany({
    where: {
      userId,
      ...(ceremonyId ? { ceremonyId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk(items);
}
