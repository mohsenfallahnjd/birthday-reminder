import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPushConfigured } from "@/lib/push";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  endpoint: z.string().min(8),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);
  if (!isPushConfigured()) return jsonError("Push not configured on server", 503);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid subscription");

  const ua = request.headers.get("user-agent") ?? undefined;

  const sub = await db.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: ua,
    },
    update: {
      userId: user.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: ua,
    },
  });

  return jsonOk({ id: sub.id });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<{ endpoint?: string }>(request);
  if (body?.endpoint) {
    await db.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: body.endpoint },
    });
  } else {
    await db.pushSubscription.deleteMany({ where: { userId: user.id } });
  }

  return jsonOk({ ok: true });
}
