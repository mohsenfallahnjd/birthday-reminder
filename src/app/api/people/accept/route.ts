import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({ friendshipId: z.string() });

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("درخواست نامعتبر");

  const friendship = await db.friendship.findUnique({
    where: { id: parsed.data.friendshipId },
  });
  if (!friendship || friendship.friendId !== user.id) {
    return jsonError("درخواست یافت نشد", 404);
  }

  const updated = await db.friendship.update({
    where: { id: friendship.id },
    data: { status: "ACCEPTED" },
  });

  return jsonOk(updated);
}
