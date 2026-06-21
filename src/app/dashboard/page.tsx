import { Link } from "@/components/link";
import { AppSection, EmptyState, InfoBanner } from "@/components/app-section";
import { PartyCard } from "@/components/party-card";
import { UpcomingBirthdayList } from "@/components/upcoming-birthday-list";
import { PartySuggestions } from "@/components/party-suggestions";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  daysUntilJalaliBirthday,
  formatBirthdayBySystem,
  formatTodayDate,
} from "@/lib/jalali";
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
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          birthMonth: true,
          birthDay: true,
        },
      },
      friend: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          birthMonth: true,
          birthDay: true,
        },
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

  const upcoming: {
    name: string;
    id: string;
    days: number;
    date: string;
    avatarUrl: string | null;
  }[] = [];

  for (const friend of friends) {
    if (!friend.birthMonth || !friend.birthDay) continue;
    upcoming.push({
      id: friend.id,
      name: friend.name,
      avatarUrl: friend.avatarUrl ?? null,
      days: daysUntilJalaliBirthday(friend.birthMonth, friend.birthDay),
      date: formatBirthdayBySystem(
        friend.birthMonth,
        friend.birthDay,
        null,
        dateSystem,
      ),
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
        date: formatBirthdayBySystem(
          u.birthMonth,
          u.birthDay,
          null,
          dateSystem,
        ),
      });
    }
  }

  upcoming.sort((a, b) => a.days - b.days);

  // Add unregistered contact reminders to the upcoming list
  const contactBirthdays = await db.contactReminder
    .findMany({
      where: { ownerId: user.id },
    })
    .catch(() => []);

  for (const cr of contactBirthdays) {
    upcoming.push({
      id: `contact:${cr.id}`,
      name: cr.name,
      avatarUrl: null,
      days: daysUntilJalaliBirthday(cr.birthMonth, cr.birthDay),
      date: formatBirthdayBySystem(
        cr.birthMonth,
        cr.birthDay,
        null,
        dateSystem,
      ),
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

  const activeBirthdayUserIds = new Set(
    ceremonies.map((c) => c.birthdayUserId),
  );

  const suggestions = upcoming
    .filter((u) => u.days <= 14 && !activeBirthdayUserIds.has(u.id))
    .slice(0, 3);

  const wishlistCount = await db.wishlistItem.count({
    where: { userId: user.id },
  });

  const isNewUser = friends.length === 0 && ceremonies.length === 0;

  const myBirthdayDays =
    user.birthMonth && user.birthDay
      ? daysUntilJalaliBirthday(user.birthMonth, user.birthDay)
      : null;

  return (
    <div className="page-wide space-y-6">
      {/* ── Greeting hero ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-border/60 shadow-sm px-5 py-5">
        {/* subtle blob */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-accent/8 blur-3xl"
          aria-hidden
        />
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Today is {todayFormatted}</p>
            <h1 className="text-lg font-bold text-foreground leading-snug">
              Hi, {user.name.split(" ")[0]} 👋
            </h1>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/people"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted-subtle px-3 py-1.5 text-xs font-medium text-foreground no-underline hover:bg-accent/10 transition-colors"
          >
            <Icon name="users" size={12} className="text-muted" />
            {friends.length} friend{friends.length !== 1 ? "s" : ""}
          </Link>
          <Link
            href="/groups"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted-subtle px-3 py-1.5 text-xs font-medium text-foreground no-underline hover:bg-accent/10 transition-colors"
          >
            <Icon name="party" size={12} className="text-muted" />
            {ceremonies.length} active part
            {ceremonies.length !== 1 ? "ies" : "y"}
          </Link>
          <Link
            href="/wishlist"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted-subtle px-3 py-1.5 text-xs font-medium text-foreground no-underline hover:bg-accent/10 transition-colors"
          >
            <Icon name="gift" size={12} className="text-muted" />
            {wishlistCount === 0
              ? "Add wishlist"
              : `${wishlistCount} wishlist item${wishlistCount !== 1 ? "s" : ""}`}
          </Link>
          {myBirthdayDays !== null && myBirthdayDays <= 30 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700">
              <Icon name="cake" size={12} className="text-current" />
              {myBirthdayDays === 0
                ? "Your birthday today! 🎉"
                : `Your birthday in ${myBirthdayDays} day${myBirthdayDays !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>

      {/* ── Banners ─────────────────────────────────────────── */}
      {!user.birthMonth && (
        <InfoBanner>
          <Link href="/profile" className="font-medium text-foreground">
            Add your birthday
          </Link>{" "}
          <span className="text-muted">so friends get reminded.</span>
        </InfoBanner>
      )}

      {isNewUser && (
        <InfoBanner>
          <p className="font-medium text-foreground mb-2">
            Get started in 3 steps
          </p>
          <ol className="space-y-1.5 text-sm list-none">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                1
              </span>
              <span className="text-muted">
                <Link href="/people" className="font-medium text-foreground">
                  Add friends
                </Link>{" "}
                or{" "}
                <Link href="/groups" className="font-medium text-foreground">
                  create a group
                </Link>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                2
              </span>
              <span className="text-muted">
                Start a{" "}
                <Link href="/groups" className="font-medium text-foreground">
                  party
                </Link>{" "}
                — pick who's birthday it is, set a goal
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                3
              </span>
              <span className="text-muted">
                Friends contribute; treasurer approves payments
              </span>
            </li>
          </ol>
        </InfoBanner>
      )}

      {/* ── Active parties ──────────────────────────────────── */}
      <AppSection
        title="Active parties"
        description="Tap a party to open gifts and payments"
        action={{ href: "/parties", label: "History →" }}
        unboxed
      >
        {ceremonies.length === 0 ? (
          <EmptyState>
            No active parties.{" "}
            <Link href="/groups" className="font-medium text-foreground">
              Start one
            </Link>{" "}
            from the Groups page.
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

      {/* ── Party suggestions ────────────────────────────────── */}
      {suggestions.length > 0 && <PartySuggestions suggestions={suggestions} />}

      {/* ── Upcoming birthdays ──────────────────────────────── */}
      <AppSection title="Upcoming birthdays" unboxed>
        {upcoming.length === 0 ? (
          <EmptyState>
            No birthdays yet.{" "}
            <Link href="/people" className="font-medium text-foreground">
              Add friends
            </Link>{" "}
            or{" "}
            <Link href="/profile" className="font-medium text-foreground">
              save contacts
            </Link>
            .
          </EmptyState>
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
