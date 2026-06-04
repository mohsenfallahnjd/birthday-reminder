import { parsePresetAvatar, personInitials, nameToAccentColor } from "@/lib/avatars";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "h-8 w-8", text: "text-[10px]", emoji: "text-base" },
  md: { box: "h-10 w-10", text: "text-xs", emoji: "text-lg" },
  lg: { box: "h-14 w-14", text: "text-sm", emoji: "text-2xl" },
  xl: { box: "h-20 w-20", text: "text-base", emoji: "text-3xl" },
} as const;

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
  accentColor,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
  accentColor?: string;
}) {
  const preset = parsePresetAvatar(avatarUrl);
  const s = sizes[size];
  const color = accentColor ?? nameToAccentColor(name);

  if (preset) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border-2 shadow-sm",
          s.box,
          className,
        )}
        style={{ backgroundColor: preset.bg, borderColor: preset.ring }}
        title={preset.label}
        aria-hidden={!name}
      >
        <span className={s.emoji} role="img" aria-label={preset.label}>
          {preset.emoji}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm",
        s.box,
        s.text,
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden={!name}
    >
      {personInitials(name)}
    </span>
  );
}
