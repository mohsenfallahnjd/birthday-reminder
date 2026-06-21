import { FriendSearch } from "@/components/friend-search";
import {
  AcceptFriendButton,
  AddFriendByEmail,
  CancelRequestButton,
  RemoveFriendButton,
} from "@/components/people-actions";
import { ReminderButton } from "@/components/reminder-button";
import { ContactReminderManager } from "@/components/contact-reminder-manager";
import {
  AppSection,
  PageHeader,
} from "@/components/app-section";
import { UserAvatar } from "@/components/user-avatar";
import { Link } from "@/components/link";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBirthdayBySystem } from "@/lib/jalali";
import { getDateSystem } from "@/lib/date-system";
import { redirect } from "next/navigation";

export default async function PeoplePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const dateSystem = await getDateSystem();

  const friendships = await db.friendship.findMany({
    where: { OR: [{ userId: user.id }, { friendId: user.id }] },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          birthMonth: true,
          birthDay: true,
        },
      },
      friend: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          birthMonth: true,
          birthDay: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const list = friendships.map((f) => {
    const other = f.userId === user.id ? f.friend : f.user;
    return { friendship: f, other };
  });

  const accepted = list.filter((x) => x.friendship.status === "ACCEPTED");
  const pendingIncoming = list.filter(
    (x) =>
      x.friendship.status === "PENDING" && x.friendship.friendId === user.id,
  );
  const pendingOutgoing = list.filter(
    (x) => x.friendship.status === "PENDING" && x.friendship.userId === user.id,
  );

  const existingReminders = await db.reminder.findMany({
    where: { ownerId: user.id, groupId: null },
    select: { targetUserId: true },
  });
  const reminderSet = new Set(existingReminders.map((r) => r.targetUserId));

  const contactReminders = await db.contactReminder
    .findMany({
      where: { ownerId: user.id },
      orderBy: [{ birthMonth: "asc" }, { birthDay: "asc" }],
    })
    .catch(() => []);

  return (
    <div className="page-wide space-y-6">
      <PageHeader
        title="People"
        description="Your friends on the app and off-app contacts"
      />

      {/* ── INCOMING REQUESTS ── */}
      {pendingIncoming.length > 0 && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-emerald-200/70 bg-emerald-50 px-5 py-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {pendingIncoming.length}
            </span>
            <h2 className="text-sm font-semibold text-emerald-800">Friend requests</h2>
          </div>
          <ul className="divide-y divide-emerald-100">
            {pendingIncoming.map(({ friendship, other }) => (
              <li key={friendship.id} className="flex items-center gap-3 px-5 py-3.5">
                <Link href={`/person/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3 no-underline">
                  <UserAvatar name={other.name} avatarUrl={other.avatarUrl} size="md" accentColor="#059669" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground text-sm">{other.name}</p>
                    <p className="truncate text-xs text-muted">{other.email}</p>
                  </div>
                </Link>
                <AcceptFriendButton friendshipId={friendship.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── SENT REQUESTS ── */}
      {pendingOutgoing.length > 0 && (
        <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Sent requests</h2>
            <span className="rounded-full bg-muted-subtle px-2 py-0.5 text-[10px] font-medium text-muted">
              {pendingOutgoing.length}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {pendingOutgoing.map(({ friendship, other }) => (
              <li key={friendship.id} className="flex items-center gap-3 px-5 py-3.5">
                <Link href={`/person/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3 no-underline">
                  <UserAvatar name={other.name} avatarUrl={other.avatarUrl} size="md" accentColor="#a1a1aa" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground text-sm">{other.name}</p>
                    <p className="truncate text-xs text-muted">Waiting for response…</p>
                  </div>
                </Link>
                <CancelRequestButton friendshipId={friendship.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── FRIENDS ── */}
      <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Friends
            {accepted.length > 0 && (
              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                {accepted.length}
              </span>
            )}
          </h2>
        </div>

        {accepted.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted-subtle">
              <Icon name="users" size={20} className="text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground">No friends yet</p>
            <p className="mt-1 text-xs text-muted">Search below to find and add friends.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {accepted.map(({ friendship, other }) => (
              <li key={other.id} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted-subtle/40">
                <Link href={`/person/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3 no-underline">
                  <UserAvatar name={other.name} avatarUrl={other.avatarUrl} size="md" accentColor="#db2777" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground text-sm">{other.name}</p>
                    {other.birthMonth && other.birthDay ? (
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Icon name="cake" size={11} className="shrink-0 opacity-60" />
                        {formatBirthdayBySystem(other.birthMonth, other.birthDay, null, dateSystem)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted/50">No birthday set</p>
                    )}
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  <ReminderButton targetUserId={other.id} initialSet={reminderSet.has(other.id)} />
                  <RemoveFriendButton friendshipId={friendship.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── FIND PEOPLE ── */}
      <AppSection
        title="Find & add friends"
        description="Search by name or send an invite by email"
      >
        <div className="space-y-5">
          <AddFriendByEmail />
          <div className="border-t border-border pt-5">
            <FriendSearch />
          </div>
        </div>
      </AppSection>

      {/* ── OFF-APP CONTACTS ── */}
      <AppSection
        title="Off-app contacts"
        description="Track birthdays for people who aren't on the app yet"
      >
        <ContactReminderManager initial={contactReminders} />
      </AppSection>
    </div>
  );
}
