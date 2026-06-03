import { ProfileForm } from "@/components/profile-form";
import { PushNotifications } from "@/components/push-notifications";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      <p className="page-desc mb-8">Name and Jalali birthday.</p>
      <ProfileForm
        initial={{
          name: user.name,
          birthMonth: user.birthMonth,
          birthDay: user.birthDay,
          birthYear: user.birthYear,
        }}
      />
      <PushNotifications />
    </div>
  );
}
