import { AppSection, EmptyState, PageHeader } from "@/components/app-section";
import { Link } from "@/components/link";
import { PartyCard } from "@/components/party-card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function PartiesPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const ceremonies = await db.ceremony.findMany({
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
  });

  const active = ceremonies.filter((c) => c.active);
  const ended = ceremonies.filter((c) => !c.active);

  function renderCard(c: (typeof ceremonies)[number]) {
    const myMember = c.members[0];
    const isYourBirthday = c.birthdayUserId === user!.id;
    const memberRole =
      myMember?.role ?? (c.group && !myMember ? ("GROUP" as const) : null);
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
          ended={!c.active}
        />
      </li>
    );
  }

  return (
    <div className="page space-y-8">
      <PageHeader
        title="Parties"
        description="Active and past parties you're part of"
      />

      <AppSection title="Active" description="Ongoing parties" unboxed>
        {active.length === 0 ? (
          <EmptyState>No active parties right now.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">{active.map(renderCard)}</ul>
        )}
      </AppSection>

      {ended.length > 0 && (
        <AppSection
          title="Past parties"
          description="Ended parties — tap to view history"
          unboxed
        >
          <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
            {ended.map((c) => (
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
                    <span className="block truncate text-sm font-medium text-foreground">
                      {c.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {c.birthdayUser.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        </AppSection>
      )}
    </div>
  );
}
