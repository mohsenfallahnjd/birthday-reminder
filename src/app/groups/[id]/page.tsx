import { CeremonySetup } from "@/components/ceremony-setup";
import { DeleteGroupButton } from "@/components/group-actions";
import { ReminderButton } from "@/components/reminder-button";
import { ShareInviteCode } from "@/components/share-invite-code";
import {
  AppList,
  AppListItem,
  AppSection,
  PageHeader,
  PersonRow,
} from "@/components/app-section";
import { PartyCard } from "@/components/party-card";
import { requireUser } from "@/lib/auth";
import { getAcceptedFriends } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { formatJalaliBirthday } from "@/lib/jalali";
import { redirect, notFound } from "next/navigation";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });
  if (!member) notFound();

  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      ownerId: true,
    },
  });
  if (!group) notFound();

  const groupDetails = await db.group.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              birthMonth: true,
              birthDay: true,
            },
          },
        },
      },
      ceremonies: {
        select: {
          id: true,
          title: true,
          color: true,
          birthdayUserId: true,
          birthdayUser: { select: { name: true, avatarUrl: true } },
          members: {
            where: { userId: user.id },
            select: { role: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!groupDetails) notFound();

  const isOwner = group.ownerId === user.id;
  const members = groupDetails.members.map((m) => m.user);
  const friends = await getAcceptedFriends(user.id);
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <div className="page-wide space-y-8">
      <PageHeader
        title={group.name}
        description="Share the party code so friends can join this group."
        badge={
          isOwner ? (
            <span className="shrink-0 rounded-full bg-muted-subtle px-2.5 py-1 text-xs font-medium text-muted">
              You own this group
            </span>
          ) : undefined
        }
      />

      <AppSection title="Invite friends" description="Share code or link to join" unboxed>
        <ShareInviteCode
          inviteCode={group.inviteCode}
          groupName={group.name}
          appOrigin={appOrigin}
        />
      </AppSection>

      <AppSection title="Members" description={`${members.length} people in this group`}>
        <AppList>
          {members.map((m) => (
            <AppListItem key={m.id}>
              <PersonRow
                name={m.name}
                avatarUrl={m.avatarUrl}
                subtitle={
                  m.birthMonth && m.birthDay
                    ? formatJalaliBirthday(m.birthMonth, m.birthDay)
                    : undefined
                }
                accentColor="#4f46e5"
                trailing={
                  m.id !== user.id && m.birthMonth ? (
                    <ReminderButton targetUserId={m.id} groupId={group.id} />
                  ) : undefined
                }
              />
            </AppListItem>
          ))}
        </AppList>
      </AppSection>

      <AppSection
        title="New party"
        description="Set color, birthday holder, admins, and friends"
        unboxed
      >
        <CeremonySetup
          groupId={group.id}
          members={members}
          friends={friends}
          currentUserId={user.id}
          includeGroupMembers
        />
      </AppSection>

      {groupDetails.ceremonies.length > 0 && (
        <AppSection title="Parties" description="Open a party for gifts and payments" unboxed>
          <ul className="flex flex-col gap-3">
            {groupDetails.ceremonies.map((c) => (
              <li key={c.id}>
                <PartyCard
                  id={c.id}
                  title={c.title}
                  color={c.color}
                  holderName={c.birthdayUser.name}
                  holderAvatarUrl={c.birthdayUser.avatarUrl}
                  groupName={group.name}
                  memberRole={c.members[0]?.role ?? null}
                  isYourBirthday={c.birthdayUserId === user.id}
                />
              </li>
            ))}
          </ul>
        </AppSection>
      )}

      {isOwner && (
        <AppSection title="Danger zone" description="Permanent actions" unboxed>
          <DeleteGroupButton
            groupId={group.id}
            groupName={group.name}
            partyCount={groupDetails.ceremonies.length}
          />
        </AppSection>
      )}
    </div>
  );
}
