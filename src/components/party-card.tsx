import { Icon } from "@/components/icon";
import { Link } from "@/components/link";
import { UserAvatar } from "@/components/user-avatar";
import type { CeremonyMemberRole } from "@prisma/client";

function roleBadge(
  role: CeremonyMemberRole | "GROUP" | null,
  isYourBirthday: boolean,
) {
  if (isYourBirthday)
    return { label: "Your birthday", tone: "birthday" as const };
  if (role === "ADMIN") return { label: "Admin", tone: "admin" as const };
  if (role === "GUEST") return { label: "Guest", tone: "guest" as const };
  if (role === "GROUP") return { label: "Group", tone: "guest" as const };
  return null;
}

const badgeStyles = {
  birthday: "bg-foreground/10 text-foreground",
  admin: "bg-violet-100 text-violet-800",
  guest: "bg-zinc-100 text-zinc-600",
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
}: {
  id: string;
  title: string;
  color: string;
  holderName: string;
  holderAvatarUrl?: string | null;
  groupName?: string | null;
  memberRole?: CeremonyMemberRole | "GROUP" | null;
  isYourBirthday?: boolean;
}) {
  const badge = roleBadge(memberRole ?? null, isYourBirthday);

  return (
    <Link
      href={`/ceremonies/${id}`}
      className="group block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      <article
        className="relative overflow-hidden rounded-2xl border border-white/80 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
        style={{
          background: `linear-gradient(135deg, ${color}14 0%, #ffffff 55%, ${color}0a 100%)`,
          boxShadow: `0 1px 0 ${color}25, 0 8px 24px -10px ${color}55`,
        }}
      >
        <div
          className="absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-35"
          style={{ backgroundColor: color }}
          aria-hidden
        />

        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}55, ${color})`,
          }}
          aria-hidden
        />

        <div className="relative flex items-center gap-3 p-4 sm:gap-4 sm:p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <Icon
              name="party"
              size={22}
              className="text-current"
              strokeWidth={1.75}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground sm:text-[1.05rem]">
                {title}
              </h3>
              {badge && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles[badge.tone]}`}
                >
                  {badge.label}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <UserAvatar
                name={holderName}
                avatarUrl={holderAvatarUrl}
                size="sm"
                accentColor={color}
              />
              <div className="min-w-0 text-sm">
                <span className="text-muted">Birthday · </span>
                <span className="font-medium text-foreground">
                  {holderName}
                </span>
              </div>
            </div>

            {groupName && (
              <p className="mt-1.5 truncate text-xs text-muted">
                <Icon
                  name="users"
                  size={12}
                  className="mr-1 inline-block -mt-px text-muted"
                />
                {groupName}
              </p>
            )}
          </div>

          <span
            className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M9 18l6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}
