import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  canEditTreasurerCard,
  canManagePartyTeam,
  changeBirthdayHolder,
} from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { jsonError, jsonOk, parseJson } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

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

  if (!ceremony) return jsonError("Party not found", 404);
  return jsonOk(ceremony);
}

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/i)
    .optional(),
  birthdayUserId: z.string().optional(),
  adminUserId: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  active: z.boolean().optional(),
  hideContributors: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({ where: { id } });
  if (!ceremony) return jsonError("Party not found", 404);

  const body = await parseJson<unknown>(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input");

  const { title, color, birthdayUserId, cardNumber, cardHolder, adminUserId, active, hideContributors } =
    parsed.data;

  const settingsChange =
    title !== undefined ||
    color !== undefined ||
    birthdayUserId !== undefined ||
    adminUserId !== undefined ||
    active !== undefined ||
    hideContributors !== undefined;

  if (cardNumber !== undefined || cardHolder !== undefined) {
    if (!(await canEditTreasurerCard(id, user.id))) {
      return jsonError("Only party admins can edit the card", 403);
    }
  }
  if (settingsChange) {
    if (!(await canManagePartyTeam(ceremony, user.id))) {
      return jsonError("Only holder or admins can edit this party", 403);
    }
  }

  if (birthdayUserId !== undefined && birthdayUserId !== ceremony.birthdayUserId) {
    const result = await changeBirthdayHolder(id, birthdayUserId, user.id);
    if (!result.ok) return jsonError(result.error, 400);
  }

  const data: {
    title?: string;
    color?: string;
    adminUserId?: string;
    cardNumber?: string;
    cardHolder?: string;
    active?: boolean;
    hideContributors?: boolean;
  } = {};

  if (title !== undefined) data.title = title;
  if (color !== undefined) data.color = color;
  if (adminUserId !== undefined) data.adminUserId = adminUserId;
  if (cardNumber !== undefined) data.cardNumber = cardNumber;
  if (cardHolder !== undefined) data.cardHolder = cardHolder;
  if (active !== undefined) data.active = active;
  if (hideContributors !== undefined) data.hideContributors = hideContributors;

  const updated =
    Object.keys(data).length > 0
      ? await db.ceremony.update({ where: { id }, data })
      : await db.ceremony.findUnique({ where: { id } });

  return jsonOk(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({
    where: { id },
    select: { id: true, birthdayUserId: true, groupId: true },
  });
  if (!ceremony) return jsonError("Party not found", 404);
  if (!(await canManagePartyTeam(ceremony, user.id))) {
    return jsonError("Only holder or admins can delete this party", 403);
  }

  await db.ceremony.delete({ where: { id } });
  return jsonOk({ ok: true, groupId: ceremony.groupId });
}
