import { ShareInviteCode } from "@/components/share-invite-code";
import { Icon } from "@/components/icon";
import { Link } from "@/components/link";
import { personInitials } from "@/lib/avatars";

const GROUP_ACCENT = "#4f46e5";

export function GroupCard({
  id,
  name,
  memberCount,
  inviteCode,
  appOrigin,
}: {
  id: string;
  name: string;
  memberCount: number;
  inviteCode: string;
  appOrigin?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/80 shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${GROUP_ACCENT}12 0%, #ffffff 55%, ${GROUP_ACCENT}08 100%)`,
        boxShadow: `0 1px 0 ${GROUP_ACCENT}18, 0 8px 24px -12px ${GROUP_ACCENT}33`,
      }}
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${GROUP_ACCENT}, ${GROUP_ACCENT}55, ${GROUP_ACCENT})`,
        }}
        aria-hidden
      />
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${GROUP_ACCENT}18`, color: GROUP_ACCENT }}
          >
            <Icon name="users" size={22} className="text-current" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/groups/${id}`}
              className="text-base font-semibold text-foreground no-underline hover:underline"
            >
              {name}
            </Link>
            <p className="mt-0.5 text-xs text-muted">
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </p>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: GROUP_ACCENT }}
          >
            {personInitials(name)}
          </span>
        </div>
        <ShareInviteCode
          inviteCode={inviteCode}
          groupName={name}
          appOrigin={appOrigin}
          compact
        />
      </div>
    </div>
  );
}
