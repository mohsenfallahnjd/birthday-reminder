import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
import { ShareInviteCode } from "@/components/share-invite-code";
import { Link } from "@/components/link";
import { requireUser } from "@/lib/auth";
import { PartyCard } from "@/components/party-card";
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
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, birthMonth: true, birthDay: true } },
        },
      },
      ceremonies: {
        select: {
          id: true,
          title: true,
          color: true,
          birthdayUserId: true,
          birthdayUser: { select: { name: true } },
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
  if (!group) notFound();

  const members = group.members.map((m) => m.user);
  const friends = await getAcceptedFriends(user.id);
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <div className="page-wide space-y-10">
      <header>
        <h1 className="page-title">{group.name}</h1>
        <p className="page-desc">Share the party code so friends can join this group.</p>
      </header>

      <ShareInviteCode
        inviteCode={group.inviteCode}
        groupName={group.name}
        appOrigin={appOrigin}
      />

      <section>
        <h2 className="text-sm font-medium text-foreground">Members</h2>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium">{m.name}</span>
                {m.birthMonth && m.birthDay && (
                  <span className="ml-2 text-muted">
                    {formatJalaliBirthday(m.birthMonth, m.birthDay)}
                  </span>
                )}
              </div>
              {m.id !== user.id && m.birthMonth && (
                <ReminderButton targetUserId={m.id} groupId={group.id} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 border-t border-border pt-10">
        <h2 className="text-sm font-medium text-foreground">New party</h2>
        <CeremonySetup
          groupId={group.id}
          members={members}
          friends={friends}
          currentUserId={user.id}
          includeGroupMembers
        />
      </section>

      {group.ceremonies.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">Parties</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {group.ceremonies.map((c) => (
              <li key={c.id}>
                <PartyCard
                  id={c.id}
                  title={c.title}
                  color={c.color}
                  holderName={c.birthdayUser.name}
                  groupName={group.name}
                  memberRole={c.members[0]?.role ?? null}
                  isYourBirthday={c.birthdayUserId === user.id}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
