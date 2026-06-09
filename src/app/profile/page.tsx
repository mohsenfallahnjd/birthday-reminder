import { AppSection, PageHeader } from "@/components/app-section";
import { ProfileForm } from "@/components/profile-form";
import { PushNotifications } from "@/components/push-notifications";
import { ShareProfileButton } from "@/components/share-profile-button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const profilePayments = await db.profilePayment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const totalReceived = profilePayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page space-y-8">
      <PageHeader title="Profile" description="Avatar, name, and Jalali birthday." />
      <AppSection title="Your profile" description="Avatar, name, and birthday — visible to friends" unboxed>
        <ProfileForm
          initial={{
            name: user.name,
            avatarUrl: user.avatarUrl,
            birthMonth: user.birthMonth,
            birthDay: user.birthDay,
            birthYear: user.birthYear,
          }}
        />
      </AppSection>
      <AppSection title="Wishlist link" description="Share your wishlist without opening a party">
        <ShareProfileButton profileToken={user.profileToken} name={user.name} />
      </AppSection>
      {profilePayments.length > 0 && (
        <AppSection title="Received gifts" description="Contributions sent to your public profile">
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-accent/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Total received</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{formatMoney(totalReceived)}</p>
              <p className="text-xs text-muted">{profilePayments.length} contribution{profilePayments.length !== 1 ? "s" : ""}</p>
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden shadow-sm">
              {profilePayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.guestName}</p>
                    {p.note && <p className="text-xs text-muted">{p.note}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-accent">{formatMoney(p.amount)}</p>
                    {p.proofUrl && (
                      <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-muted underline">
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

      <AppSection title="Notifications" description="Push alerts on this device" unboxed className="mt-0">
        <PushNotifications />
      </AppSection>
    </div>
  );
}
