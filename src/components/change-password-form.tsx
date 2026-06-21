"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) { setMsg({ text: "Passwords don't match", ok: false }); return; }
    if (next.length < 6) { setMsg({ text: "Min 6 characters", ok: false }); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    const d = await res.json();
    if (res.ok) {
      setMsg({ text: "Password updated", ok: true });
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      setMsg({ text: d.error ?? "Error", ok: false });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Current password</Label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div>
        <Label>New password</Label>
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
      </div>
      <div>
        <Label>Confirm new password</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
      </div>
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {msg.ok ? "✓ " : ""}{msg.text}
        </p>
      )}
      <Button type="submit" size="sm" loading={loading} loadingText="Saving…">
        Update password
      </Button>
    </form>
  );
}
