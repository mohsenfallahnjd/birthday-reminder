import { Link } from "@/components/link";
import { Icon } from "@/components/icon";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  daysUntilJalaliBirthday,
  formatJalaliBirthday,
} from "@/lib/jalali";
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
        { group: { members: { some: { userId: user.id } } } },
      ],
      active: true,
    },
    include: { birthdayUser: { select: { name: true } } },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const notifications = await db.notification.findMany({
    where: { userId: user.id, read: false },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-party-ink">
          سلام {user.name}! <span className="inline-block animate-bounce">🎉</span>
        </h1>
        <p className="text-party-ink/60 mt-1">تولدهای نزدیک و جشن‌های فعال</p>
      </div>

      {!user.birthMonth && (
        <Card className="border-party-yellow/50 bg-party-yellow/10">
          <p className="text-sm">
            تاریخ تولد شمسی خود را ثبت کنید تا دوستان یادآور بگیرند.{" "}
            <Link href="/profile">تکمیل پروفایل</Link>
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>
          <Icon name="cake" />
          تولدهای نزدیک
        </CardTitle>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-party-ink/50">هنوز تولدی نزدیک نیست. دوستان یا گروه اضافه کنید.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.slice(0, 8).map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-2xl bg-party-cream/50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-party-ink/50">{u.date}</p>
                </div>
                <span className="rounded-full bg-party-pink/20 px-3 py-1 text-sm font-bold text-party-fuchsia">
                  {u.days === 0 ? "امروز!" : `${u.days} روز`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>
          <Icon name="gift" />
          جشن‌های فعال
        </CardTitle>
        {ceremonies.length === 0 ? (
          <p className="mt-4 text-sm text-party-ink/50">از صفحه گروه یا دوستان جشن بسازید.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {ceremonies.map((c) => (
              <li key={c.id}>
                <Link href={`/ceremonies/${c.id}`} className="block rounded-xl px-3 py-2 hover:bg-party-cream">
                  {c.title} — {c.birthdayUser.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {notifications.length > 0 && (
        <Card>
          <CardTitle>
            <Icon name="bell" />
            اعلان‌های جدید
          </CardTitle>
          <ul className="mt-4 space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="text-sm">
                <strong>{n.title}</strong> — {n.body}
              </li>
            ))}
          </ul>
          <Link href="/notifications" className="mt-4 inline-block text-sm">
            همه اعلان‌ها
          </Link>
        </Card>
      )}
    </div>
  );
}
