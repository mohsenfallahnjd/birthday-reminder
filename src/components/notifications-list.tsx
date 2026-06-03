"use client";

import { useRouter } from "next/navigation";
import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationsList({ items }: { items: Notification[] }) {
  const router = useRouter();

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No notifications.</p>;
  }

  return (
    <div className="space-y-4">
      {items.some((n) => !n.read) && (
        <Button variant="outline" size="sm" onClick={markAll}>
          Mark all read
        </Button>
      )}
      <ul className="divide-y divide-border border-t border-border">
        {items.map((n) => (
          <li key={n.id} className={`py-4 text-sm ${n.read ? "opacity-60" : ""}`}>
            <p className="font-medium text-foreground">{n.title}</p>
            <p className="mt-0.5 text-muted">{n.body}</p>
            {n.link && (
              <Link href={n.link} className="mt-2 inline-block text-sm no-underline hover:underline">
                Open
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
