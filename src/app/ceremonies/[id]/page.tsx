import { CeremonyDetail } from "@/components/ceremony-detail";
import { Icon } from "@/components/icon";
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
      wishlistItems: {
        include: {
          payments: {
            include: { payer: { select: { name: true } } },
          },
        },
      },
      payments: {
        include: { payer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ceremony) notFound();

  const isAdmin = ceremony.adminUserId === user.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <Icon name="party" />
        {ceremony.title}
      </h1>
      <p className="text-party-ink/60 mb-8">متولد: {ceremony.birthdayUser.name}</p>

      <CeremonyDetail
        ceremony={ceremony}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
