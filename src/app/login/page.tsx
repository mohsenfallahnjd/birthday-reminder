import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="page flex min-h-[calc(100vh-3.5rem)] flex-col justify-center">
      <h1 className="page-title">Log in</h1>
      <p className="page-desc mb-8">Welcome back.</p>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
