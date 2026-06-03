import { CeremonyDetail } from "@/components/ceremony-detail";
import { PartyGuests } from "@/components/party-guests";
import { ShareInviteCode } from "@/components/share-invite-code";
import { requireUser } from "@/lib/auth";
import {
  canManageCeremonyGuests,
  getAcceptedFriends,
} from "@/lib/ceremony-guests";
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
      group: { select: { id: true, name: true, inviteCode: true } },
      guests: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        include: { payer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ceremony) notFound();

  const friends = await getAcceptedFriends(user.id);
  const canManage = canManageCeremonyGuests(ceremony, user.id);
  const partyGuests = ceremony.guests.map((g) => g.user);

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

      {ceremony.group && (
        <div className="mb-8">
          <ShareInviteCode
            inviteCode={ceremony.group.inviteCode}
            groupName={ceremony.group.name}
            appOrigin={process.env.NEXT_PUBLIC_APP_URL}
          />
        </div>
      )}

      <div className="mb-8">
        <PartyGuests
          ceremonyId={ceremony.id}
          guests={partyGuests}
          friends={friends}
          birthdayUserId={ceremony.birthdayUser.id}
          currentUserId={user.id}
          canManage={canManage}
        />
      </div>

      <CeremonyDetail
        ceremony={{ ...ceremony, wishlistItems }}
        currentUserId={user.id}
        isAdmin={isAdmin}
        isBirthdayPerson={isBirthdayPerson}
      />
    </div>
  );
}
