import { Link } from "@/components/link";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";

type Suggestion = {
  id: string;
  name: string;
  days: number;
  date: string;
  avatarUrl?: string | null;
};

function urgencyColor(days: number) {
  if (days === 0) return { accent: "#e11d48", bg: "#fff1f2", border: "#fecdd3", text: "#be123c" };
  if (days <= 3) return { accent: "#ea580c", bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" };
  if (days <= 7) return { accent: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#92400e" };
  return { accent: "#0891b2", bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" };
}

export function PartySuggestions({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
          <Icon name="party" size={11} className="text-amber-600" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Plan a party</h2>
        <span className="text-xs text-muted">— no active party yet</span>
      </div>

      <ul className="flex flex-col gap-2">
        {suggestions.map((s) => {
          const c = urgencyColor(s.days);
          return (
            <li
              key={s.id}
              className="flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 sm:px-4"
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            >
              <UserAvatar
                name={s.name}
                avatarUrl={s.avatarUrl}
                size="md"
                accentColor={c.accent}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {s.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: c.text }}>
                  <Icon name="cake" size={11} className="shrink-0" />
                  {s.days === 0 ? "Today!" : s.days === 1 ? "Tomorrow" : `In ${s.days} days`}
                  {" · "}{s.date}
                </p>
              </div>

              <Link
                href="/groups"
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold no-underline transition-opacity hover:opacity-80"
                style={{ backgroundColor: c.accent, color: "#fff" }}
              >
                Start party
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
