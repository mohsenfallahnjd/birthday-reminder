import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { formatJalaliBirthday } from "@/lib/jalali";
import { formatMoney } from "@/lib/utils";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const user = await db.user.findUnique({
    where: { profileToken: token },
    select: {
      name: true,
      avatarUrl: true,
      birthMonth: true,
      birthDay: true,
      wishlistItems: {
        where: { ceremonyId: null },
        select: {
          id: true,
          title: true,
          cost: true,
          link: true,
          ogImage: true,
          ogDescription: true,
          allowCheapIn: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 via-white to-pink-50 pb-8 pt-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-pink-400/10 blur-2xl" aria-hidden />
        <div className="absolute top-0 h-1 w-full bg-gradient-to-r from-accent via-accent/50 to-accent" aria-hidden />

        <div className="relative mx-auto max-w-lg px-5">
          <div className="flex flex-col items-center text-center">
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="xl" accentColor="#4f46e5" />
            <h1 className="mt-3 text-2xl font-bold text-foreground">{user.name}</h1>
            {user.birthMonth && user.birthDay && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Icon name="cake" size={13} className="shrink-0 opacity-70" />
                {formatJalaliBirthday(user.birthMonth, user.birthDay)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pb-16 pt-6">
        {user.wishlistItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <p className="text-2xl mb-2">🎁</p>
            <p className="text-sm text-muted">No wishlist items yet.</p>
          </div>
        ) : (
          <>
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Wishlist · {user.wishlistItems.length} item{user.wishlistItems.length !== 1 ? "s" : ""}
            </p>
            <ul className="space-y-3">
              {user.wishlistItems.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <div className="flex gap-3">
                    {item.ogImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.ogImage}
                        alt={item.title}
                        className="h-24 w-24 flex-shrink-0 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="min-w-0 flex-1 p-4">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      {item.ogDescription && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.ogDescription}</p>
                      )}
                      <p className="mt-1.5 text-sm font-medium tabular-nums text-accent">
                        {formatMoney(item.cost)}
                      </p>
                      {item.allowCheapIn && (
                        <span className="mt-1 inline-block rounded-full bg-muted-subtle px-2 py-0.5 text-xs text-muted">
                          Pay what you can
                        </span>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-accent underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View item →
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="text-center text-xs text-muted pt-2">
          Powered by Birthday Reminder
        </p>
      </div>
    </div>
  );
}
