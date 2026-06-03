"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
      setError(data.error ?? "خطا رخ داد");
      return;
    }

    router.push(search.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <Label htmlFor="name">نام</Label>
          <Input id="name" name="name" required placeholder="مثلاً محسن" />
        </div>
      )}
      <div>
        <Label htmlFor="email">ایمیل</Label>
        <Input id="email" name="email" type="email" required dir="ltr" className="text-left" />
      </div>
      <div>
        <Label htmlFor="password">رمز عبور</Label>
        <Input id="password" name="password" type="password" required minLength={6} dir="ltr" className="text-left" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "صبر کنید..." : mode === "login" ? "ورود" : "ثبت‌نام"}
      </Button>
      <p className="text-center text-sm text-party-ink/60">
        {mode === "login" ? (
          <>
            حساب ندارید؟ <Link href="/register">ثبت‌نام</Link>
          </>
        ) : (
          <>
            قبلاً ثبت‌نام کردید؟ <Link href="/login">ورود</Link>
          </>
        )}
      </p>
    </form>
  );
}
