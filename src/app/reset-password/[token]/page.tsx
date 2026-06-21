"use client";

import { useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link } from "@/components/link";
import { useRouter } from "@/lib/navigation";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) { setDone(true); setTimeout(() => router.push("/login"), 2000); }
    else { const d = await res.json(); setError(d.error ?? "Error"); }
  }

  return (
    <div className="page flex min-h-[calc(100vh-3.5rem)] flex-col justify-center">
      <h1 className="page-title">Set new password</h1>
      <p className="page-desc mb-8">Choose a password with at least 6 characters.</p>

      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold text-emerald-800">Password updated!</p>
          <p className="mt-1 text-sm text-emerald-700">Redirecting to login…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Same password again"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading} loadingText="Saving…">
            Set new password
          </Button>
          <p className="text-center text-sm text-muted">
            <Link href="/login">Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
