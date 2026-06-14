import { Link } from "@/components/link";
import {
  AppSection,
  EmptyState,
  InfoBanner,
  PageHeader,
} from "@/components/app-section";
import { PartyCard } from "@/components/party-card";
import { UpcomingBirthdayList } from "@/components/upcoming-birthday-list";
import { PartySuggestions } from "@/components/party-suggestions";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysUntilJalaliBirthday, formatBirthdayBySystem, formatTodayDate } from "@/lib/jalali";
import { getDateSystem } from "@/lib/date-system";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const dateSystem = await getDateSystem();
  const todayFormatted = formatTodayDate(dateSystem);

  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userId: user.id }, { friendId: user.id }],
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true, birthMonth: true, birthDay: true },
      },
      friend: {
        select: { id: true, name: true, avatarUrl: true, birthMonth: true, birthDay: true },
      },
    },
  });

  const friends = friendships.map((f) =>
    f.userId === user.id ? f.friend : f.user,
  );

  const groupMembers = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
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
        },
      },
    },
  });

  const upcoming: { name: string; id: string; days: number; date: string; avatarUrl: string | null }[] = [];

  for (const friend of friends) {
    if (!friend.birthMonth || !friend.birthDay) continue;
    upcoming.push({
      id: friend.id,
      name: friend.name,
      avatarUrl: friend.avatarUrl ?? null,
      days: daysUntilJalaliBirthday(friend.birthMonth, friend.birthDay),
      date: formatBirthdayBySystem(friend.birthMonth, friend.birthDay, null, dateSystem),
    });
  }

  for (const gm of groupMembers) {
    for (const m of gm.group.members) {
      const u = m.user;
      if (u.id === user.id || !u.birthMonth || !u.birthDay) continue;
      if (upcoming.some((x) => x.id === u.id)) continue;
      upcoming.push({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl ?? null,
        days: daysUntilJalaliBirthday(u.birthMonth, u.birthDay),
        date: formatBirthdayBySystem(u.birthMonth, u.birthDay, null, dateSystem),
      });
    }
  }

  upcoming.sort((a, b) => a.days - b.days);

  // Add unregistered contact reminders to the upcoming list
  const contactBirthdays = await db.contactReminder.findMany({
    where: { ownerId: user.id },
  }).catch(() => []);

  for (const cr of contactBirthdays) {
    upcoming.push({
      id: `contact:${cr.id}`,
      name: cr.name,
      avatarUrl: null,
      days: daysUntilJalaliBirthday(cr.birthMonth, cr.birthDay),
      date: formatBirthdayBySystem(cr.birthMonth, cr.birthDay, null, dateSystem),
    });
  }

  upcoming.sort((a, b) => a.days - b.days);

  const ceremonies = await db.ceremony.findMany({
    where: {
      OR: [
        { birthdayUserId: user.id },
        { adminUserId: user.id },
        { members: { some: { userId: user.id } } },
        { group: { members: { some: { userId: user.id } } } },
      ],
      active: true,
    },
    select: {
      id: true,
      title: true,
      color: true,
      birthdayUserId: true,
      birthdayUser: { select: { name: true, avatarUrl: true } },
      group: { select: { name: true } },
      members: {
        where: { userId: user.id },
        select: { role: true },
        take: 1,
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const activeBirthdayUserIds = new Set(ceremonies.map((c) => c.birthdayUserId));

  const suggestions = upcoming
    .filter((u) => u.days <= 14 && !activeBirthdayUserIds.has(u.id))
    .slice(0, 3);

  const wishlistCount = await db.wishlistItem.count({
    where: { userId: user.id },
  });

  return (
    <div className="page-wide space-y-8">
      <PageHeader
        title={`Hi, ${user.name}`}
        description="Upcoming birthdays and active parties"
        badge={
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
        }
      >
        <p className="text-xs text-muted tabular-nums">{todayFormatted}</p>
      </PageHeader>

      {!user.birthMonth && (
        <InfoBanner>
          <Link href="/profile" className="font-medium text-foreground">
            Add your Jalali birthday
          </Link>{" "}
          <span className="text-muted">so friends get reminders.</span>
        </InfoBanner>
      )}

      <AppSection
        title="Active parties"
        description="Tap a party to open gifts and payments"
        action={{ href: "/parties", label: "History →" }}
        unboxed
      >
        {ceremonies.length === 0 ? (
          <EmptyState>
            No parties yet. Create one from a{" "}
            <Link href="/groups" className="font-medium text-foreground">
              group
            </Link>{" "}
            or invite friends on{" "}
            <Link href="/people" className="font-medium text-foreground">
              People
            </Link>
            .
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {ceremonies.map((c) => {
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

      <AppSection
        title="Wishlist"
        description="Gift ideas friends can contribute toward"
        action={{ href: "/wishlist", label: "Manage →" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#db2777]/15 text-[#db2777]">
            <Icon name="gift" size={22} className="text-current" />
          </div>
          <p className="text-sm text-foreground">
            {wishlistCount === 0 ? (
              <span className="text-muted">
                No items yet — add your first gift idea.
              </span>
            ) : (
              <>
                <span className="font-semibold tabular-nums">
                  {wishlistCount}
                </span>
                <span className="text-muted">
                  {" "}
                  item{wishlistCount === 1 ? "" : "s"} on your list
                </span>
              </>
            )}
          </p>
        </div>
      </AppSection>

      {suggestions.length > 0 && (
        <PartySuggestions suggestions={suggestions} />
      )}

      <AppSection title="Upcoming birthdays" description="From friends and groups" unboxed>
        {upcoming.length === 0 ? (
          <EmptyState>No upcoming birthdays in the next year.</EmptyState>
        ) : (
          <UpcomingBirthdayList
            entries={upcoming.slice(0, 8)}
            activePartyUserIds={activeBirthdayUserIds}
          />
        )}
      </AppSection>
    </div>
  );
}
