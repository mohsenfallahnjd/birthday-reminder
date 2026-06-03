import { AddFriendForm, AcceptFriendButton } from "@/components/people-actions";
import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
import { requireUser } from "@/lib/auth";
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
  });

  const list = friendships.map((f) => {
    const other = f.userId === user.id ? f.friend : f.user;
    return { friendship: f, other };
  });

  const accepted = list.filter((x) => x.friendship.status === "ACCEPTED");
  const pending = list.filter(
    (x) => x.friendship.status === "PENDING" && x.friendship.friendId === user.id,
  );

  return (
    <div className="page-wide space-y-10">
      <header>
        <h1 className="page-title">Friends</h1>
        <p className="page-desc">Invite by email and set birthday reminders.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Add friend</h2>
        <AddFriendForm />
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">Pending</h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {pending.map(({ friendship, other }) => (
              <li key={friendship.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span>{other.name}</span>
                <AcceptFriendButton friendshipId={friendship.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-foreground">Friends</h2>
        {accepted.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No friends yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {accepted.map(({ other }) => (
              <li key={other.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-medium">{other.name}</span>
                  {other.birthMonth && other.birthDay && (
                    <span className="ml-2 text-muted">
                      {formatJalaliBirthday(other.birthMonth, other.birthDay)}
                    </span>
                  )}
                </div>
                <ReminderButton targetUserId={other.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {accepted.length > 0 && (
        <section className="space-y-4 border-t border-border pt-10">
          <h2 className="text-sm font-medium text-foreground">Party without a group</h2>
          <CeremonySetup members={accepted.map((x) => x.other)} />
        </section>
      )}
    </div>
  );
}
