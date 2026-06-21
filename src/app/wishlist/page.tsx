import { WishlistManager } from "@/components/wishlist-manager";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney, getCurrency } from "@/lib/currency";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const currency = await getCurrency();

  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      link: true,
      ogImage: true,
      ogDescription: true,
      cost: true,
      allowCheapIn: true,
      ceremonyId: true,
    },
  });

  const ceremonies = await db.ceremony.findMany({
    where: { birthdayUserId: user.id, active: true },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const totalValue = items.reduce((s, i) => s + i.cost, 0);
  const profileSlug = user.username ?? user.profileToken;

  return (
    <div className="page-wide space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Wishlist</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {items.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted-subtle px-2.5 py-1 text-xs font-medium text-muted">
                <Icon name="gift" size={11} />
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
            {totalValue > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                {formatMoney(totalValue, currency)} total
              </span>
            )}
          </div>
        </div>
        <a
          href={`/u/${profileSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-muted no-underline shadow-sm transition-colors hover:text-foreground"
        >
          <Icon name="share" size={13} />
          Share
        </a>
      </div>

      <WishlistManager items={items} ceremonies={ceremonies} />
    </div>
  );
}
