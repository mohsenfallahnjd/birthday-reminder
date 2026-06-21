import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { ProfilePaymentForm } from "@/components/profile-payment-form";
import { CopyCardButton } from "@/components/copy-card-button";
import { formatJalaliBirthday } from "@/lib/jalali";
import { getCurrency } from "@/lib/currency";
import { MoneyDisplay } from "@/components/money-display";
import { parseCryptoAddresses, CRYPTO_COINS } from "@/lib/crypto-wallets";
import { CopyCryptoAddress } from "@/components/copy-crypto-address";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const currency = await getCurrency();

  const user = await db.user.findFirst({
    where: { OR: [{ username: token }, { profileToken: token }] },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
      birthMonth: true,
      birthDay: true,
      cardNumber: true,
      cardHolder: true,
      cryptoAddresses: true,
      isSuperAdmin: true,
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
      profilePayments: {
        select: { amount: true },
      },
    },
  });

  if (!user) notFound();

  const totalReceived = user.profilePayments.reduce((s, p) => s + p.amount, 0);
  const totalGoal = user.wishlistItems.reduce((s, w) => s + w.cost, 0);
  const progressPct =
    totalGoal > 0 && totalReceived > 0
      ? Math.min(100, Math.round((totalReceived / totalGoal) * 100))
      : null;

  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Hero */}
      <div className={`relative overflow-hidden pb-6 pt-10 ${user.isSuperAdmin ? "bg-gradient-to-br from-amber-50 via-white to-violet-50" : "bg-white"}`}>
        {user.isSuperAdmin ? (
          <>
            <style>{`
              @keyframes rainbowSlide { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }
              @keyframes crownBob { 0%,100%{transform:translateX(-50%) translateY(0) rotate(-4deg)} 50%{transform:translateX(-50%) translateY(-5px) rotate(4deg)} }
              @keyframes shimmer { 0%,100%{opacity:.7} 50%{opacity:1} }
            `}</style>
            {/* animated rainbow top border */}
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background:"linear-gradient(90deg,#f43f5e,#f97316,#eab308,#22c55e,#3b82f6,#a855f7,#f43f5e)", backgroundSize:"200% 100%", animation:"rainbowSlide 3s linear infinite" }}
              aria-hidden
            />
            {/* glow blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-yellow-200/30 blur-2xl" aria-hidden />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-accent/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-pink-300/15 blur-2xl" aria-hidden />
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-pink-400 to-accent/60" aria-hidden />
          </>
        )}

        <div className="relative mx-auto max-w-lg px-5">
          <div className={`flex items-center gap-5 ${user.isSuperAdmin ? "flex-col text-center sm:flex-row sm:text-left" : ""}`}>
            <div className="relative shrink-0">
              {user.isSuperAdmin ? (
                <>
                  {/* golden ring */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background:"conic-gradient(from 0deg,#f43f5e,#f97316,#eab308,#22c55e,#3b82f6,#a855f7,#f43f5e)", padding:3, borderRadius:"50%", animation:"rainbowSlide 4s linear infinite", backgroundSize:"200% 100%" }}
                    aria-hidden
                  >
                    <div className="h-full w-full rounded-full bg-amber-50" />
                  </div>
                  <div className="relative">
                    <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="xl" accentColor="#f59e0b" />
                  </div>
                  <span
                    className="absolute -top-5 left-1/2 select-none text-3xl drop-shadow-md"
                    style={{ animation:"crownBob 2s ease-in-out infinite" }}
                    title="Creator"
                  >
                    👑
                  </span>
                </>
              ) : (
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="xl" accentColor="#4f46e5" />
              )}
            </div>

            <div className={`min-w-0 ${user.isSuperAdmin ? "flex flex-col items-center sm:items-start" : ""}`}>
              {user.isSuperAdmin && (
                <span
                  className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-700 shadow-sm"
                  style={{ animation:"shimmer 2.5s ease-in-out infinite" }}
                >
                  ✦ Creator & Developer ✦
                </span>
              )}
              <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`font-bold leading-tight ${user.isSuperAdmin ? "text-2xl bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 bg-clip-text text-transparent" : "text-xl text-foreground"}`}>{user.name}</h1>
              </div>
              {user.birthMonth && user.birthDay && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="cake" size={13} className="shrink-0 opacity-60" />
                  {formatJalaliBirthday(user.birthMonth, user.birthDay)}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {user.wishlistItems.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    <Icon name="gift" size={11} className="text-current" />
                    {user.wishlistItems.length} gift{user.wishlistItems.length !== 1 ? "s" : ""}
                  </span>
                )}
                {totalReceived > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <MoneyDisplay amount={totalReceived} currency={currency} /> chipped in
                  </span>
                )}
              </div>
            </div>
          </div>

          {progressPct !== null && (
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">Wishlist progress</span>
                <span className="tabular-nums text-muted">{progressPct}% of <MoneyDisplay amount={totalGoal} currency={currency} /></span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent/10">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pb-32 pt-5">

        {/* Bank card */}
        {user.cardNumber && (
          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-5 shadow-md">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Transfer to
            </p>
            <p className="font-mono text-xl font-bold tracking-widest text-white" dir="ltr">
              {user.cardNumber.replace(/-/g, "").replace(/(.{4})/g, "$1 ").trim()}
            </p>
            {user.cardHolder && (
              <p className="mt-1 text-sm text-white/60">{user.cardHolder}</p>
            )}
            <div className="mt-4">
              <CopyCardButton cardNumber={user.cardNumber} />
            </div>
          </section>
        )}

        {/* Crypto wallets */}
        {(() => {
          const cryptos = parseCryptoAddresses(user.cryptoAddresses);
          const entries = CRYPTO_COINS.filter((c) => cryptos[c.id]);
          if (!entries.length) return null;
          return (
            <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted-subtle/50 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Crypto wallets</p>
              </div>
              <ul className="divide-y divide-border">
                {entries.map((coin) => (
                  <li key={coin.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-8 shrink-0 text-center text-lg" title={coin.label}>{coin.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{coin.label}</p>
                      <p className="truncate font-mono text-xs text-foreground">{cryptos[coin.id]}</p>
                    </div>
                    <CopyCryptoAddress address={cryptos[coin.id] ?? ""} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

        {/* Wishlist */}
        {user.wishlistItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-sm font-medium text-foreground">{firstName} hasn&apos;t added gifts yet</p>
            <p className="mt-1 text-xs text-muted">You can still send a contribution below.</p>
          </div>
        ) : (
          <section className="space-y-3">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted">
              {firstName}&apos;s wishlist
            </h2>
            <ul className="space-y-3">
              {user.wishlistItems.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className="flex">
                    {item.ogImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.ogImage}
                        alt={item.title}
                        className="h-28 w-28 flex-shrink-0 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="min-w-0 flex-1 p-4">
                      <p className="font-semibold text-foreground leading-snug">{item.title}</p>
                      {item.ogDescription && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.ogDescription}</p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-base font-bold tabular-nums text-accent">
                          <MoneyDisplay amount={item.cost} currency={currency} />
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.allowCheapIn && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              Pay what you can
                            </span>
                          )}
                          {item.link && (
                            <a
                              href={item.link}
                              className="rounded-full bg-muted-subtle px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:text-foreground"
                              target="_blank"
                              rel="noreferrer"
                            >
                              View item →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Gift form */}
        <section id="gift-form" className="scroll-mt-4">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted">
            Send a gift to {firstName}
          </h2>
          <ProfilePaymentForm profileToken={token} />
        </section>

        <p className="text-center text-xs text-muted/50 pt-2">
          Powered by Birthday Reminder
        </p>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/90 px-5 py-3 backdrop-blur-md"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <a
          href="#gift-form"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          <Icon name="gift" size={16} className="text-white" />
          Send a gift to {firstName}
        </a>
      </div>
    </div>
  );
}
