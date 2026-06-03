import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("اطلاعات نامعتبر است");

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return jsonError("این ایمیل قبلاً ثبت شده", 409);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await createSession({ id: user.id, email: user.email, name: user.name });
  return jsonOk({ id: user.id });
}
