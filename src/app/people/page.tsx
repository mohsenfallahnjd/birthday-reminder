import { FriendSearch } from "@/components/friend-search";
import {
  AcceptFriendButton,
  AddFriendByEmail,
  CancelRequestButton,
  RemoveFriendButton,
} from "@/components/people-actions";
import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
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
      user: { select: { id: true, name: true, email: true, birthMonth: true, birthDay: true } },
      friend: { select: { id: true, name: true, email: true, birthMonth: true, birthDay: true } },
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

  return (
    <div className="page-wide space-y-10">
      <header>
        <h1 className="page-title">Friends</h1>
        <p className="page-desc">
          Search for people, send a request, and wait for them to accept.
        </p>
      </header>

      <section className="space-y-6">
        <AddFriendByEmail />
        <div>
          <h2 className="text-sm font-medium text-foreground mb-4">Find people</h2>
          <FriendSearch />
        </div>
      </section>

      {pendingIncoming.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">
            Requests for you ({pendingIncoming.length})
          </h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {pendingIncoming.map(({ friendship, other }) => (
              <li
                key={friendship.id}
                className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{other.name}</span>
                  <span className="ml-2 text-muted">{other.email}</span>
                </div>
                <AcceptFriendButton friendshipId={friendship.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendingOutgoing.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">
            Sent requests ({pendingOutgoing.length})
          </h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {pendingOutgoing.map(({ friendship, other }) => (
              <li
                key={friendship.id}
                className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{other.name}</span>
                  <span className="ml-2 text-muted">{other.email}</span>
                </div>
                <span className="text-xs text-muted sm:mr-2">Waiting for acceptance</span>
                <CancelRequestButton friendshipId={friendship.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-foreground">
          Friends ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No friends yet. Search above to add someone.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {accepted.map(({ friendship, other }) => (
              <li
                key={other.id}
                className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{other.name}</span>
                  {other.birthMonth && other.birthDay && (
                    <span className="ml-2 text-muted">
                      {formatJalaliBirthday(other.birthMonth, other.birthDay)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ReminderButton targetUserId={other.id} />
                  <RemoveFriendButton friendshipId={friendship.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {accepted.length > 0 && (
        <section className="space-y-4 border-t border-border pt-10">
          <div>
            <h2 className="text-sm font-medium text-foreground">Party without a group</h2>
            <p className="mt-0.5 text-xs text-muted">
              Create a standalone party for a friend — pick color, holder, and who helps run it.
            </p>
          </div>
          <CeremonySetup
            members={accepted.map((x) => x.other)}
            friends={allFriends}
            currentUserId={user.id}
          />
        </section>
      )}
    </div>
  );
}
