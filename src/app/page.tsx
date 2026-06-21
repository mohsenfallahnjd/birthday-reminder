import { Link } from "@/components/link";
import { getSession } from "@/lib/auth";

const features = [
  {
    icon: "🎂",
    title: "Jalali & Gregorian",
    desc: "Persian dates built in. Switch anytime — birthdays, pickers, reminders all update.",
  },
  {
    icon: "👥",
    title: "Groups & friends",
    desc: "Create a group, invite by code or email. See everyone's upcoming birthdays.",
  },
  {
    icon: "🎁",
    title: "Wishlists with prices",
    desc: "Add gift ideas with links. Friends see the list and know exactly what to get.",
  },
  {
    icon: "💸",
    title: "Pool contributions",
    desc: "Everyone chips in any amount. Upload payment proof. Treasurer approves.",
  },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pb-16 pt-16 sm:pt-24">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-pink-300/15 blur-2xl" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-pink-400 to-accent/60" aria-hidden />

        <div className="relative mx-auto max-w-lg px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Birthdays · Wishlists · Group gifts
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
            Remember every
            <br />
            birthday.
            <span className="text-accent"> Split gifts</span>
            <br />
            simply.
          </h1>

          <p className="mt-5 text-base text-muted leading-relaxed max-w-sm mx-auto">
            Jalali dates, friend groups, wishlists with prices, and a treasurer who approves payments. Pay any amount you can.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {session ? (
              <Link href="/dashboard" variant="button">
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link href="/register" variant="button">
                  Get started — it's free
                </Link>
                <Link href="/login" variant="ghost">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-lg px-5 py-12 space-y-3">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted mb-6">
          Everything you need
        </p>
        {features.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-4 rounded-2xl border border-border bg-white px-4 py-4 shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-subtle text-xl">
              {f.icon}
            </span>
            <div>
              <p className="font-semibold text-foreground text-sm">{f.title}</p>
              <p className="mt-0.5 text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA bottom */}
      {!session && (
        <section className="mx-auto max-w-lg px-5 pb-8 text-center">
          <div className="rounded-2xl bg-foreground px-6 py-8 shadow-lg">
            <p className="text-lg font-bold text-white">Ready to get started?</p>
            <p className="mt-1 text-sm text-white/60">Free to use. No credit card required.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" variant="button">
                Create account
              </Link>
              <Link href="/login" className="inline-flex h-9 items-center justify-center px-4 text-sm font-medium text-white/60 transition-colors hover:text-white no-underline">
                Already have an account →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Donation */}
      <section className="mx-auto max-w-lg px-5 pb-12 pt-2">
        <div className="rounded-2xl border border-border bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Support the project</p>
          <p className="text-sm text-muted mb-4">
            Free and open. If it saves you time, a small crypto tip helps keep it running.
          </p>
          <div className="space-y-2">
            {[
              { coin: "BTC", address: "bc1q8st6p7h6rrdg3qzsvxnwjl4mggwd4rcr4cq0qn" },
              { coin: "ETH / USDC / BNB", address: "0x041241A967A7f35f575451fB15652357Fa15171c" },
              { coin: "SOL", address: "Bv8Wcon6xjkfrtg4LhCKpuNPyjKqukb29tnQxRVj4RAn" },
              { coin: "LTC", address: "ltc1qhld85x6w0n3dkjl6e5333uzxs43memfhych77j" },
              { coin: "DOGE", address: "DMUy7Hu7u5c1F8tUVCJMdQYWHGhCgXyW8m" },
              { coin: "XRP", address: "rLFJv2NTiKXsz7quyR55PJpNd32Qhr6cB3" },
              { coin: "TRON", address: "TMENErUuaajAmJoenppG4qohhqzXuu7fgp" },
            ].map(({ coin, address }) => (
              <div key={coin} className="rounded-lg bg-muted-subtle px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">{coin}</p>
                <p className="font-mono text-xs text-foreground break-all select-all">{address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
