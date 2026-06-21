"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { Icon } from "@/components/icon";
import { useFormatMoney } from "@/lib/currency-context";

type Item = { id: string; title: string; cost: number };

export function PublicPartyPaymentForm({
  shareToken,
  cardNumber,
  cardHolder,
  items,
}: {
  shareToken: string;
  cardNumber: string | null;
  cardHolder: string | null;
  items: Item[];
}) {
  const formatMoney = useFormatMoney();
  const [guestName, setGuestName] = useState("");
  const [amount, setAmount] = useState("");
  const [wishlistItemId, setWishlistItemId] = useState("");
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
    const res = await fetch(`/api/p/${shareToken}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: guestName.trim(),
        amount: parsedAmount,
        wishlistItemId: wishlistItemId || undefined,
        proofUrl: proofUrl || undefined,
        note: note || undefined,
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
        <p className="text-base font-semibold text-emerald-800">Payment submitted!</p>
        <p className="mt-1 text-sm text-emerald-700">
          The party admin will review and approve your contribution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Icon name="gift" size={15} className="text-muted" />
        Contribute to this party
      </p>

      {cardNumber && (
        <div className="rounded-xl border border-border bg-muted-subtle/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Transfer to</p>
          <p className="font-mono text-lg font-bold tracking-widest text-foreground">{cardNumber}</p>
          {cardHolder && <p className="text-xs text-muted mt-0.5">{cardHolder}</p>}
        </div>
      )}

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

      {items.length > 0 && (
        <div>
          <Label>For which gift? (optional)</Label>
          <select
            className="mt-1.5 h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
            value={wishlistItemId}
            onChange={(e) => setWishlistItemId(e.target.value)}
          >
            <option value="">General contribution</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} — {formatMoney(i.cost)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label>Payment proof (screenshot)</Label>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted mt-1.5"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProof(f); }}
        />
        {uploading && <p className="mt-1 text-xs text-muted animate-pulse">Uploading…</p>}
        {proofUrl && !uploading && <p className="text-xs text-emerald-600 mt-1">✓ Proof uploaded</p>}
      </div>

      <div>
        <Label>Note (optional)</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a message to the birthday person…" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        variant="primary"
        onClick={submit}
        loading={submitting}
        loadingText="Submitting…"
        disabled={uploading}
        className="w-full min-h-12 text-base"
      >
        <Icon name="gift" size={16} className="mr-2 text-white" />
        Submit contribution
      </Button>
    </div>
  );
}
