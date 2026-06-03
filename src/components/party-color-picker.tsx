"use client";

import { PARTY_COLORS, randomPartyColor } from "@/lib/ceremony-roles";

export function PartyColorPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
}) {
  const size = compact ? "h-7 w-7" : "h-9 w-9";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PARTY_COLORS.map((c) => {
          const selected = value === c;
          return (
            <button
              key={c}
              type="button"
              title="Pick color"
              className={`${size} rounded-full border-2 border-white shadow-sm transition-transform hover:scale-105 ${
                selected ? "ring-2 ring-offset-2 ring-offset-white" : "ring-1 ring-border"
              }`}
              style={{
                backgroundColor: c,
                ...(selected ? { ringColor: c } : {}),
              }}
              onClick={() => onChange(c)}
              aria-pressed={selected}
            />
          );
        })}
        <button
          type="button"
          className="rounded-full border border-dashed border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
          onClick={() => onChange(randomPartyColor())}
        >
          Random
        </button>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{
          background: `linear-gradient(90deg, ${value}, ${value}66, ${value})`,
        }}
        aria-hidden
      />
    </div>
  );
}
