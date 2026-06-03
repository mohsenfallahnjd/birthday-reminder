import { CreateGroupForm, JoinGroupForm } from "@/components/group-actions";
import { ShareInviteCode } from "@/components/share-invite-code";
import { Link } from "@/components/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { code: inviteCode } = await searchParams;

  const groups = await db.group.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wide space-y-10">
      <header>
        <h1 className="page-title">Groups</h1>
        <p className="page-desc">Create or join with an invite code.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">New group</h2>
        <CreateGroupForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Join group</h2>
        <JoinGroupForm initialCode={inviteCode} />
      </section>

      {groups.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">Your groups</h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {groups.map((g) => (
              <li key={g.id} className="space-y-2 py-4 text-sm">
                <div>
                  <Link href={`/groups/${g.id}`} className="font-medium no-underline hover:underline">
                    {g.name}
                  </Link>
                  <span className="text-muted"> · {g._count.members} members</span>
                </div>
                <ShareInviteCode
                  inviteCode={g.inviteCode}
                  groupName={g.name}
                  appOrigin={process.env.NEXT_PUBLIC_APP_URL}
                  compact
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
