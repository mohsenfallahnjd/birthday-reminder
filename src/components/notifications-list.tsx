"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
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
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No notifications.</p>;
  }

  return (
    <div className="space-y-4">
      {items.some((n) => !n.read) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={markAll}
          loading={loading}
          loadingText="Updating…"
        >
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
