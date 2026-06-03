import { CeremonyDetail } from "@/components/ceremony-detail";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";

export default async function CeremonyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const ceremony = await db.ceremony.findUnique({
    where: { id },
    include: {
      birthdayUser: { select: { id: true, name: true } },
      payments: {
        include: { payer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ceremony) notFound();

  const wishlistItems = await db.wishlistItem.findMany({
    where: {
      userId: ceremony.birthdayUserId,
      OR: [{ ceremonyId: id }, { ceremonyId: null }],
    },
    include: {
      payments: {
        include: { payer: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = ceremony.adminUserId === user.id;
  const isBirthdayPerson = ceremony.birthdayUser.id === user.id;

  return (
    <div className="page">
      <header className="mb-8">
        <h1 className="page-title">{ceremony.title}</h1>
        <p className="page-desc">Birthday: {ceremony.birthdayUser.name}</p>
      </header>

      <CeremonyDetail
        ceremony={{ ...ceremony, wishlistItems }}
        currentUserId={user.id}
        isAdmin={isAdmin}
        isBirthdayPerson={isBirthdayPerson}
      />
    </div>
  );
}
