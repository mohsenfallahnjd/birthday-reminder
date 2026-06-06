import { UserAvatar } from "./user-avatar";
import { Icon } from "./icon";

type BirthdayEntry = {
  id: string;
  name: string;
  days: number;
  date: string;
  avatarUrl?: string | null;
};

type TierConfig = {
  accentColor: string;
  cardBg: string;
  cardBorder: string;
  daysNumColor: string;
  tagBg: string;
  tagText: string;
};

function tierConfig(days: number): TierConfig {
  if (days === 0)
    return {
      accentColor: "#e11d48",
      cardBg: "linear-gradient(135deg,#fff1f228 0%,#ffffff 70%)",
      cardBorder: "#fecdd3",
      daysNumColor: "#e11d48",
      tagBg: "#fef2f2",
      tagText: "#e11d48",
    };
  if (days <= 3)
    return {
      accentColor: "#ea580c",
      cardBg: "linear-gradient(135deg,#fff7ed28 0%,#ffffff 70%)",
      cardBorder: "#fed7aa",
      daysNumColor: "#ea580c",
      tagBg: "#fff7ed",
      tagText: "#c2410c",
    };
  if (days <= 7)
    return {
      accentColor: "#d97706",
      cardBg: "linear-gradient(135deg,#fffbeb28 0%,#ffffff 70%)",
      cardBorder: "#fde68a",
      daysNumColor: "#d97706",
      tagBg: "#fffbeb",
      tagText: "#92400e",
    };
  if (days <= 30)
    return {
      accentColor: "#0891b2",
      cardBg: "linear-gradient(135deg,#ecfeff20 0%,#ffffff 70%)",
      cardBorder: "#bae6fd",
      daysNumColor: "#0891b2",
      tagBg: "#f0f9ff",
      tagText: "#0369a1",
    };
  return {
    accentColor: "#818cf8",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    daysNumColor: "#94a3b8",
    tagBg: "#f8fafc",
    tagText: "#64748b",
  };
}

function BirthdayCard({
  name,
  days,
  date,
  avatarUrl,
  hasParty,
}: BirthdayEntry & { hasParty?: boolean }) {
  const t = tierConfig(days);
  const isToday = days === 0;

  return (
    <li
      className="relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5"
      style={{ background: t.cardBg, borderColor: t.cardBorder }}
    >
      {/* Left accent strip */}
      <span
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: t.accentColor }}
        aria-hidden
      />

      {/* Blurred glow in background */}
      <span
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: t.accentColor }}
        aria-hidden
      />

      {/* Avatar */}
      <UserAvatar
        name={name}
        avatarUrl={avatarUrl}
        size="md"
        accentColor={t.accentColor}
      />

      {/* Name + date */}
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {hasParty && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Party ✓
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <Icon name="cake" size={11} className="shrink-0 opacity-70" />
          {date}
        </p>
      </div>

      {/* Days countdown */}
      <div className="relative shrink-0 text-right">
        {isToday ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: t.tagBg, color: t.tagText }}
          >
            <Icon name="cake" size={12} />
            Today!
          </span>
        ) : (
          <div
            className="flex min-w-[3rem] flex-col items-center rounded-xl px-2.5 py-1.5"
            style={{ backgroundColor: t.tagBg }}
          >
            <span
              className="text-lg font-bold leading-none tabular-nums"
              style={{ color: t.daysNumColor }}
            >
              {days}
            </span>
            <span className="mt-0.5 text-[10px] font-medium leading-none" style={{ color: t.tagText }}>
              {days === 1 ? "day" : "days"}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
    </div>
  );
}

export function UpcomingBirthdayList({
  entries,
  activePartyUserIds,
}: {
  entries: BirthdayEntry[];
  activePartyUserIds?: Set<string>;
}) {
  if (entries.length === 0) return null;

  const today = entries.filter((e) => e.days === 0);
  const thisWeek = entries.filter((e) => e.days >= 1 && e.days <= 7);
  const thisMonth = entries.filter((e) => e.days >= 8 && e.days <= 30);
  const later = entries.filter((e) => e.days > 30);

  const groups: { label: string; color: string; items: BirthdayEntry[] }[] = [
    { label: "Today", color: "#e11d48", items: today },
    { label: "This week", color: "#d97706", items: thisWeek },
    { label: "This month", color: "#0891b2", items: thisMonth },
    { label: "Coming up", color: "#818cf8", items: later },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <SectionLabel label={group.label} color={group.color} />
          <ul className="space-y-2">
            {group.items.map((entry) => (
              <BirthdayCard
                key={entry.id}
                {...entry}
                hasParty={activePartyUserIds?.has(entry.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
