import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(100),
  birthMonth: z.number().int().min(1).max(12),
  birthDay: z.number().int().min(1).max(31),
  daysBefore: z.number().int().min(0).max(30).default(1),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const contacts = await db.contactReminder.findMany({
    where: { ownerId: user.id },
    orderBy: [{ birthMonth: "asc" }, { birthDay: "asc" }],
  }).catch(() => []);

  return jsonOk(contacts);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const body = await parseJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid contact data");

  const contact = await db.contactReminder.create({
    data: {
      ownerId: user.id,
      name: parsed.data.name,
      birthMonth: parsed.data.birthMonth,
      birthDay: parsed.data.birthDay,
      daysBefore: parsed.data.daysBefore,
    },
  });

  return jsonOk(contact);
}
