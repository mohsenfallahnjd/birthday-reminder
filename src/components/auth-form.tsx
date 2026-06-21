"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link } from "@/components/link";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: fd.get("email"),
      password: fd.get("password"),
      ...(mode === "register" ? { name: fd.get("name") } : {}),
    };

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push(search.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Alex" />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="password" className="mb-0">Password</Label>
          {mode === "login" && (
            <Link href="/forgot-password" className="text-xs text-muted hover:text-foreground">
              Forgot password?
            </Link>
          )}
        </div>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        loading={loading}
        loadingText="Please wait…"
      >
        {mode === "login" ? "Log in" : "Sign up"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            No account? <Link href="/register">Sign up</Link>
          </>
        ) : (
          <>
            Already registered? <Link href="/login">Log in</Link>
          </>
        )}
      </p>
    </form>
  );
}
