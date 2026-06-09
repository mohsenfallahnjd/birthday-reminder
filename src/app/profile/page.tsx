import { AppSection, PageHeader } from "@/components/app-section";
import { ProfileForm } from "@/components/profile-form";
import { PushNotifications } from "@/components/push-notifications";
import { ShareProfileButton } from "@/components/share-profile-button";
import { DateSystemToggle } from "@/components/date-system-toggle";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { getDateSystem } from "@/lib/date-system";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const dateSystem = await getDateSystem();

  const [profilePayments, wishlistItems] = await Promise.all([
    db.profilePayment
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
    db.wishlistItem
      .findMany({
        where: { userId: user.id, ceremonyId: null },
        select: { cost: true },
      })
      .catch(() => []),
  ]);

  const totalReceived = profilePayments.reduce((s, p) => s + p.amount, 0);
  const totalGoal = wishlistItems.reduce((s, w) => s + w.cost, 0);
  const progressPct =
    totalGoal > 0
      ? Math.min(100, Math.round((totalReceived / totalGoal) * 100))
      : null;

  return (
    <div className="page space-y-8">
      <PageHeader
        title="Profile"
        description="Avatar, name, and Jalali birthday."
      />
      <AppSection
        title="Your profile"
        description="Avatar, name, and birthday — visible to friends"
        unboxed
      >
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
      </AppSection>
      <AppSection
        title="Wishlist link"
        description="Share your wishlist without opening a party"
      >
        <ShareProfileButton profileToken={user.profileToken} username={user.username ?? null} name={user.name} />
      </AppSection>
      {profilePayments.length > 0 && (
        <AppSection
          title="Received gifts"
          description="Contributions sent to your public profile"
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-accent/10 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Total received
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatMoney(totalReceived)}
              </p>
              <p className="text-xs text-muted">
                {profilePayments.length} contribution
                {profilePayments.length !== 1 ? "s" : ""}
              </p>
              {progressPct !== null && (
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between text-xs text-muted">
                    <span>{progressPct}% of wishlist goal</span>
                    <span>{formatMoney(totalGoal)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-accent/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden shadow-sm">
              {profilePayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{p.guestName}</p>
                    {p.note && <p className="text-xs text-muted">{p.note}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-accent">
                      {formatMoney(p.amount)}
                    </p>
                    {p.proofUrl && (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted underline"
                      >
                        View proof
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </AppSection>
      )}

      <AppSection title="Date display" description="Choose how dates appear across the app">
        <DateSystemToggle current={dateSystem} />
      </AppSection>

      <AppSection
        title="Notifications"
        description="Push alerts on this device"
        unboxed
        className="mt-0"
      >
        <PushNotifications />
      </AppSection>
    </div>
  );
}
