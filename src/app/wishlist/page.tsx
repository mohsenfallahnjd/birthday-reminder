import { AppSection, PageHeader } from "@/components/app-section";
import { WishlistManager } from "@/components/wishlist-manager";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

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

  return (
    <div className="page space-y-8">
      <PageHeader
        title="Wishlist"
        description="Add, edit, or remove gift ideas. Prices use comma formatting (e.g. 1,500,000 Toman)."
      />
      <AppSection title="Your items" description="Linked to parties or general wishlist" unboxed>
        <WishlistManager items={items} ceremonies={ceremonies} />
      </AppSection>
    </div>
  );
}
