import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk(notifications);
}

const markSchema = z.object({
  ids: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");

  if (parsed.data.markAll) {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  } else if (parsed.data.ids?.length) {
    await db.notification.updateMany({
      where: { userId: user.id, id: { in: parsed.data.ids } },
      data: { read: true },
    });
  }

  return jsonOk({ ok: true });
}
