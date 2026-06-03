import { CeremonyDetail } from "@/components/ceremony-detail";
import { PartyColorBar } from "@/components/party-color-bar";
import { PartyTeam } from "@/components/party-team";
import { ShareInviteCode } from "@/components/share-invite-code";
import { requireUser } from "@/lib/auth";
import {
  canApprovePayments,
  canEditPartyWishlist,
  canManagePartyTeam,
  getAcceptedFriends,
  getCeremonyMembers,
} from "@/lib/ceremony-roles";
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
      payments: {
        include: { payer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ceremony) notFound();

  const members = await getCeremonyMembers(id);
  const friends = await getAcceptedFriends(user.id);
  const canManageTeam = await canManagePartyTeam(ceremony, user.id);
  const isTreasurer = await canApprovePayments(id, user.id);
  const isBirthdayPerson = ceremony.birthdayUser.id === user.id;
  const canEditWishlist = await canEditPartyWishlist(ceremony, user.id);

  const teamMembers = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    role: m.role,
  }));

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

  return (
    <div className="page">
      <PartyColorBar color={ceremony.color} className="mb-6 p-4">
        <header>
          <h1 className="page-title">{ceremony.title}</h1>
          <p className="page-desc mt-1">
            Birthday holder: <strong>{ceremony.birthdayUser.name}</strong>
            {isTreasurer && !isBirthdayPerson && (
              <span className="ml-2 text-xs text-muted">· You are an admin</span>
            )}
          </p>
        </header>
      </PartyColorBar>

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
        <PartyTeam
          ceremonyId={ceremony.id}
          members={teamMembers}
          friends={friends}
          birthdayUserId={ceremony.birthdayUser.id}
          birthdayName={ceremony.birthdayUser.name}
          currentUserId={user.id}
          canManage={canManageTeam}
        />
      </div>

      <CeremonyDetail
        ceremony={{ ...ceremony, wishlistItems }}
        currentUserId={user.id}
        isAdmin={isTreasurer}
        isBirthdayPerson={isBirthdayPerson}
        canEditWishlist={canEditWishlist}
      />
    </div>
  );
}
