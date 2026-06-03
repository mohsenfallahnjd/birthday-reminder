"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatToman } from "@/lib/utils";
import { Icon } from "@/components/icon";

type WishlistItem = {
  id: string;
  title: string;
  link: string | null;
  cost: number;
  allowCheapIn: boolean;
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
}: {
  ceremony: Ceremony;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"wishlist" | "pay" | "admin">("wishlist");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["wishlist", "pay", ...(isAdmin ? ["admin"] : [])] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-gradient-to-r from-party-pink to-party-fuchsia text-white"
                : "bg-white/80 text-party-ink/70"
            }`}
          >
            {t === "wishlist" ? "لیست آرزو" : t === "pay" ? "پرداخت" : "ادمین مالی"}
          </button>
        ))}
      </div>

      {ceremony.cardNumber && (
        <div className="rounded-2xl border border-party-yellow/40 bg-party-yellow/15 p-4 text-sm">
          <Icon name="card" className="mb-2" />
          <p>
            کارت: <span dir="ltr" className="font-mono font-bold">{ceremony.cardNumber}</span>
          </p>
          {ceremony.cardHolder && <p>به نام: {ceremony.cardHolder}</p>}
        </div>
      )}

      {tab === "wishlist" && (
        <WishlistSection
          ceremonyId={ceremony.id}
          items={ceremony.wishlistItems}
          canEdit={ceremony.birthdayUser.id === currentUserId}
        />
      )}
      {tab === "pay" && (
        <PaymentSection
          ceremonyId={ceremony.id}
          items={ceremony.wishlistItems}
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

function WishlistSection({
  ceremonyId,
  items,
  canEdit,
}: {
  ceremonyId: string;
  items: WishlistItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [cost, setCost] = useState("");
  const [cheapIn, setCheapIn] = useState(false);

  async function addItem() {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        link: link || undefined,
        cost: Number(cost),
        allowCheapIn: cheapIn,
        ceremonyId,
      }),
    });
    setTitle("");
    setLink("");
    setCost("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const approved = item.payments
          .filter((p) => p.status === "APPROVED")
          .reduce((s, p) => s + p.amount, 0);
        return (
          <div key={item.id} className="rounded-2xl bg-white/80 p-4 shadow-md">
            <p className="font-bold">{item.title}</p>
            {item.link && (
              <a href={item.link} className="text-sm text-party-fuchsia underline" target="_blank" rel="noreferrer">
                لینک کالا
              </a>
            )}
            <p className="mt-1 text-sm">{formatToman(item.cost)}</p>
            {item.allowCheapIn && (
              <span className="mt-2 inline-block rounded-full bg-party-yellow/30 px-2 py-0.5 text-xs">
                cheap-in مجاز — هر مبلغی OK
              </span>
            )}
            <p className="mt-2 text-xs text-party-ink/50">
              جمع تأییدشده: {formatToman(approved)} از {formatToman(item.cost)}
            </p>
          </div>
        );
      })}

      {canEdit && (
        <div className="rounded-2xl border-2 border-dashed border-party-pink/30 p-4 space-y-3">
          <p className="font-semibold flex items-center gap-2">
            <Icon name="gift" />
            افزودن به لیست آرزو
          </p>
          <Input placeholder="عنوان هدیه" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="لینک (اختیاری)" value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" className="text-left" />
          <Input placeholder="قیمت (تومان)" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cheapIn} onChange={(e) => setCheapIn(e.target.checked)} />
            cheap-in — دوستان هر مبلغی که توانستند بدهند
          </label>
          <Button onClick={addItem}>افزودن</Button>
        </div>
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

  async function uploadProof(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setProofUrl(data.url);
  }

  async function submitPayment() {
    await fetch(`/api/ceremonies/${ceremonyId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        wishlistItemId: wishlistItemId || undefined,
        proofUrl: proofUrl || undefined,
        note: note || undefined,
      }),
    });
    setAmount("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-party-ink/60">
        هر مبلغی که می‌توانی واریز کن و رسید آپلود کن. ادمین تأیید می‌کند.
      </p>

      <div className="space-y-3 rounded-2xl bg-white/80 p-4">
        <div>
          <Label>مبلغ (تومان)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        {items.length > 0 && (
          <div>
            <Label>برای کدام آیتم؟ (اختیاری)</Label>
            <select
              className="w-full rounded-xl border-2 border-party-pink/20 bg-white px-4 py-3"
              value={wishlistItemId}
              onChange={(e) => setWishlistItemId(e.target.value)}
            >
              <option value="">عمومی / cheap-in</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label>رسید پرداخت</Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadProof(f);
            }}
          />
          {uploading && <p className="text-xs">در حال آپلود...</p>}
          {proofUrl && <p className="text-xs text-emerald-600">رسید آپلود شد</p>}
        </div>
        <div>
          <Label>یادداشت</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button onClick={submitPayment} className="w-full">
          <Icon name="wallet" size={18} />
          ثبت پرداخت
        </Button>
      </div>

      <div>
        <p className="font-semibold mb-2">پرداخت‌های شما</p>
        {payments.length === 0 ? (
          <p className="text-sm text-party-ink/50">هنوز پرداختی ثبت نکرده‌اید.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="rounded-xl bg-party-cream/50 px-3 py-2 text-sm">
                {formatToman(p.amount)} —{" "}
                <span
                  className={
                    p.status === "APPROVED"
                      ? "text-emerald-600"
                      : p.status === "REJECTED"
                        ? "text-red-600"
                        : "text-amber-600"
                  }
                >
                  {p.status === "APPROVED" ? "تأیید" : p.status === "REJECTED" ? "رد" : "در انتظار"}
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
    const res = await fetch(`/api/ceremonies/${ceremonyId}/notify-unpaid`, { method: "POST" });
    const data = await res.json();
    alert(`${data.notified ?? 0} نفر اعلان گرفتند`);
  }

  const payerIds = new Set(
    payments.filter((p) => p.status === "APPROVED").map((p) => p.payer.id),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-4 space-y-3">
        <p className="font-semibold">تنظیم کارت</p>
        <Input placeholder="شماره کارت" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} dir="ltr" className="text-left" />
        <Input placeholder="نام صاحب کارت" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
        <Button variant="outline" onClick={saveCard}>
          ذخیره کارت
        </Button>
      </div>

      <Button variant="party" onClick={notifyUnpaid}>
        اعلان به کسانی که نپرداختند
      </Button>

      <div>
        <p className="font-semibold mb-2">تأیید پرداخت‌ها</p>
        <ul className="space-y-3">
          {payments.map((p) => (
            <li key={p.id} className="rounded-2xl border border-party-pink/10 bg-white p-4">
              <p className="font-medium">{p.payer.name}</p>
              <p>{formatToman(p.amount)}</p>
              {p.proofUrl && (
                <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-sm text-party-fuchsia">
                  مشاهده رسید
                </a>
              )}
              {p.note && <p className="text-xs text-party-ink/50">{p.note}</p>}
              <p className="text-sm mt-1">وضعیت: {p.status}</p>
              {p.status === "PENDING" && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="success" onClick={() => review(p.id, "APPROVED")}>
                    تأیید
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => review(p.id, "REJECTED")}>
                    رد
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-semibold">پرداخت‌کنندگان تأییدشده ({payerIds.size})</p>
      </div>
    </div>
  );
}
