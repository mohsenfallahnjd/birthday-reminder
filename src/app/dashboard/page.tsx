import { Link } from "@/components/link";
import { PartyColorBar } from "@/components/party-color-bar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysUntilJalaliBirthday, formatJalaliBirthday } from "@/lib/jalali";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userId: user.id }, { friendId: user.id }],
    },
    include: {
      user: { select: { id: true, name: true, birthMonth: true, birthDay: true } },
      friend: { select: { id: true, name: true, birthMonth: true, birthDay: true } },
    },
  });

  const friends = friendships.map((f) => (f.userId === user.id ? f.friend : f.user));

  const groupMembers = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, birthMonth: true, birthDay: true },
              },
            },
          },
        },
      },
    },
  });

  const upcoming: { name: string; id: string; days: number; date: string }[] = [];

  for (const friend of friends) {
    if (!friend.birthMonth || !friend.birthDay) continue;
    upcoming.push({
      id: friend.id,
      name: friend.name,
      days: daysUntilJalaliBirthday(friend.birthMonth, friend.birthDay),
      date: formatJalaliBirthday(friend.birthMonth, friend.birthDay),
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
        days: daysUntilJalaliBirthday(u.birthMonth, u.birthDay),
        date: formatJalaliBirthday(u.birthMonth, u.birthDay),
      });
    }
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
      birthdayUser: { select: { name: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const wishlistCount = await db.wishlistItem.count({ where: { userId: user.id } });

  return (
    <div className="page-wide space-y-10">
      <header>
        <h1 className="page-title">Hi, {user.name}</h1>
        <p className="page-desc">Upcoming birthdays and active parties</p>
      </header>

      {!user.birthMonth && (
        <p className="text-sm text-muted border border-border rounded-lg px-4 py-3 bg-white">
          <Link href="/profile">Add your Jalali birthday</Link> so friends get reminders.
        </p>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-foreground">Wishlist</h2>
          <Link href="/wishlist" className="text-sm text-muted hover:text-foreground no-underline">
            Manage →
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted">
          {wishlistCount === 0
            ? "No items yet."
            : `${wishlistCount} item${wishlistCount === 1 ? "" : "s"}.`}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-foreground">Upcoming birthdays</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No upcoming birthdays.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {upcoming.slice(0, 8).map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">{u.name}</span>
                  <span className="ml-2 text-muted">{u.date}</span>
                </div>
                <span className="tabular-nums text-muted">
                  {u.days === 0 ? "Today" : `${u.days}d`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-foreground">Active parties</h2>
        {ceremonies.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {ceremonies.map((c) => (
              <li key={c.id} className="py-3 text-sm">
                <PartyColorBar color={c.color} className="rounded-lg px-3 py-2">
                  <Link href={`/ceremonies/${c.id}`} className="no-underline hover:underline font-medium">
                    {c.title}
                  </Link>
                  <span className="text-muted"> · {c.birthdayUser.name}</span>
                </PartyColorBar>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
