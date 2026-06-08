import { AppSection } from "@/components/app-section";
import { CeremonyDetail } from "@/components/ceremony-detail";
import { PartyHeader } from "@/components/party-header";
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
      birthdayUser: { select: { id: true, name: true, avatarUrl: true } },
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

  const holderCandidates = await (async () => {
    const map = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
    if (ceremony.groupId) {
      const groupMembers = await db.groupMember.findMany({
        where: { groupId: ceremony.groupId },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
      for (const gm of groupMembers) map.set(gm.user.id, gm.user);
    }
    for (const m of members)
      map.set(m.user.id, {
        id: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl ?? null,
      });
    for (const f of friends)
      map.set(f.id, { id: f.id, name: f.name, avatarUrl: f.avatarUrl ?? null });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  })();

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
    <div className="page space-y-8">
      <PartyHeader
        ceremonyId={ceremony.id}
        title={ceremony.title}
        color={ceremony.color}
        birthdayUserId={ceremony.birthdayUserId}
        birthdayName={ceremony.birthdayUser.name}
        birthdayAvatarUrl={ceremony.birthdayUser.avatarUrl}
        groupId={ceremony.group?.id ?? null}
        groupName={ceremony.group?.name ?? null}
        holderCandidates={holderCandidates}
        canManage={canManageTeam}
        isAdmin={isTreasurer}
        isBirthdayPerson={isBirthdayPerson}
      />

      {ceremony.group && (
        <AppSection title="Group invite" description="Share so others can join" unboxed>
          <ShareInviteCode
            inviteCode={ceremony.group.inviteCode}
            groupName={ceremony.group.name}
            appOrigin={process.env.NEXT_PUBLIC_APP_URL}
          />
        </AppSection>
      )}

      <AppSection title="Party team" description="Holder, admins, and guests" unboxed>
        <PartyTeam
          ceremonyId={ceremony.id}
          members={teamMembers}
          friends={friends}
          birthdayUserId={ceremony.birthdayUser.id}
          birthdayName={ceremony.birthdayUser.name}
          currentUserId={user.id}
          canManage={canManageTeam}
        />
      </AppSection>

      <AppSection title="Gifts & payments" unboxed>
      <CeremonyDetail
        ceremony={{ ...ceremony, wishlistItems }}
        currentUserId={user.id}
        isAdmin={isTreasurer}
        isBirthdayPerson={isBirthdayPerson}
        canEditWishlist={canEditWishlist}
        members={teamMembers}
      />
      </AppSection>
    </div>
  );
}
