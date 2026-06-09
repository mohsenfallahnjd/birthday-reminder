"use client";

import { useRouter } from "@/lib/navigation";
import type { DateSystem } from "@/lib/jalali";

export function DateSystemToggle({ current }: { current: DateSystem }) {
  const router = useRouter();

  function select(system: DateSystem) {
    document.cookie = `date-system=${system}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => select("jalali")}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          current === "jalali"
            ? "border-foreground bg-foreground text-white"
            : "border-border bg-white text-muted hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        Jalali
      </button>
      <button
        type="button"
        onClick={() => select("gregorian")}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          current === "gregorian"
            ? "border-foreground bg-foreground text-white"
            : "border-border bg-white text-muted hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        Gregorian
      </button>
    </div>
  );
}
