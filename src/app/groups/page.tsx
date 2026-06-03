import { CreateGroupForm, JoinGroupForm } from "@/components/group-actions";
import { Link } from "@/components/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function GroupsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const groups = await db.group.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: { _count: { select: { members: true } } },
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
        <JoinGroupForm />
      </section>

      {groups.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground">Your groups</h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {groups.map((g) => (
              <li key={g.id} className="py-3 text-sm">
                <Link href={`/groups/${g.id}`} className="font-medium no-underline hover:underline">
                  {g.name}
                </Link>
                <span className="text-muted"> · {g._count.members} members</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
