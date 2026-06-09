import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { UserAvatar } from "@/components/user-avatar";
import { MoneyProgress } from "@/components/ui/money-progress";
import { PublicPartyPaymentForm } from "@/components/public-party-payment-form";
import { Icon } from "@/components/icon";
import { formatJalaliBirthday } from "@/lib/jalali";
import { formatMoney } from "@/lib/utils";

export default async function PublicPartyPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const ceremony = await db.ceremony.findUnique({
    where: { shareToken },
    select: {
      id: true,
      title: true,
      color: true,
      active: true,
      cardNumber: true,
      cardHolder: true,
      birthdayUserId: true,
      birthdayUser: {
        select: { name: true, avatarUrl: true, birthMonth: true, birthDay: true },
      },
    },
  });

  if (!ceremony || !ceremony.active) notFound();

  const wishlistItems = await db.wishlistItem.findMany({
    where: {
      userId: ceremony.birthdayUserId,
      OR: [{ ceremonyId: ceremony.id }, { ceremonyId: null }],
    },
    select: {
      id: true,
      title: true,
      cost: true,
      ogImage: true,
      ogDescription: true,
      link: true,
      allowCheapIn: true,
      payments: {
        where: { status: "APPROVED" },
        select: { amount: true, wishlistItemId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const generalPool = await db.payment.aggregate({
    where: { ceremonyId: ceremony.id, status: "APPROVED", wishlistItemId: null },
    _sum: { amount: true },
  });
  const pool = generalPool._sum.amount ?? 0;

  const totalTarget = wishlistItems.reduce((s, i) => s + i.cost, 0);
  const totalCollected =
    wishlistItems.reduce(
      (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
      0,
    ) + pool;

  const c = ceremony.color;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero header */}
      <div
        className="relative overflow-hidden pb-8 pt-10"
        style={{
          background: `linear-gradient(160deg, ${c}22 0%, #ffffff 55%, ${c}14 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: c }}
          aria-hidden
        />
        <div
          className="h-1.5 w-full absolute top-0"
          style={{ background: `linear-gradient(90deg, ${c}, ${c}66, ${c})` }}
          aria-hidden
        />

        <div className="mx-auto max-w-lg px-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
              style={{ backgroundColor: `${c}22`, color: c }}
            >
              <Icon name="party" size={22} className="text-current" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Birthday party</p>
              <h1 className="truncate text-xl font-bold text-foreground">{ceremony.title}</h1>
            </div>
          </div>

          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
            style={{ borderColor: `${c}44`, backgroundColor: `${c}0c` }}
          >
            <UserAvatar
              name={ceremony.birthdayUser.name}
              avatarUrl={ceremony.birthdayUser.avatarUrl}
              size="lg"
              accentColor={c}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Birthday holder</p>
              <p className="truncate text-lg font-semibold text-foreground">
                {ceremony.birthdayUser.name}
              </p>
              {ceremony.birthdayUser.birthMonth && ceremony.birthdayUser.birthDay && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <Icon name="cake" size={11} className="shrink-0 opacity-70" />
                  {formatJalaliBirthday(
                    ceremony.birthdayUser.birthMonth,
                    ceremony.birthdayUser.birthDay,
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-5 pb-16 pt-5">
        {/* Total progress */}
        {totalTarget > 0 && (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Gift progress</p>
            <MoneyProgress className="mt-3" collected={totalCollected} target={totalTarget} label="Total raised" />
          </div>
        )}

        {/* Wishlist items */}
        {wishlistItems.length > 0 && (
          <div className="space-y-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Wishlist</p>
            <ul className="space-y-3">
              {wishlistItems.map((item) => {
                const own = item.payments.reduce((s, p) => s + p.amount, 0);
                const effective = Math.min(item.cost, own + pool);
                return (
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
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{item.ogDescription}</p>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            className="mt-0.5 inline-block text-xs text-accent underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            View link →
                          </a>
                        )}
                        <p className="mt-1.5 text-sm tabular-nums text-muted">{formatMoney(item.cost)} goal</p>
                        {item.allowCheapIn && (
                          <span className="mt-1 inline-block rounded-full bg-muted-subtle px-2 py-0.5 text-xs">
                            Pay what you can
                          </span>
                        )}
                        <MoneyProgress className="mt-2" collected={effective} target={item.cost} label="Collected" size="sm" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Payment form */}
        <PublicPartyPaymentForm
          shareToken={shareToken}
          cardNumber={ceremony.cardNumber}
          cardHolder={ceremony.cardHolder}
          items={wishlistItems.map((i) => ({ id: i.id, title: i.title, cost: i.cost }))}
        />

        <p className="text-center text-xs text-muted pb-2">
          Powered by Birthday Reminder · Your payment will be reviewed by the party admin.
        </p>
      </div>
    </div>
  );
}
