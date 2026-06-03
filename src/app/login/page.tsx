import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/icon";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardTitle className="mb-6 justify-center">
          <Icon name="cake" />
          خوش برگشتی!
        </CardTitle>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </Card>
    </div>
  );
}
