"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { WishlistManager } from "@/components/wishlist-manager";
import { Button } from "@/components/ui/button";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MoneyProgress } from "@/components/ui/money-progress";
import { formatMoney } from "@/lib/utils";
import { Link } from "@/components/link";

function approvedTotal(item: WishlistItem) {
  return item.payments
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + p.amount, 0);
}

function partyFunding(items: WishlistItem[]) {
  const target = items.reduce((s, i) => s + i.cost, 0);
  const collected = items.reduce((s, i) => s + approvedTotal(i), 0);
  return { collected, target };
}

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
  canEditWishlist,
}: {
  ceremony: Ceremony;
  currentUserId: string;
  isAdmin: boolean;
  isBirthdayPerson: boolean;
  canEditWishlist: boolean;
}) {
  const router = useRouter();
  const defaultTab = canEditWishlist ? "wishlist" : "pay";
  const [tab, setTab] = useState<"wishlist" | "pay" | "admin">(defaultTab);

  const partyItems = ceremony.wishlistItems.filter(
    (i) => i.ceremonyId === ceremony.id || i.ceremonyId === null,
  );
  const funding = partyFunding(partyItems);

  const tabs = [
    { id: "wishlist" as const, label: "Wishlist" },
    { id: "pay" as const, label: "Contribute" },
    ...(isAdmin ? [{ id: "admin" as const, label: "Treasurer" }] : []),
  ];

  return (
    <div className="space-y-6">
      {partyItems.length > 0 && funding.target > 0 && (
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-medium text-foreground">Party gift progress</p>
          <p className="mt-0.5 text-xs text-muted">Approved contributions toward wishlist totals</p>
          <MoneyProgress
            className="mt-3"
            collected={funding.collected}
            target={funding.target}
            label="Total raised"
          />
        </div>
      )}

      {canEditWishlist && (
        <div className="rounded-lg border border-border bg-muted-subtle p-4 text-sm">
          <p className="font-medium text-foreground">
            {isBirthdayPerson ? "You are the birthday holder" : "You are a party admin"}
          </p>
          <p className="mt-1 text-muted">
            Add gift or party-cost items under <strong>Wishlist</strong>.
            {isBirthdayPerson && (
              <>
                {" "}
                Or pre-fill on <Link href="/wishlist">My wishlist</Link> and attach them here.
              </>
            )}
          </p>
        </div>
      )}
      {isAdmin && !isBirthdayPerson && (
        <div className="rounded-lg border border-border bg-muted-subtle p-4 text-sm">
          <p className="font-medium text-foreground">Treasurer (admin)</p>
          <p className="mt-1 text-muted">
            Approve payments and set the shared card under the Treasurer tab.
          </p>
        </div>
      )}

      <div className="-mx-1 flex max-w-full overflow-x-auto pb-1">
        <div className="inline-flex shrink-0 gap-1 rounded-md border border-border bg-muted-subtle p-1">
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
                const approved = approvedTotal(item);
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
                    <p className="mt-1 text-sm tabular-nums">{formatMoney(item.cost)} goal</p>
                    {item.allowCheapIn && (
                      <span className="mt-2 inline-block rounded-full bg-muted-subtle px-2 py-0.5 text-xs">
                        Pay what you can
                      </span>
                    )}
                    <MoneyProgress
                      className="mt-3"
                      collected={approved}
                      target={item.cost}
                      label="Collected"
                      size="sm"
                    />
                  </li>
                );
              })}
            </ul>
          )}
          {canEditWishlist ? (
            <WishlistManager
              items={partyItems}
              ceremonyId={ceremony.id}
              ceremonies={[{ id: ceremony.id, title: ceremony.title }]}
              canEdit
              birthdayUserId={ceremony.birthdayUser.id}
              actAsAdmin={isAdmin && !isBirthdayPerson}
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
          cardNumber={ceremony.cardNumber}
          cardHolder={ceremony.cardHolder}
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
  const [submitting, setSubmitting] = useState(false);
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

    setSubmitting(true);
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
    setSubmitting(false);
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
          {uploading && (
            <p className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted border-r-transparent" />
              Uploading proof…
            </p>
          )}
          {proofUrl && !uploading && (
            <p className="text-xs text-emerald-600">Proof uploaded</p>
          )}
        </div>
        <div>
          <Label>Note</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="button"
          onClick={submitPayment}
          loading={submitting}
          loadingText="Submitting…"
          disabled={uploading}
        >
          Submit payment
        </Button>
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
  cardNumber: initialCard,
  cardHolder: initialHolder,
  payments,
  onUpdate,
}: {
  ceremonyId: string;
  cardNumber: string | null;
  cardHolder: string | null;
  payments: Payment[];
  onUpdate: () => void;
}) {
  const [cardNumber, setCardNumber] = useState(initialCard ?? "");
  const [cardHolder, setCardHolder] = useState(initialHolder ?? "");
  const [savingCard, setSavingCard] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function saveCard() {
    setSavingCard(true);
    await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber, cardHolder }),
    });
    setSavingCard(false);
    onUpdate();
  }

  async function review(paymentId: string, status: "APPROVED" | "REJECTED") {
    setReviewingId(paymentId);
    await fetch(`/api/ceremonies/${ceremonyId}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setReviewingId(null);
    onUpdate();
  }

  async function notifyUnpaid() {
    setNotifying(true);
    const res = await fetch(`/api/ceremonies/${ceremonyId}/notify-unpaid`, {
      method: "POST",
    });
    const data = await res.json();
    setNotifying(false);
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
        <Button
          type="button"
          variant="outline"
          onClick={saveCard}
          loading={savingCard}
          loadingText="Saving…"
        >
          Save card
        </Button>
      </div>

      <Button
        type="button"
        onClick={notifyUnpaid}
        loading={notifying}
        loadingText="Sending…"
      >
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
                  <Button
                    type="button"
                    size="sm"
                    variant="success"
                    loading={reviewingId === p.id}
                    loadingText="…"
                    onClick={() => review(p.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    loading={reviewingId === p.id}
                    loadingText="…"
                    onClick={() => review(p.id, "REJECTED")}
                  >
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
