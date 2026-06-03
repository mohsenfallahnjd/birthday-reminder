import { CreateGroupForm, JoinGroupForm } from "@/components/group-actions";
import { Link } from "@/components/link";
import { Icon } from "@/components/icon";
import { Card, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Icon name="users" />
        گروه‌ها
      </h1>

      <Card>
        <CardTitle className="mb-4">گروه جدید</CardTitle>
        <CreateGroupForm />
      </Card>

      <Card>
        <CardTitle className="mb-4">پیوستن با کد دعوت</CardTitle>
        <JoinGroupForm />
      </Card>

      <div className="space-y-3">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/groups/${g.id}`}
            className="block rounded-3xl border border-white/70 bg-white/80 p-5 shadow-md hover:shadow-lg transition-shadow"
          >
            <p className="font-bold">{g.name}</p>
            <p className="text-sm text-party-ink/50 mt-1">{g._count.members} عضو</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
