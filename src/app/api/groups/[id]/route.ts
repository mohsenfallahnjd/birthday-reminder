import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const { id } = await params;
  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });
  if (!member) return jsonError("دسترسی ندارید", 403);

  const group = await db.group.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              birthMonth: true,
              birthDay: true,
              birthYear: true,
            },
          },
        },
      },
      ceremonies: {
        include: {
          birthdayUser: { select: { id: true, name: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) return jsonError("گروه یافت نشد", 404);
  return jsonOk(group);
}
