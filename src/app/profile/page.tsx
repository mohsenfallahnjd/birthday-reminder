import { ProfileForm } from "@/components/profile-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardTitle className="mb-6">
          <Icon name="calendar" />
          پروفایل و تاریخ تولد شمسی
        </CardTitle>
        <ProfileForm
          initial={{
            name: user.name,
            birthMonth: user.birthMonth,
            birthDay: user.birthDay,
            birthYear: user.birthYear,
          }}
        />
      </Card>
    </div>
  );
}
