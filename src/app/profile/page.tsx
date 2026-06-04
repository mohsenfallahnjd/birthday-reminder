import { AppSection, PageHeader } from "@/components/app-section";
import { ProfileForm } from "@/components/profile-form";
import { PushNotifications } from "@/components/push-notifications";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

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
      <AppSection title="Notifications" description="Push alerts on this device" unboxed className="mt-0">
        <PushNotifications />
      </AppSection>
    </div>
  );
}
