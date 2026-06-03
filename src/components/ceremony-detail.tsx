"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WishlistManager } from "@/components/wishlist-manager";
import { Button } from "@/components/ui/button";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { Link } from "@/components/link";

type WishlistItem = {
  id: string;
  title: string;
  link: string | null;
  cost: number;
  allowCheapIn: boolean;
  ceremonyId: string | null;
  payments: { amount: number; status: string; payer: { name: string } }[];
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  proofUrl: string | null;
  note: string | null;
  payer: { id: string; name: string };
  wishlistItemId: string | null;
};

type Ceremony = {
  id: string;
  title: string;
  cardNumber: string | null;
  cardHolder: string | null;
  adminUserId: string | null;
  birthdayUser: { id: string; name: string };
  wishlistItems: WishlistItem[];
  payments: Payment[];
};

export function CeremonyDetail({
  ceremony,
  currentUserId,
  isAdmin,
  isBirthdayPerson,
}: {
  ceremony: Ceremony;
  currentUserId: string;
  isAdmin: boolean;
  isBirthdayPerson: boolean;
}) {
  const router = useRouter();
  const defaultTab = isBirthdayPerson ? "wishlist" : "pay";
  const [tab, setTab] = useState<"wishlist" | "pay" | "admin">(defaultTab);

  const partyItems = ceremony.wishlistItems.filter(
    (i) => i.ceremonyId === ceremony.id || i.ceremonyId === null,
  );

  const tabs = [
    { id: "wishlist" as const, label: "Wishlist" },
    { id: "pay" as const, label: "Contribute" },
    ...(isAdmin ? [{ id: "admin" as const, label: "Treasurer" }] : []),
  ];

  return (
    <div className="space-y-6">
      {isBirthdayPerson && (
        <div className="rounded-lg border border-border bg-muted-subtle p-4 text-sm">
          <p className="font-medium text-foreground">You are the birthday person</p>
          <p className="mt-1 text-muted">
            Add items under <strong>Wishlist</strong>, or pre-fill on{" "}
            <Link href="/wishlist">My wishlist</Link> and attach them to this party.
          </p>
        </div>
      )}

      <div className="inline-flex gap-1 rounded-md border border-border bg-muted-subtle p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              tab === t.id
                ? "bg-white text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ceremony.cardNumber && tab === "pay" && (
        <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
          <p>
            Card <span className="font-mono text-foreground">{ceremony.cardNumber}</span>
          </p>
          {ceremony.cardHolder && <p>Account name: {ceremony.cardHolder}</p>}
        </div>
      )}

      {tab === "wishlist" && (
        <div className="space-y-4">
          {partyItems.length > 0 && (
            <ul className="space-y-3">
              {partyItems.map((item) => {
                const approved = item.payments
                  .filter((p) => p.status === "APPROVED")
                  .reduce((s, p) => s + p.amount, 0);
                return (
                  <li key={item.id} className="rounded-lg border border-border p-4">
                    <p className="font-bold">{item.title}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        className="text-sm text-foreground underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View link
                      </a>
                    )}
                    <p className="mt-1 text-sm">{formatMoney(item.cost)}</p>
                    {item.allowCheapIn && (
                      <span className="mt-2 inline-block rounded-full bg-muted-subtle px-2 py-0.5 text-xs">
                        Pay what you can
                      </span>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      Collected (approved): {formatMoney(approved)} / {formatMoney(item.cost)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {isBirthdayPerson ? (
            <WishlistManager
              items={partyItems}
              ceremonyId={ceremony.id}
              ceremonies={[{ id: ceremony.id, title: ceremony.title }]}
              canEdit
            />
          ) : partyItems.length === 0 ? (
            <p className="text-sm text-muted">No wishlist items for this party yet.</p>
          ) : null}
        </div>
      )}

      {tab === "pay" && (
        <PaymentSection
          ceremonyId={ceremony.id}
          items={partyItems}
          payments={ceremony.payments.filter((p) => p.payer.id === currentUserId)}
        />
      )}

      {tab === "admin" && isAdmin && (
        <AdminSection
          ceremonyId={ceremony.id}
          payments={ceremony.payments}
          onUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}

function PaymentSection({
  ceremonyId,
  items,
  payments,
}: {
  ceremonyId: string;
  items: WishlistItem[];
  payments: Payment[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [wishlistItemId, setWishlistItemId] = useState("");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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

  async function submitPayment() {
    setError("");
    const parsedAmount = getAmountFromInput(amount);
    if (!parsedAmount) {
      setError("Enter a valid amount.");
      return;
    }

    const res = await fetch(`/api/ceremonies/${ceremonyId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        wishlistItemId: wishlistItemId || undefined,
        proofUrl: proofUrl || undefined,
        note: note || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not submit payment");
      return;
    }
    setAmount("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Transfer any amount you can, then upload proof. The treasurer will approve it.
      </p>

      <div className="space-y-3 border-t border-border pt-6">
        <div>
          <Label>Amount (Toman)</Label>
          <MoneyInput
            value={amount}
            onValueChange={setAmount}
            placeholder="500,000"
          />
        </div>
        {items.length > 0 && (
          <div>
            <Label>For which item? (optional)</Label>
            <select
              className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
              value={wishlistItemId}
              onChange={(e) => setWishlistItemId(e.target.value)}
            >
              <option value="">General / pay what you can</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadProof(f);
            }}
          />
          {uploading && <p className="text-xs">Uploading…</p>}
          {proofUrl && <p className="text-xs text-emerald-600">Proof uploaded</p>}
        </div>
        <div>
          <Label>Note</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={submitPayment}>Submit payment</Button>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Your payments</p>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments submitted yet.</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {payments.map((p) => (
              <li key={p.id} className="py-2 text-sm">
                {formatMoney(p.amount)} —{" "}
                <span
                  className={
                    p.status === "APPROVED"
                      ? "text-emerald-600"
                      : p.status === "REJECTED"
                        ? "text-red-600"
                        : "text-amber-600"
                  }
                >
                  {p.status === "APPROVED"
                    ? "Approved"
                    : p.status === "REJECTED"
                      ? "Rejected"
                      : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AdminSection({
  ceremonyId,
  payments,
  onUpdate,
}: {
  ceremonyId: string;
  payments: Payment[];
  onUpdate: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  async function saveCard() {
    await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber, cardHolder }),
    });
    onUpdate();
  }

  async function review(paymentId: string, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/ceremonies/${ceremonyId}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  }

  async function notifyUnpaid() {
    const res = await fetch(`/api/ceremonies/${ceremonyId}/notify-unpaid`, {
      method: "POST",
    });
    const data = await res.json();
    alert(`Notified ${data.notified ?? 0} people`);
  }

  const approvedCount = new Set(
    payments.filter((p) => p.status === "APPROVED").map((p) => p.payer.id),
  ).size;

  return (
    <div className="space-y-6">
      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-sm font-medium text-foreground">Treasurer card</p>
        <Input
          placeholder="Card number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
        <Input
          placeholder="Account holder name"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
        />
        <Button variant="outline" onClick={saveCard}>
          Save card
        </Button>
      </div>

      <Button onClick={notifyUnpaid}>
        Notify people who have not paid
      </Button>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Payments</p>
        <ul className="divide-y divide-border border-t border-border">
          {payments.map((p) => (
            <li key={p.id} className="py-4 text-sm">
              <p className="font-medium">{p.payer.name}</p>
              <p>{formatMoney(p.amount)}</p>
              {p.proofUrl && (
                <a
                  href={p.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-foreground"
                >
                  View proof
                </a>
              )}
              {p.note && <p className="text-xs text-muted">{p.note}</p>}
              <p className="text-sm mt-1">Status: {p.status}</p>
              {p.status === "PENDING" && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="success" onClick={() => review(p.id, "APPROVED")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => review(p.id, "REJECTED")}>
                    Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted">
        Approved payers: {approvedCount}
      </p>
    </div>
  );
}
