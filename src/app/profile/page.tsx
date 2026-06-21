import { ProfileForm } from "@/components/profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { CurrencyToggle } from "@/components/currency-toggle";
import { PushNotifications } from "@/components/push-notifications";
import { ShareProfileButton } from "@/components/share-profile-button";
import { DateSystemToggle } from "@/components/date-system-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrency } from "@/lib/currency";
import { MoneyDisplay } from "@/components/money-display";
import { getDateSystem } from "@/lib/date-system";
import { redirect } from "next/navigation";
import { CryptoAddressesForm } from "@/components/crypto-addresses-form";
import { parseCryptoAddresses } from "@/lib/crypto-wallets";

function SectionHeading({
  title,
  description,
  noMargin,
}: { title: string; description?: string; noMargin?: boolean }) {
  return (
    <div className={noMargin ? "" : "mb-4"}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      )}
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const dateSystem = await getDateSystem();
  const currency = await getCurrency();
  const slug = user.username ?? user.profileToken;

  const [profilePayments, wishlistItems, dbUser] = await Promise.all([
    db.profilePayment
      .findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    db.wishlistItem
      .findMany({
        where: { userId: user.id, ceremonyId: null },
        select: { cost: true },
      })
      .catch(() => []),
    db.user.findUnique({ where: { id: user.id }, select: { cryptoAddresses: true, isSuperAdmin: true } }),
  ]);

  const cryptoAddresses = parseCryptoAddresses(dbUser?.cryptoAddresses);
  const isSuperAdmin = dbUser?.isSuperAdmin ?? false;
  const totalReceived = profilePayments.reduce((s, p) => s + p.amount, 0);
  const totalGoal = wishlistItems.reduce((s, w) => s + w.cost, 0);
  const progressPct =
    totalGoal > 0
      ? Math.min(100, Math.round((totalReceived / totalGoal) * 100))
      : null;

  return (
    <div className="page-wide space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-border/60 shadow-sm">
        <div
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-accent/12 via-accent/5 to-transparent"
          aria-hidden
        />
        <div className="relative flex items-center gap-4 px-5 py-5">
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground leading-snug truncate">
                {user.name}
              </p>
              {isSuperAdmin && (
                <a
                  href="/admin/users"
                  className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 no-underline border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Admin
                </a>
              )}
            </div>
            {user.username && (
              <p className="text-sm text-muted">@{user.username}</p>
            )}
            <a
              href={`/u/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted no-underline hover:text-foreground transition-colors"
            >
              <Icon name="share" size={11} />
              /u/{slug}
            </a>
          </div>
        </div>
      </div>

      {/* Received gifts */}
      {profilePayments.length > 0 && (
        <div className="rounded-2xl ring-1 ring-accent/25 bg-gradient-to-br from-accent/8 to-accent/4 px-5 py-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Received gifts
            </p>
            <p className="text-xs text-muted">
              {profilePayments.length} contribution
              {profilePayments.length !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            <MoneyDisplay amount={totalReceived} currency={currency} />
          </p>
          {progressPct !== null && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted">
                {progressPct}% of{" "}
                <MoneyDisplay amount={totalGoal} currency={currency} /> wishlist
                goal
              </p>
            </div>
          )}
          <details className="pt-1">
            <summary className="cursor-pointer list-none text-xs font-medium text-accent hover:underline">
              View all →
            </summary>
            <ul className="mt-2 divide-y divide-border/50 rounded-xl border border-border/60 bg-white overflow-hidden">
              {profilePayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {p.guestName}
                    </p>
                    {p.note && (
                      <p className="text-[11px] text-muted">{p.note}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-accent">
                      <MoneyDisplay amount={p.amount} currency={currency} />
                    </p>
                    {p.proofUrl && (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-muted underline"
                      >
                        Proof
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Edit profile */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted-subtle/50 px-5 py-3.5">
          <SectionHeading
            noMargin
            title="Profile info"
            description="Name, avatar, birthday — visible to friends"
          />
        </div>
        <div className="px-5 py-5">
          <ProfileForm
            initial={{
              name: user.name,
              avatarUrl: user.avatarUrl,
              birthMonth: user.birthMonth,
              birthDay: user.birthDay,
              birthYear: user.birthYear,
              username: user.username ?? null,
              cardNumber: user.cardNumber ?? null,
              cardHolder: user.cardHolder ?? null,
            }}
          />
        </div>
      </div>

      {/* Crypto wallets */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted-subtle/50 px-5 py-3.5">
          <SectionHeading
            noMargin
            title="Crypto wallets"
            description="Accept gifts via crypto — shown on your public profile"
          />
        </div>
        <div className="px-5 py-5">
          <CryptoAddressesForm initial={cryptoAddresses} />
        </div>
      </div>

      {/* Share link */}
      <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-5">
        <SectionHeading
          title="Public wishlist link"
          description="Share so friends can contribute without joining a party"
        />
        <ShareProfileButton
          profileToken={user.profileToken}
          username={user.username ?? null}
          name={user.name}
        />
      </div>

      {/* Date format */}
      <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-5">
        <SectionHeading
          title="Date format"
          description="How dates appear everywhere in the app"
        />
        <DateSystemToggle current={dateSystem} />
      </div>

      {/* Currency */}
      <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-5">
        <SectionHeading
          title="Currency"
          description="How amounts display across the app"
        />
        <CurrencyToggle />
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-5">
        <SectionHeading
          title="Change password"
          description="Requires your current password"
        />
        <ChangePasswordForm />
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-5 pb-6">
        <SectionHeading
          title="Push notifications"
          description="Birthday reminders and party updates on this device"
        />
        <PushNotifications />
      </div>

      {/* Donation */}
      <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-5">
        <SectionHeading
          title="Support the developer"
          description="Free app — a small crypto tip helps keep it running"
        />
        <div className="space-y-2">
          {[
            {
              coin: "BTC",
              address: "bc1q8st6p7h6rrdg3qzsvxnwjl4mggwd4rcr4cq0qn",
            },
            {
              coin: "ETH / USDC / BNB",
              address: "0x041241A967A7f35f575451fB15652357Fa15171c",
            },
            {
              coin: "SOL",
              address: "Bv8Wcon6xjkfrtg4LhCKpuNPyjKqukb29tnQxRVj4RAn",
            },
            {
              coin: "LTC",
              address: "ltc1qhld85x6w0n3dkjl6e5333uzxs43memfhych77j",
            },
            { coin: "DOGE", address: "DMUy7Hu7u5c1F8tUVCJMdQYWHGhCgXyW8m" },
            { coin: "XRP", address: "rLFJv2NTiKXsz7quyR55PJpNd32Qhr6cB3" },
            { coin: "TRON", address: "TMENErUuaajAmJoenppG4qohhqzXuu7fgp" },
          ].map(({ coin, address }) => (
            <div key={coin} className="rounded-lg bg-muted-subtle px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                {coin}
              </p>
              <p className="font-mono text-xs text-foreground break-all select-all">
                {address}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Built by{" "}
          <a
            href="https://themohsen.me"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Mohsen · themohsen.me
          </a>
        </p>
      </div>
    </div>
  );
}
