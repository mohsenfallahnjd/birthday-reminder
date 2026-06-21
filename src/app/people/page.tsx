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
  AppList,
  AppListItem,
  AppSection,
  EmptyState,
  InfoBanner,
  PageHeader,
  PersonRow,
} from "@/components/app-section";
import { Link } from "@/components/link";
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
    <div className="page-wide space-y-8">
      <PageHeader
        title="People"
        description="Your friends on the app and off-app contacts"
      />

      {/* How it connects to parties */}
      {accepted.length === 0 && (
        <InfoBanner>
          Add friends here → then go to{" "}
          <Link href="/groups" className="font-medium text-foreground">
            Groups
          </Link>{" "}
          or{" "}
          <Link href="/groups" className="font-medium text-foreground">
            Parties
          </Link>{" "}
          to start a birthday party together.
        </InfoBanner>
      )}

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

      {/* ── PENDING ── */}
      {pendingIncoming.length > 0 && (
        <AppSection
          title={`Friend requests (${pendingIncoming.length})`}
          description="People who want to connect with you"
        >
          <AppList>
            {pendingIncoming.map(({ friendship, other }) => (
              <AppListItem key={friendship.id}>
                <PersonRow
                  id={other.id}
                  name={other.name}
                  avatarUrl={other.avatarUrl}
                  subtitle={other.email}
                  accentColor="#059669"
                  trailing={<AcceptFriendButton friendshipId={friendship.id} />}
                />
              </AppListItem>
            ))}
          </AppList>
        </AppSection>
      )}

      {pendingOutgoing.length > 0 && (
        <AppSection
          title={`Sent requests (${pendingOutgoing.length})`}
          description="Waiting for them to accept"
        >
          <AppList>
            {pendingOutgoing.map(({ friendship, other }) => (
              <AppListItem key={friendship.id}>
                <PersonRow
                  id={other.id}
                  name={other.name}
                  avatarUrl={other.avatarUrl}
                  subtitle={other.email}
                  accentColor="#a1a1aa"
                  trailing={
                    <>
                      <span className="text-xs text-muted">Pending</span>
                      <CancelRequestButton friendshipId={friendship.id} />
                    </>
                  }
                />
              </AppListItem>
            ))}
          </AppList>
        </AppSection>
      )}

      {/* ── FRIENDS ── */}
      <AppSection
        title={`Friends${accepted.length > 0 ? ` (${accepted.length})` : ""}`}
        description="You see each other's birthdays and wishlists"
      >
        {accepted.length === 0 ? (
          <EmptyState>No friends yet — use the search above or .</EmptyState>
        ) : (
          <AppList>
            {accepted.map(({ friendship, other }) => (
              <AppListItem key={other.id}>
                <PersonRow
                  name={other.name}
                  id={other.id}
                  avatarUrl={other.avatarUrl}
                  subtitle={
                    other.birthMonth && other.birthDay
                      ? formatBirthdayBySystem(
                          other.birthMonth,
                          other.birthDay,
                          null,
                          dateSystem,
                        )
                      : undefined
                  }
                  accentColor="#db2777"
                  trailing={
                    <>
                      <ReminderButton
                        targetUserId={other.id}
                        initialSet={reminderSet.has(other.id)}
                      />
                      <RemoveFriendButton friendshipId={friendship.id} />
                    </>
                  }
                />
              </AppListItem>
            ))}
          </AppList>
        )}
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
