"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { Icon } from "@/components/icon";

export function ProfilePaymentForm({ profileToken }: { profileToken: string }) {
  const [guestName, setGuestName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function uploadProof(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setProofUrl(data.url);
    else setError(data.error ?? "Upload failed");
  }

  async function submit() {
    setError("");
    if (!guestName.trim()) { setError("Please enter your name."); return; }
    const parsedAmount = getAmountFromInput(amount);
    if (!parsedAmount) { setError("Enter a valid amount."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/u/${profileToken}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: guestName.trim(),
        amount: parsedAmount,
        note: note || undefined,
        proofUrl: proofUrl || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Could not submit"); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
        <div className="mb-3 text-4xl">🎉</div>
        <p className="text-base font-semibold text-emerald-800">Thank you!</p>
        <p className="mt-1 text-sm text-emerald-700">Your gift contribution has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Icon name="gift" size={15} className="text-muted" />
        Send a gift contribution
      </p>

      <div>
        <Label>Your name</Label>
        <Input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="e.g. Ali Rezaei"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Amount (Toman)</Label>
        <MoneyInput value={amount} onValueChange={setAmount} placeholder="500,000" />
      </div>

      <div>
        <Label>Note (optional)</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Leave a message…"
        />
      </div>

      <div>
        <Label>Payment proof (optional)</Label>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted mt-1.5"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProof(f); }}
        />
        {uploading && <p className="mt-1 text-xs text-muted animate-pulse">Uploading…</p>}
        {proofUrl && !uploading && <p className="text-xs text-emerald-600 mt-1">✓ Proof uploaded</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        variant="primary"
        onClick={submit}
        loading={submitting}
        loadingText="Sending…"
        disabled={uploading}
        className="w-full min-h-12 text-base"
      >
        <Icon name="gift" size={16} className="mr-2 text-white" />
        Send gift
      </Button>
    </div>
  );
}
