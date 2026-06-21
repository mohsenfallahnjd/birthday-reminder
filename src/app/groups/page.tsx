import { Suspense } from "react";
import { CreateGroupForm, JoinGroupForm } from "@/components/group-actions";
import { AppSection, EmptyState, PageHeader } from "@/components/app-section";
import { GroupCard } from "@/components/group-card";
import { PartyCard } from "@/components/party-card";
import { CeremonySetup } from "@/components/ceremony-setup";
import { Link } from "@/components/link";
import { TabBar } from "@/components/tab-bar";
import { requireUser } from "@/lib/auth";
import { getAcceptedFriends } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const TABS = [
  { id: "parties", label: "Parties" },
  { id: "groups", label: "Groups" },
];

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; tab?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { code: inviteCode, tab } = await searchParams;
  const activeTab = tab === "groups" ? "groups" : "parties";

  const [groups, ceremonies, friends] = await Promise.all([
    db.group.findMany({
      where: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.ceremony.findMany({
      where: {
        OR: [
          { birthdayUserId: user.id },
          { adminUserId: user.id },
          { members: { some: { userId: user.id } } },
          { group: { members: { some: { userId: user.id } } } },
        ],
      },
      select: {
        id: true,
        title: true,
        color: true,
        active: true,
        birthdayUserId: true,
        birthdayUser: { select: { name: true, avatarUrl: true } },
        group: { select: { name: true } },
        members: {
          where: { userId: user.id },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getAcceptedFriends(user.id),
  ]);

  const activeParties = ceremonies.filter((c) => c.active);
  const pastParties = ceremonies.filter((c) => !c.active);

  return (
    <div className="page-wide space-y-6">
      <PageHeader
        title="Groups & Parties"
        description="Groups are your circles — Parties are birthday events inside them"
      />

      <Suspense fallback={<div className="h-11 rounded-xl bg-muted-subtle animate-pulse" />}>
        <TabBar tabs={TABS} />
      </Suspense>

      {activeTab === "parties" ? (
        <div className="space-y-8">
          <AppSection
            title="Active parties"
            description="Open for contributions and gift coordination"
            unboxed
          >
            {activeParties.length === 0 ? (
              <EmptyState>
                No active parties yet.{" "}
                <Link href="/groups?tab=groups" className="font-medium text-foreground">
                  Create a group
                </Link>{" "}
                first, then start a party from inside it — or use the form below to start one with friends directly.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {activeParties.map((c) => {
                  const myMember = c.members[0];
                  const isYourBirthday = c.birthdayUserId === user.id;
                  const memberRole =
                    myMember?.role ??
                    (c.group && !myMember ? ("GROUP" as const) : null);
                  return (
                    <li key={c.id}>
                      <PartyCard
                        id={c.id}
                        title={c.title}
                        color={c.color}
                        holderName={c.birthdayUser.name}
                        holderAvatarUrl={c.birthdayUser.avatarUrl}
                        groupName={c.group?.name}
                        memberRole={memberRole}
                        isYourBirthday={isYourBirthday}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </AppSection>

          {friends.length > 0 && (
            <AppSection
              title="Start a party"
              description="Create a birthday party for a friend — no group needed"
              unboxed
            >
              <CeremonySetup
                members={friends}
                friends={friends}
                currentUserId={user.id}
              />
            </AppSection>
          )}

          {pastParties.length > 0 && (
            <AppSection title="Past parties" unboxed>
              <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
                {pastParties.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/ceremonies/${c.id}`}
                      className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-muted-subtle transition-colors"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full opacity-60"
                        style={{ backgroundColor: c.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{c.title}</span>
                        <span className="block truncate text-xs text-muted">{c.birthdayUser.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">View →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AppSection>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <AppSection title="Create a group" description="Give it a name, then invite people with a code">
            <CreateGroupForm />
          </AppSection>

          <AppSection title="Join a group" description="Enter the invite code a friend shared with you">
            <JoinGroupForm initialCode={inviteCode} />
          </AppSection>

          {groups.length > 0 ? (
            <AppSection
              title="Your groups"
              description={`${groups.length} group${groups.length === 1 ? "" : "s"}`}
              unboxed
            >
              <ul className="flex flex-col gap-3">
                {groups.map((g) => (
                  <li key={g.id}>
                    <GroupCard
                      id={g.id}
                      name={g.name}
                      memberCount={g._count.members}
                      inviteCode={g.inviteCode}
                      appOrigin={process.env.NEXT_PUBLIC_APP_URL}
                    />
                  </li>
                ))}
              </ul>
            </AppSection>
          ) : (
            <AppSection title="Your groups">
              <EmptyState>No groups yet — create one or join with a code above.</EmptyState>
            </AppSection>
          )}
        </div>
      )}
    </div>
  );
}
