import { CeremonySetup } from "@/components/ceremony-setup";
import { ReminderButton } from "@/components/reminder-button";
import { Link } from "@/components/link";
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
      members: {
        include: {
          user: { select: { id: true, name: true, birthMonth: true, birthDay: true } },
        },
      },
      ceremonies: {
        include: { birthdayUser: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!group) notFound();

  const members = group.members.map((m) => m.user);

  return (
    <div className="page-wide space-y-10">
      <header>
        <h1 className="page-title">{group.name}</h1>
        <p className="page-desc">
          Invite code:{" "}
          <code className="font-mono text-xs text-foreground">{group.inviteCode}</code>
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium text-foreground">Members</h2>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium">{m.name}</span>
                {m.birthMonth && m.birthDay && (
                  <span className="ml-2 text-muted">
                    {formatJalaliBirthday(m.birthMonth, m.birthDay)}
                  </span>
                )}
              </div>
              {m.id !== user.id && m.birthMonth && (
                <ReminderButton targetUserId={m.id} groupId={group.id} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 border-t border-border pt-10">
        <h2 className="text-sm font-medium text-foreground">New party</h2>
        <CeremonySetup groupId={group.id} members={members} />
      </section>

      {group.ceremonies.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">Parties</h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {group.ceremonies.map((c) => (
              <li key={c.id} className="py-3 text-sm">
                <Link href={`/ceremonies/${c.id}`} className="no-underline hover:underline">
                  {c.title}
                </Link>
                <span className="text-muted"> · {c.birthdayUser.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
