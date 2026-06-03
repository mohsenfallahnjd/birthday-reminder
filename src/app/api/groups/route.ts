import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

const createSchema = z.object({ name: z.string().min(2) });

export async function GET() {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const groups = await db.group.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk(groups);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const body = await parseJson<unknown>(request);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("نام گروه نامعتبر");

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  return jsonOk(group);
}
