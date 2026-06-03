import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="page flex min-h-[calc(100vh-3.5rem)] flex-col justify-center">
      <h1 className="page-title">Sign up</h1>
      <p className="page-desc mb-8">Create your account.</p>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
