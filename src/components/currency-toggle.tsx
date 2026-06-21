"use client";

import { useRouter } from "@/lib/navigation";
import { useCurrency } from "@/lib/currency-context";
import { TomanIcon } from "@/components/toman-icon";

export function CurrencyToggle() {
  const router = useRouter();
  const current = useCurrency();

  function select(c: "toman" | "usd") {
    document.cookie = `currency=${c}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => select("toman")}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          current === "toman"
            ? "border-foreground bg-foreground text-white"
            : "border-border bg-white text-muted hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        <TomanIcon size={14} />
        Toman
      </button>
      <button
        type="button"
        onClick={() => select("usd")}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          current === "usd"
            ? "border-foreground bg-foreground text-white"
            : "border-border bg-white text-muted hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        $ USD
      </button>
    </div>
  );
}
