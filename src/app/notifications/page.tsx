import { NotificationsList } from "@/components/notifications-list";
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
    <div className="page">
      <h1 className="page-title">Notifications</h1>
      <p className="page-desc mb-8">Recent activity.</p>
      <NotificationsList
        items={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
