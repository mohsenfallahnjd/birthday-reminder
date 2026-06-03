import { AddFriendForm, AcceptFriendButton } from "@/components/people-actions";
import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
import { Icon } from "@/components/icon";
import { Card, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Icon name="heart" />
        دوستان و تولدها
      </h1>

      <Card>
        <CardTitle className="mb-4">افزودن با ایمیل</CardTitle>
        <AddFriendForm />
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardTitle>درخواست‌های در انتظار</CardTitle>
          <ul className="mt-4 space-y-2">
            {pending.map(({ friendship, other }) => (
              <li key={friendship.id} className="flex items-center justify-between">
                <span>{other.name}</span>
                <AcceptFriendButton friendshipId={friendship.id} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>دوستان شما</CardTitle>
        <ul className="mt-4 space-y-3">
          {accepted.map(({ other }) => (
            <li key={other.id} className="flex items-center justify-between rounded-xl bg-party-cream/40 px-4 py-2">
              <div>
                <p className="font-medium">{other.name}</p>
                {other.birthMonth && other.birthDay && (
                  <p className="text-xs text-party-ink/50">
                    {formatJalaliBirthday(other.birthMonth, other.birthDay)}
                  </p>
                )}
              </div>
              <ReminderButton targetUserId={other.id} />
            </li>
          ))}
        </ul>
      </Card>

      {accepted.length > 0 && (
        <Card>
          <CardTitle>جشن تولد (بدون گروه)</CardTitle>
          <CeremonySetup members={accepted.map((x) => x.other)} />
        </Card>
      )}
    </div>
  );
}
