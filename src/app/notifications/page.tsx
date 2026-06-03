import { NotificationsList } from "@/components/notifications-list";
import { Icon } from "@/components/icon";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardTitle className="mb-6">
          <Icon name="bell" />
          اعلان‌ها
        </CardTitle>
        <NotificationsList
          items={notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </Card>
    </div>
  );
}
