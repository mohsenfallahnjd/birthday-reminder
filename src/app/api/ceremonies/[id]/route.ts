import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({
    where: { id },
    include: {
      birthdayUser: { select: { id: true, name: true, birthMonth: true, birthDay: true } },
      admin: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
      wishlistItems: {
        include: {
          payments: {
            include: { payer: { select: { id: true, name: true } } },
          },
        },
      },
      payments: {
        include: { payer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ceremony) return jsonError("جشن یافت نشد", 404);
  return jsonOk(ceremony);
}

const patchSchema = z.object({
  adminUserId: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id } });
  if (!ceremony) return jsonError("جشن یافت نشد", 404);

  const isAdmin =
    ceremony.adminUserId === user.id || ceremony.birthdayUserId === user.id;
  if (!isAdmin) return jsonError("فقط ادمین جشن می‌تواند ویرایش کند", 403);

  const body = await parseJson<unknown>(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("اطلاعات نامعتبر");

  const updated = await db.ceremony.update({
    where: { id },
    data: parsed.data,
  });

  return jsonOk(updated);
}
