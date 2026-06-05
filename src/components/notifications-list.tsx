"use client";

import { AppList, AppListItem, EmptyState } from "@/components/app-section";
import { Link } from "@/components/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationsList({ items }: { items: Notification[] }) {
  if (items.length === 0) {
    return <EmptyState>No notifications yet.</EmptyState>;
  }

  return (
    <div className="space-y-4">
      <AppList>
        {items.map((n) => (
          <AppListItem key={n.id} className={n.read ? "opacity-70" : undefined}>
            <p className="font-medium text-foreground">{n.title}</p>
            <p className="mt-0.5 text-muted">{n.body}</p>
            {n.link && (
              <Link href={n.link} className="mt-2 inline-block text-sm font-medium no-underline hover:underline">
                Open →
              </Link>
            )}
          </AppListItem>
        ))}
      </AppList>
    </div>
  );
}
