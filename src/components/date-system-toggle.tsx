"use client";

import { useRouter } from "@/lib/navigation";
import type { DateSystem } from "@/lib/jalali";

export function DateSystemToggle({
  current,
  compact = false,
}: {
  current: DateSystem;
  compact?: boolean;
}) {
  const router = useRouter();

  function toggle() {
    const next = current === "jalali" ? "gregorian" : "jalali";
    document.cookie = `date-system=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  function select(system: DateSystem) {
    document.cookie = `date-system=${system}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={`Switch to ${current === "jalali" ? "Gregorian" : "Jalali"} dates`}
        className="flex items-center gap-1 rounded-full border border-border bg-muted-subtle px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        {current === "jalali" ? "شمسی" : "AD"}
      </button>
    );
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
        Jalali (شمسی)
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
