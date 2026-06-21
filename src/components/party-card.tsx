import { Link } from "@/components/link";
import { UserAvatar } from "@/components/user-avatar";
import type { CeremonyMemberRole } from "@prisma/client";

function roleBadge(role: CeremonyMemberRole | "GROUP" | null, isYourBirthday: boolean) {
  if (isYourBirthday) return { label: "Your birthday 🎂", tone: "birthday" as const };
  if (role === "ADMIN") return { label: "Admin", tone: "admin" as const };
  if (role === "GUEST") return { label: "Guest", tone: "guest" as const };
  if (role === "GROUP") return { label: "Group member", tone: "guest" as const };
  return null;
}

const badgeStyles = {
  birthday: "bg-amber-50 text-amber-700 border border-amber-200",
  admin: "bg-violet-50 text-violet-700 border border-violet-200",
  guest: "bg-zinc-100 text-zinc-500 border border-zinc-200",
} as const;

export function PartyCard({
  id,
  title,
  color,
  holderName,
  holderAvatarUrl,
  groupName,
  memberRole,
  isYourBirthday = false,
  ended = false,
}: {
  id: string;
  title: string;
  color: string;
  holderName: string;
  holderAvatarUrl?: string | null;
  groupName?: string | null;
  memberRole?: CeremonyMemberRole | "GROUP" | null;
  isYourBirthday?: boolean;
  ended?: boolean;
}) {
  const badge = roleBadge(memberRole ?? null, isYourBirthday);
  const c = ended ? "#a1a1aa" : color;

  return (
    <Link
      href={`/ceremonies/${id}`}
      className="group block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      <article
        className="relative overflow-hidden rounded-2xl border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={{
          background: ended
            ? "#fafafa"
            : `linear-gradient(140deg, ${color}12 0%, #ffffff 50%, ${color}08 100%)`,
          borderColor: ended ? "#e4e4e7" : `${color}40`,
          boxShadow: ended
            ? "0 1px 3px rgba(0,0,0,0.06)"
            : `0 1px 3px ${color}20, 0 4px 16px -4px ${color}30`,
        }}
      >
        {/* accent stripe */}
        <div
          className="h-[3px] w-full"
          style={{
            background: ended
              ? "#e4e4e7"
              : `linear-gradient(90deg, ${color}cc, ${color}44, ${color}cc)`,
          }}
          aria-hidden
        />

        {/* glow blob */}
        {!ended && (
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        )}

        <div className="relative flex items-center gap-4 px-4 py-3.5">
          {/* color dot / icon */}
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
            style={{
              backgroundColor: ended ? "#f0f0f0" : `${color}18`,
            }}
          >
            <span className="text-2xl select-none" role="img" aria-label="Party">🎉</span>
            {!ended && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
            )}
          </div>

          {/* content */}
          <div className="min-w-0 flex-1">
            {/* title row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className={`truncate text-[15px] font-semibold leading-snug ${ended ? "text-zinc-400" : "text-foreground"}`}>
                {title}
              </h3>
              {ended ? (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  Ended
                </span>
              ) : badge ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStyles[badge.tone]}`}>
                  {badge.label}
                </span>
              ) : null}
            </div>

            {/* holder row */}
            <div className="mt-1.5 flex items-center gap-2">
              <UserAvatar
                name={holderName}
                avatarUrl={holderAvatarUrl}
                size="sm"
                accentColor={c}
              />
              <span className={`truncate text-xs ${ended ? "text-zinc-400" : "text-muted"}`}>
                {holderName}
              </span>
              {groupName && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className={`truncate text-xs ${ended ? "text-zinc-400" : "text-muted"}`}>
                    {groupName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* chevron */}
          <svg
            className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${ended ? "text-zinc-300" : "text-zinc-400"}`}
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            aria-hidden
          >
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </article>
    </Link>
  );
}
