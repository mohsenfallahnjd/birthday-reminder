import { FriendSearch } from "@/components/friend-search";
import {
  AcceptFriendButton,
  AddFriendByEmail,
  CancelRequestButton,
  RemoveFriendButton,
} from "@/components/people-actions";
import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
import { ContactReminderManager } from "@/components/contact-reminder-manager";
import {
  AppList,
  AppListItem,
  AppSection,
  EmptyState,
  PageHeader,
  PersonRow,
} from "@/components/app-section";
import { requireUser } from "@/lib/auth";
import { getAcceptedFriends } from "@/lib/ceremony-roles";
import { db } from "@/lib/db";
import { formatJalaliBirthday } from "@/lib/jalali";
import { redirect } from "next/navigation";

export default async function PeoplePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

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
    (x) => x.friendship.status === "PENDING" && x.friendship.friendId === user.id,
  );
  const pendingOutgoing = list.filter(
    (x) => x.friendship.status === "PENDING" && x.friendship.userId === user.id,
  );

  const allFriends = await getAcceptedFriends(user.id);

  const existingReminders = await db.reminder.findMany({
    where: { ownerId: user.id, groupId: null },
    select: { targetUserId: true },
  });
  const reminderSet = new Set(existingReminders.map((r) => r.targetUserId));

  const contactReminders = await db.contactReminder.findMany({
    where: { ownerId: user.id },
    orderBy: [{ birthMonth: "asc" }, { birthDay: "asc" }],
  });

  return (
    <div className="page-wide space-y-8">
      <PageHeader
        title="Friends"
        description="Search for people, send a request, and wait for them to accept."
      />

      <AppSection title="Add friends" description="By email or search">
        <div className="space-y-5">
          <AddFriendByEmail />
          <div className="border-t border-border pt-5">
            <p className="text-sm font-semibold text-foreground">Find people</p>
            <p className="mt-0.5 mb-3 text-xs text-muted">Search by name or email</p>
            <FriendSearch />
          </div>
        </div>
      </AppSection>

      {pendingIncoming.length > 0 && (
        <AppSection
          title={`Requests for you (${pendingIncoming.length})`}
          description="Accept to connect"
        >
          <AppList>
            {pendingIncoming.map(({ friendship, other }) => (
              <AppListItem key={friendship.id}>
                <PersonRow
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
          description="Waiting for acceptance"
        >
          <AppList>
            {pendingOutgoing.map(({ friendship, other }) => (
              <AppListItem key={friendship.id}>
                <PersonRow
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

      <AppSection title={`Friends (${accepted.length})`} description="Your connected people">
        {accepted.length === 0 ? (
          <EmptyState>No friends yet. Search above to add someone.</EmptyState>
        ) : (
          <AppList>
            {accepted.map(({ friendship, other }) => (
              <AppListItem key={other.id}>
                <PersonRow
                  name={other.name}
                  avatarUrl={other.avatarUrl}
                  subtitle={
                    other.birthMonth && other.birthDay
                      ? formatJalaliBirthday(other.birthMonth, other.birthDay)
                      : undefined
                  }
                  accentColor="#db2777"
                  trailing={
                    <>
                      <ReminderButton targetUserId={other.id} initialSet={reminderSet.has(other.id)} />
                      <RemoveFriendButton friendshipId={friendship.id} />
                    </>
                  }
                />
              </AppListItem>
            ))}
          </AppList>
        )}
      </AppSection>

      <AppSection
        title="Birthday contacts"
        description="Track birthdays for people not on the app"
      >
        <ContactReminderManager initial={contactReminders} />
      </AppSection>

      {accepted.length > 0 && (
        <AppSection
          title="Party without a group"
          description="Create a standalone party for a friend"
          unboxed
        >
          <CeremonySetup
            members={accepted.map((x) => x.other)}
            friends={allFriends}
            currentUserId={user.id}
          />
        </AppSection>
      )}
    </div>
  );
}
