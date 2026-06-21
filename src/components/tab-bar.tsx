"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string };

export function TabBar({ tabs, paramKey = "tab" }: { tabs: Tab[]; paramKey?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get(paramKey) ?? tabs[0]?.id;

  function go(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (id === tabs[0]?.id) p.delete(paramKey);
    else p.set(paramKey, id);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-1 rounded-xl border border-border bg-muted-subtle p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => go(t.id)}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === t.id
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
