import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
import { Link } from "@/components/link";
import { Icon } from "@/components/icon";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatJalaliBirthday } from "@/lib/jalali";
import { redirect, notFound } from "next/navigation";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });
  if (!member) notFound();

  const group = await db.group.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, birthMonth: true, birthDay: true } } } },
      ceremonies: {
        include: { birthdayUser: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!group) notFound();

  const members = group.members.map((m) => m.user);
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/groups?join=${group.inviteCode}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">{group.name}</h1>

      <Card>
        <CardTitle className="mb-2">
          <Icon name="users" />
          دعوت دوستان
        </CardTitle>
        <p className="text-sm text-party-ink/60">کد دعوت را بفرستید:</p>
        <code className="mt-2 block rounded-xl bg-party-cream px-4 py-3 text-left font-mono text-party-fuchsia" dir="ltr">
          {group.inviteCode}
        </code>
        {process.env.NEXT_PUBLIC_APP_URL && (
          <p className="mt-2 text-xs break-all text-party-ink/40">{inviteUrl}</p>
        )}
      </Card>

      <Card>
        <CardTitle>اعضا</CardTitle>
        <ul className="mt-4 space-y-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl bg-party-cream/40 px-4 py-2">
              <div>
                <span className="font-medium">{m.name}</span>
                {m.birthMonth && m.birthDay && (
                  <p className="text-xs text-party-ink/50">
                    {formatJalaliBirthday(m.birthMonth, m.birthDay)}
                  </p>
                )}
              </div>
              {m.id !== user.id && m.birthMonth && (
                <ReminderButton targetUserId={m.id} groupId={group.id} />
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>
          <Icon name="party" />
          جشن تولد جدید
        </CardTitle>
        <CeremonySetup groupId={group.id} members={members} />
      </Card>

      {group.ceremonies.length > 0 && (
        <Card>
          <CardTitle>جشن‌های گذشته</CardTitle>
          <ul className="mt-3 space-y-2">
            {group.ceremonies.map((c) => (
              <li key={c.id}>
                <Link href={`/ceremonies/${c.id}`}>{c.title} — {c.birthdayUser.name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
