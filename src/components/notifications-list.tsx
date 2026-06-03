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

  return (
    <div className="space-y-4">
      {items.some((n) => !n.read) && (
        <Button variant="outline" size="sm" onClick={markAll}>
          همه را خواندم
        </Button>
      )}
      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl p-4 ${n.read ? "bg-white/50" : "bg-white shadow-md border-l-4 border-party-pink"}`}
          >
            <p className="font-bold">{n.title}</p>
            <p className="text-sm text-party-ink/70 mt-1">{n.body}</p>
            {n.link && (
              <Link href={n.link} className="mt-2 inline-block text-sm">
                مشاهده
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
