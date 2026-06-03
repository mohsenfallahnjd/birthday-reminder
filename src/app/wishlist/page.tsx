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
  });

  const ceremonies = await db.ceremony.findMany({
    where: { birthdayUserId: user.id, active: true },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page">
      <h1 className="page-title">Wishlist</h1>
      <p className="page-desc mb-8">
        Add, edit, or remove gift ideas. Prices use comma formatting (e.g. 1,500,000 Toman).
      </p>
      <WishlistManager items={items} ceremonies={ceremonies} />
    </div>
  );
}
