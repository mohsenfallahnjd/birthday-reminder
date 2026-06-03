import { CreateGroupForm, JoinGroupForm } from "@/components/group-actions";
import { AppSection, EmptyState, PageHeader } from "@/components/app-section";
import { GroupCard } from "@/components/group-card";
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
    <div className="page-wide space-y-8">
      <PageHeader title="Groups" description="Create or join with an invite code." />

      <AppSection title="New group" description="Start a shared space for parties">
        <CreateGroupForm />
      </AppSection>

      <AppSection title="Join group" description="Paste a code from a friend">
        <JoinGroupForm initialCode={inviteCode} />
      </AppSection>

      {groups.length > 0 ? (
        <AppSection title="Your groups" description={`${groups.length} group${groups.length === 1 ? "" : "s"}`} unboxed>
          <ul className="flex flex-col gap-3">
            {groups.map((g) => (
              <li key={g.id}>
                <GroupCard
                  id={g.id}
                  name={g.name}
                  memberCount={g._count.members}
                  inviteCode={g.inviteCode}
                  appOrigin={process.env.NEXT_PUBLIC_APP_URL}
                />
              </li>
            ))}
          </ul>
        </AppSection>
      ) : (
        <AppSection title="Your groups">
          <EmptyState>No groups yet — create one or join with a code above.</EmptyState>
        </AppSection>
      )}
    </div>
  );
}
