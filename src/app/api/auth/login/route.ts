import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid email or password");

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) return jsonError("User not found", 401);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return jsonError("Wrong password", 401);

  await createSession({ id: user.id, email: user.email, name: user.name });
  return jsonOk({ id: user.id });
}
