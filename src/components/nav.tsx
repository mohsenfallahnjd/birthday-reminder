import { Link } from "@/components/link";
import { Icon } from "@/components/icon";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function Nav() {
  const session = await getSession();
  let unread = 0;
  if (session) {
    unread = await db.notification.count({
      where: { userId: session.id, read: false },
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-party-pink/10 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={session ? "/dashboard" : "/"} variant="default" className="flex items-center gap-2 text-lg font-bold">
          <Icon name="party" size={24} />
          <span className="bg-gradient-to-r from-party-pink to-party-fuchsia bg-clip-text text-transparent">
            جشن تولد
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard" variant="nav">داشبورد</Link>
              <Link href="/groups" variant="nav">گروه‌ها</Link>
              <Link href="/people" variant="nav">دوستان</Link>
              <Link href="/notifications" variant="nav" className="relative">
                <Icon name="bell" size={18} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-party-pink px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/profile" variant="nav">پروفایل</Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-sm text-party-ink/60 hover:text-party-fuchsia">
                  خروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" variant="nav">ورود</Link>
              <Link href="/register" variant="button">ثبت‌نام</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
