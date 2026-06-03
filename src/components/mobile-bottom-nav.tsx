"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Gift, Heart, Home, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/wishlist", label: "Wishlist", icon: Gift },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/people", label: "Friends", icon: Heart },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function MobileBottomNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-6 h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          const showBadge = href === "/notifications" && unread > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted",
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "stroke-[2.5px]")}
                strokeWidth={active ? 2.5 : 1.75}
                aria-hidden
              />
              <span className="truncate max-w-full">{label}</span>
              {showBadge && (
                <span className="absolute top-1.5 right-1/4 flex h-4 min-w-4 -translate-x-1/2 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
