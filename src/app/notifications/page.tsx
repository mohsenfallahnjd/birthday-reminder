import { AppSection, PageHeader } from "@/components/app-section";
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

  // Auto-mark all as read on open
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return (
    <div className="page space-y-8">
      <PageHeader title="Notifications" description="Recent activity and invites" />
      <AppSection title="Inbox" unboxed>
        <NotificationsList
          items={notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </AppSection>
    </div>
  );
}
