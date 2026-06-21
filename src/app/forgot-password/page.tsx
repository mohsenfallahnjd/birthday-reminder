"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link } from "@/components/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else { const d = await res.json(); setError(d.error ?? "Error"); }
  }

  return (
    <div className="page flex min-h-[calc(100vh-3.5rem)] flex-col justify-center">
      <h1 className="page-title">Forgot password</h1>
      <p className="page-desc mb-8">Enter your email and we&apos;ll send a reset link.</p>

      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-2xl mb-2">📬</p>
          <p className="font-semibold text-emerald-800">Check your inbox</p>
          <p className="mt-1 text-sm text-emerald-700">If that email is registered, a reset link is on its way.</p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-emerald-700 underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading} loadingText="Sending…">
            Send reset link
          </Button>
          <p className="text-center text-sm text-muted">
            <Link href="/login">Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
