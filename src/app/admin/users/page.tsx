import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { formatJalaliBirthday } from "@/lib/jalali";
import Link from "next/link";

export default async function AdminUsersPage() {
  const me = await requireUserOrThrow();
  const meDb = await db.user.findUnique({ where: { id: me.id }, select: { isSuperAdmin: true } });
  if (!meDb?.isSuperAdmin) redirect("/dashboard");

  const [users, friendships] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        birthMonth: true,
        birthDay: true,
        birthYear: true,
        createdAt: true,
        isSuperAdmin: true,
        _count: {
          select: {
            memberships: true,
            birthdayCeremonies: true,
            wishlistItems: true,
            friendshipsA: { where: { status: "ACCEPTED" } },
            friendshipsB: { where: { status: "ACCEPTED" } },
          },
        },
      },
    }),
    db.friendship.findMany({
      where: {
        OR: [{ userId: me.id }, { friendId: me.id }],
        status: "ACCEPTED",
      },
      select: { userId: true, friendId: true },
    }),
  ]);

  const friendIds = new Set(
    friendships.map((f) => (f.userId === me.id ? f.friendId : f.userId)),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Users</h1>
          <p className="text-sm text-muted mt-0.5">
            {users.length} registered · {friendIds.size} friends
          </p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 border border-red-200">
          Super Admin
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <ul className="divide-y divide-border">
          {users.map((u) => {
            const isMe = u.isSuperAdmin;
            const isFriend = friendIds.has(u.id);

            return (
              <li key={u.id} className={isMe ? "relative overflow-hidden" : ""}>
                {isMe && (
                  <>
                    {/* animated rainbow stripe for creator row */}
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 animate-pulse"
                      style={{
                        background:
                          "linear-gradient(90deg,#f43f5e,#f97316,#eab308,#22c55e,#3b82f6,#a855f7,#f43f5e)",
                        backgroundSize: "200% 100%",
                        animation: "slide 3s linear infinite",
                      }}
                      aria-hidden
                    />
                    <style>{`
                      @keyframes slide {
                        0% { background-position: 0% 0%; }
                        100% { background-position: 200% 0%; }
                      }
                    `}</style>
                  </>
                )}
                <Link
                  href={isMe ? "/profile" : `/person/${u.id}`}
                  className={`flex items-center gap-4 px-5 py-4 no-underline transition-colors ${
                    isMe
                      ? "bg-gradient-to-r from-yellow-50/60 to-amber-50/40 hover:from-yellow-100/60"
                      : "hover:bg-muted-subtle/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="md" />
                    {isMe && (
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg select-none"
                        style={{ animation: "bob 2s ease-in-out infinite" }}
                        title="Creator"
                      >
                        👑
                        <style>{`
                          @keyframes bob {
                            0%, 100% { transform: translateX(-50%) translateY(0); }
                            50% { transform: translateX(-50%) translateY(-3px); }
                          }
                        `}</style>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-semibold text-sm ${isMe ? "text-amber-700" : "text-foreground"}`}
                      >
                        {u.name}
                      </span>
                      {isMe && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200">
                          Creator
                        </span>
                      )}
                      {isFriend && !isMe && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          🤝 Friend
                        </span>
                      )}
                      {u.birthMonth && u.birthDay && (
                        <span className="text-[11px] text-muted bg-muted-subtle rounded-full px-2 py-0.5">
                          🎂 {formatJalaliBirthday(u.birthMonth, u.birthDay, u.birthYear ?? undefined)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 truncate">{u.email}</p>
                    <p className="text-[11px] text-muted/60 mt-0.5">
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="hidden sm:flex shrink-0 gap-4 text-center">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u._count.birthdayCeremonies}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wide">Parties</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u._count.memberships}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wide">Groups</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u._count.wishlistItems}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wide">Gifts</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u._count.friendshipsA + u._count.friendshipsB}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wide">Friends</p>
                    </div>
                  </div>

                  <svg className="shrink-0 text-zinc-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
