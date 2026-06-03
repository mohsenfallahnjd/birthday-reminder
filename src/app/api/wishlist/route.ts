import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1),
  link: z.string().optional(),
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

  const item = await db.wishlistItem.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      link: parsed.data.link || null,
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
