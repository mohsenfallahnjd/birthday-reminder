"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { WishlistManager } from "@/components/wishlist-manager";
import { Button } from "@/components/ui/button";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { Input, Label, Textarea } from "@/components/ui/input";
import { getFundingPercent, MoneyProgress } from "@/components/ui/money-progress";
import { formatAmount } from "@/lib/money";
import { formatMoney } from "@/lib/utils";
import { Link } from "@/components/link";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function statusLabel(status: string) {
  if (status === "APPROVED") return { text: "Approved", cls: "text-emerald-600 bg-emerald-50" };
  if (status === "REJECTED") return { text: "Rejected", cls: "text-red-600 bg-red-50" };
  if (status === "DEBT")     return { text: "Debt (pending payment)", cls: "text-amber-700 bg-amber-50" };
  return { text: "Pending review", cls: "text-amber-600 bg-amber-50" };
}

// ─── share progress button ────────────────────────────────────────────────────

function ShareProgressButton({
  ceremonyTitle,
  items,
  funding,
}: {
  ceremonyTitle: string;
  items: { title: string; cost: number; payments: { amount: number; status: string }[] }[];
  funding: { collected: number; target: number };
}) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  function buildText() {
    const pct = getFundingPercent(funding.collected, funding.target);
    const lines: string[] = [
      `🎂 ${ceremonyTitle}`,
      `💰 ${formatAmount(funding.collected)} / ${formatAmount(funding.target)} Toman (${pct}% collected)`,
    ];
    if (items.length > 0) {
      lines.push("", "🎁 Wishlist:");
      for (const item of items) {
        const collected = item.payments
          .filter((p) => p.status === "APPROVED")
          .reduce((s, p) => s + p.amount, 0);
        const p = getFundingPercent(collected, item.cost);
        lines.push(`• ${item.title} — ${formatAmount(collected)} / ${formatAmount(item.cost)} Toman (${p}%)`);
      }
    }
    lines.push("", `Help fill the wishlist → ${typeof window !== "undefined" ? window.location.href : ""}`);
    return lines.join("\n");
  }

  async function share() {
    const text = buildText();
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${ceremonyTitle} – Gift Progress`, text, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      <Icon name={state === "copied" ? "copy" : "share"} size={13} className="text-current" />
      {state === "copied" ? "Copied!" : "Share"}
    </button>
  );
}

// ─── types ────────────────────────────────────────────────────────────────────

type WishlistItem = {
  id: string;
  title: string;
  link: string | null;
  ogImage: string | null;
  ogDescription: string | null;
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
  hideContributors: boolean;
  birthdayUser: { id: string; name: string };
  wishlistItems: WishlistItem[];
  payments: Payment[];
};

// ─── main component ───────────────────────────────────────────────────────────

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
  const defaultTab = isBirthdayPerson ? "gifts" : canEditWishlist ? "wishlist" : "pay";
  const [tab, setTab] = useState<"wishlist" | "pay" | "admin" | "gifts">(defaultTab);

  const partyItems = ceremony.wishlistItems.filter(
    (i) => i.ceremonyId === ceremony.id || i.ceremonyId === null,
  );
  const funding = partyFunding(partyItems);

  const tabs = [
    ...(isBirthdayPerson ? [{ id: "gifts" as const, label: "🎁 My gifts" }] : []),
    { id: "wishlist" as const, label: "Wishlist" },
    ...(!isBirthdayPerson ? [{ id: "pay" as const, label: "Contribute" }] : []),
    ...(isAdmin ? [{ id: "admin" as const, label: "Treasurer" }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Funding progress */}
      {partyItems.length > 0 && funding.target > 0 && (
        <div className="rounded-xl border border-border bg-white/80 p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Party gift progress</p>
              <p className="mt-0.5 text-xs text-muted">Approved contributions toward wishlist totals</p>
            </div>
            <ShareProgressButton
              ceremonyTitle={ceremony.title}
              items={partyItems}
              funding={funding}
            />
          </div>
          <MoneyProgress
            className="mt-3"
            collected={funding.collected}
            target={funding.target}
            label="Total raised"
          />
        </div>
      )}

      {/* Role banners */}
      {canEditWishlist && (
        <div className="rounded-xl border border-border shadow-sm bg-muted-subtle p-4 text-sm">
          <p className="font-medium text-foreground">
            {isBirthdayPerson ? "You are the birthday holder 🎂" : "You are a party admin"}
          </p>
          <p className="mt-1 text-muted">
            Add gift or party-cost items under <strong>Wishlist</strong>.
            {isBirthdayPerson && (
              <> Or pre-fill on <Link href="/wishlist">My wishlist</Link> and attach them here.</>
            )}
          </p>
        </div>
      )}
      {isAdmin && !isBirthdayPerson && (
        <div className="rounded-xl border border-border shadow-sm bg-muted-subtle p-4 text-sm">
          <p className="font-medium text-foreground">Treasurer (admin)</p>
          <p className="mt-1 text-muted">
            Approve payments and manage settings under the Treasurer tab.
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div className="-mx-1 flex max-w-full overflow-x-auto pb-1">
        <div className="inline-flex shrink-0 gap-1 rounded-md border border-border bg-muted-subtle p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                tab === t.id
                  ? "bg-white text-foreground shadow-sm font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card info banner (Contribute tab) */}
      {ceremony.cardNumber && tab === "pay" && (
        <div className="rounded-xl border border-border shadow-sm px-4 py-3 text-sm text-muted bg-white">
          <p className="text-xs font-medium uppercase tracking-wide mb-1 text-muted">Transfer to</p>
          <p className="font-mono text-foreground text-base tracking-widest">
            {ceremony.cardNumber}
          </p>
          {ceremony.cardHolder && <p className="text-xs mt-0.5">{ceremony.cardHolder}</p>}
        </div>
      )}

      {/* ── Gifts tab (birthday person) ── */}
      {tab === "gifts" && (
        <GiftsSection
          payments={ceremony.payments}
          hideContributors={ceremony.hideContributors}
          isBirthdayPerson={isBirthdayPerson}
          currentUserId={currentUserId}
        />
      )}

      {/* ── Wishlist tab ── */}
      {tab === "wishlist" && (
        <div className="space-y-4">
          {partyItems.length > 0 && (
            <ul className="space-y-3">
              {partyItems.map((item) => {
                const approved = approvedTotal(item);
                return (
                  <li key={item.id} className="rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="flex gap-3">
                      {item.ogImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.ogImage}
                          alt={item.title}
                          className="h-24 w-24 object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div className="p-4 flex-1 min-w-0">
                        <p className="font-semibold">{item.title}</p>
                        {item.ogDescription && (
                          <p className="text-xs text-muted line-clamp-1 mt-0.5">{item.ogDescription}</p>
                        )}
                        {item.link && (
                          <a href={item.link} className="text-xs text-accent underline mt-0.5 inline-block" target="_blank" rel="noreferrer">
                            View link →
                          </a>
                        )}
                        <p className="mt-2 text-sm tabular-nums text-muted">{formatMoney(item.cost)} goal</p>
                        {item.allowCheapIn && (
                          <span className="mt-1 inline-block rounded-full bg-muted-subtle px-2 py-0.5 text-xs">
                            Pay what you can
                          </span>
                        )}
                        <MoneyProgress className="mt-3" collected={approved} target={item.cost} label="Collected" size="sm" />
                      </div>
                    </div>
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

      {/* ── Contribute tab ── */}
      {tab === "pay" && (
        <PaymentSection
          ceremonyId={ceremony.id}
          items={partyItems}
          payments={ceremony.payments.filter((p) => p.payer.id === currentUserId)}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* ── Treasurer tab ── */}
      {tab === "admin" && isAdmin && (
        <AdminSection
          ceremonyId={ceremony.id}
          cardNumber={ceremony.cardNumber}
          cardHolder={ceremony.cardHolder}
          hideContributors={ceremony.hideContributors}
          payments={ceremony.payments}
          onUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}

// ─── Gifts tab (birthday person view) ────────────────────────────────────────

function GiftsSection({
  payments,
  hideContributors,
  isBirthdayPerson,
  currentUserId: _currentUserId,
}: {
  payments: Payment[];
  hideContributors: boolean;
  isBirthdayPerson: boolean;
  currentUserId: string;
}) {
  const approved = payments.filter((p) => p.status === "APPROVED");
  const total = approved.reduce((s, p) => s + p.amount, 0);

  if (!isBirthdayPerson) return null;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-accent/10 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">Total collected for you</p>
        <p className="text-3xl font-bold text-foreground">{formatMoney(total)}</p>
        <p className="text-xs text-muted mt-1">{approved.length} approved contribution{approved.length !== 1 ? "s" : ""}</p>
      </div>

      {approved.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">No contributions yet.</p>
      ) : (
        <ul className="space-y-2">
          {approved.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                  {hideContributors ? "?" : p.payer.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {hideContributors ? "Anonymous contributor" : p.payer.name}
                  </p>
                  {p.note && !hideContributors && (
                    <p className="text-xs text-muted">{p.note}</p>
                  )}
                </div>
              </div>
              <span className="flex-shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {formatMoney(p.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hideContributors && (
        <p className="text-center text-xs text-muted">
          🔒 Contributor names are hidden by the party admin.
        </p>
      )}
    </div>
  );
}

// ─── Contribute tab ───────────────────────────────────────────────────────────

function PaymentSection({
  ceremonyId,
  items,
  payments,
  onRefresh,
}: {
  ceremonyId: string;
  items: WishlistItem[];
  payments: Payment[];
  onRefresh: () => void;
}) {
  const [mode, setMode] = useState<"pay" | "debt">("pay");
  const [amount, setAmount] = useState("");
  const [wishlistItemId, setWishlistItemId] = useState("");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const [settleProofUrl, setSettleProofUrl] = useState<Record<string, string>>({});
  const [settleUploading, setSettleUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function uploadProof(file: File, onDone: (url: string) => void) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) onDone(data.url);
    else setError(data.error ?? "Upload failed");
  }

  async function submit() {
    setError("");
    const parsedAmount = getAmountFromInput(amount);
    if (!parsedAmount) { setError("Enter a valid amount."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/ceremonies/${ceremonyId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        wishlistItemId: wishlistItemId || undefined,
        proofUrl: mode === "pay" ? (proofUrl || undefined) : undefined,
        note: note || undefined,
        isDebt: mode === "debt",
      }),
    });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Could not submit"); return; }
    setAmount(""); setNote(""); setProofUrl(""); setWishlistItemId("");
    onRefresh();
  }

  async function settleDebt(paymentId: string) {
    setSettling(paymentId);
    const res = await fetch(`/api/ceremonies/${ceremonyId}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settle: true,
        proofUrl: settleProofUrl[paymentId] || undefined,
      }),
    });
    setSettling(null);
    if (res.ok) onRefresh();
    else { const d = await res.json(); setError(d.error ?? "Could not settle"); }
  }

  const myDebts = payments.filter((p) => p.status === "DEBT");
  const myOther = payments.filter((p) => p.status !== "DEBT");

  return (
    <div className="space-y-6">
      {/* ── Mode picker ── */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-border">
          <button
            type="button"
            onClick={() => setMode("pay")}
            className={`flex flex-col items-center gap-1 px-4 py-4 text-sm transition-colors ${
              mode === "pay" ? "bg-accent/5 text-accent font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            <span className="text-xl">💳</span>
            <span>Pay now</span>
            <span className="text-xs font-normal text-muted">Upload proof of transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("debt")}
            className={`flex flex-col items-center gap-1 px-4 py-4 text-sm transition-colors ${
              mode === "debt" ? "bg-amber-50 text-amber-700 font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            <span className="text-xl">🤝</span>
            <span>Pledge (pay later)</span>
            <span className="text-xs font-normal text-muted">Record a debt, settle later</span>
          </button>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-sm">
        {mode === "debt" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            💡 Your pledge will be recorded as a debt. You can settle it later by uploading payment proof.
          </div>
        )}

        <div>
          <Label>Amount (Toman)</Label>
          <MoneyInput value={amount} onValueChange={setAmount} placeholder="500,000" />
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
              {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </div>
        )}

        {mode === "pay" && (
          <div>
            <Label>Payment proof (screenshot)</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setUploading(true); uploadProof(f, (url) => { setProofUrl(url); setUploading(false); }); }
              }}
              className="block w-full text-sm text-muted"
            />
            {uploading && <p className="mt-1 text-xs text-muted animate-pulse">Uploading…</p>}
            {proofUrl && !uploading && <p className="text-xs text-emerald-600 mt-1">✓ Proof uploaded</p>}
          </div>
        )}

        <div>
          <Label>Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a message…" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="button"
          onClick={submit}
          loading={submitting}
          loadingText="Submitting…"
          disabled={uploading}
          className={mode === "debt" ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" : ""}
        >
          {mode === "debt" ? "🤝 Record pledge" : "💳 Submit payment"}
        </Button>
      </div>

      {/* ── My debts ── */}
      {myDebts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            <span>🤝</span> Your pending debts
          </p>
          {myDebts.map((p) => (
            <div key={p.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-800">{formatMoney(p.amount)}</p>
                  {p.note && <p className="text-xs text-amber-700">{p.note}</p>}
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Debt</span>
              </div>
              <div>
                <p className="text-xs text-amber-700 mb-1">Upload proof to settle this debt:</p>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-xs text-muted mb-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setSettleUploading(p.id);
                    uploadProof(f, (url) => {
                      setSettleProofUrl((prev) => ({ ...prev, [p.id]: url }));
                      setSettleUploading(null);
                    });
                  }}
                />
                {settleUploading === p.id && <p className="text-xs text-muted animate-pulse">Uploading…</p>}
                {settleProofUrl[p.id] && <p className="text-xs text-emerald-600 mb-2">✓ Proof ready</p>}
                <Button
                  size="sm"
                  type="button"
                  loading={settling === p.id}
                  loadingText="Settling…"
                  disabled={settleUploading === p.id}
                  onClick={() => settleDebt(p.id)}
                >
                  Settle debt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Other payments ── */}
      {myOther.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Your contributions</p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            {myOther.map((p) => {
              const s = statusLabel(p.status);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">{formatMoney(p.amount)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Treasurer/Admin tab ──────────────────────────────────────────────────────

function AdminSection({
  ceremonyId,
  cardNumber: initialCard,
  cardHolder: initialHolder,
  hideContributors: initialHide,
  payments,
  onUpdate,
}: {
  ceremonyId: string;
  cardNumber: string | null;
  cardHolder: string | null;
  hideContributors: boolean;
  payments: Payment[];
  onUpdate: () => void;
}) {
  const [cardNumber, setCardNumber] = useState(initialCard ?? "");
  const [cardHolder, setCardHolder] = useState(initialHolder ?? "");
  const [hideContributors, setHideContributors] = useState(initialHide);
  const [savingCard, setSavingCard] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
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

  async function toggleVisibility(val: boolean) {
    setHideContributors(val);
    setSavingVisibility(true);
    await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hideContributors: val }),
    });
    setSavingVisibility(false);
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
    const res = await fetch(`/api/ceremonies/${ceremonyId}/notify-unpaid`, { method: "POST" });
    const data = await res.json();
    setNotifying(false);
    alert(`Notified ${data.notified ?? 0} people`);
  }

  const debts = payments.filter((p) => p.status === "DEBT");
  const pending = payments.filter((p) => p.status === "PENDING");
  const reviewed = payments.filter((p) => p.status === "APPROVED" || p.status === "REJECTED");
  const approvedCount = new Set(
    payments.filter((p) => p.status === "APPROVED").map((p) => p.payer.id),
  ).size;

  return (
    <div className="space-y-6">

      {/* ── Contributor visibility toggle ── */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-4">
        <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          👀 Contributor visibility
        </p>
        <p className="text-xs text-muted mb-3">
          Control whether the birthday person sees who paid for them.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleVisibility(false)}
            disabled={savingVisibility}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm transition-all ${
              !hideContributors
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                : "border-border text-muted hover:border-foreground/30"
            }`}
          >
            <span className="block text-lg mb-0.5">👤</span>
            Show names
          </button>
          <button
            type="button"
            onClick={() => toggleVisibility(true)}
            disabled={savingVisibility}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm transition-all ${
              hideContributors
                ? "border-amber-400 bg-amber-50 text-amber-700 font-semibold shadow-sm"
                : "border-border text-muted hover:border-foreground/30"
            }`}
          >
            <span className="block text-lg mb-0.5">🕵️</span>
            Hide names
          </button>
        </div>
        {savingVisibility && <p className="text-xs text-muted mt-2 animate-pulse">Saving…</p>}
      </div>

      {/* ── Debts ── */}
      {debts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            🤝 Debt pledges
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs">{debts.length}</span>
          </p>
          <ul className="space-y-2">
            {debts.map((p) => (
              <li key={p.id} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{p.payer.name}</p>
                    {p.note && <p className="text-xs text-muted">{p.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-700">{formatMoney(p.amount)}</p>
                    <p className="text-xs text-amber-600">Owes this amount</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Pending payments ── */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            ⏳ Awaiting approval
            <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs">{pending.length}</span>
          </p>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{p.payer.name}</p>
                    {p.note && <p className="text-xs text-muted">{p.note}</p>}
                  </div>
                  <p className="font-semibold text-accent">{formatMoney(p.amount)}</p>
                </div>
                {p.proofUrl && (
                  <a href={p.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-foreground underline">
                    📎 View proof
                  </a>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="success" loading={reviewingId === p.id} loadingText="…" onClick={() => review(p.id, "APPROVED")}>
                    ✓ Approve
                  </Button>
                  <Button size="sm" variant="danger" loading={reviewingId === p.id} loadingText="…" onClick={() => review(p.id, "REJECTED")}>
                    ✗ Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Reviewed payments ── */}
      {reviewed.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">Reviewed ({approvedCount} approved payers)</p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            {reviewed.map((p) => {
              const s = statusLabel(p.status);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{p.payer.name}</p>
                    {p.note && <p className="text-xs text-muted">{p.note}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium">{formatMoney(p.amount)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.text}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Treasurer card ── */}
      <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Treasurer card</p>
        <Input placeholder="Card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="font-mono" />
        <Input placeholder="Account holder name" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
        <Button type="button" variant="outline" onClick={saveCard} loading={savingCard} loadingText="Saving…">
          Save card
        </Button>
      </div>

      <Button type="button" variant="outline" onClick={notifyUnpaid} loading={notifying} loadingText="Sending…">
        📣 Notify people who have not paid
      </Button>
    </div>
  );
}
