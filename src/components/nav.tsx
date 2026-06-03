import { Icon } from "@/components/icon";
import { Link } from "@/components/link";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
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
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
        <div
          className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <Link
            href={session ? "/dashboard" : "/"}
            className="text-sm font-semibold tracking-tight text-foreground no-underline hover:no-underline"
          >
            Birthday
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {session ? (
              <>
                <Link href="/dashboard" variant="nav">
                  Dashboard
                </Link>
                <Link href="/wishlist" variant="nav">
                  Wishlist
                </Link>
                <Link href="/groups" variant="nav">
                  Groups
                </Link>
                <Link href="/people" variant="nav">
                  Friends
                </Link>
                <Link href="/notifications" variant="nav" className="relative">
                  Alerts
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <Link href="/profile" variant="nav">
                  Profile
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" variant="nav">
                  Log in
                </Link>
                <Link href="/register" variant="button">
                  Sign up
                </Link>
              </>
            )}
          </nav>

          {session ? (
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground no-underline transition-colors hover:bg-muted-subtle md:hidden"
              aria-label={
                unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
              }
            >
              <Icon name="bell" size={22} className="text-foreground" strokeWidth={1.75} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          ) : (
            <Link href="/login" variant="nav" className="md:hidden">
              Log in
            </Link>
          )}
        </div>
      </header>

      {session && <MobileBottomNav />}
    </>
  );
}
