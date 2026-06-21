"use client";

import { useRouter } from "@/lib/navigation";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { EmptyState } from "@/components/app-section";
import { Icon } from "@/components/icon";
import { formatAmountInputString } from "@/lib/money";
import { useFormatMoney } from "@/lib/currency-context";
import { Money } from "@/components/money";
import type { LinkPreview } from "@/app/api/link-preview/route";

type Item = {
  id: string;
  title: string;
  link: string | null;
  ogImage: string | null;
  ogDescription: string | null;
  cost: number;
  allowCheapIn: boolean;
  ceremonyId: string | null;
};

type WishlistFormData = {
  title: string;
  link: string;
  ogImage: string | null;
  ogDescription: string | null;
  cost: number;
  allowCheapIn: boolean;
  ceremonyId?: string;
};

const selectClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:h-9";

// Form
function WishlistItemForm({
  initial,
  ceremonies,
  fixedCeremonyId,
  onSave,
  onCancel,
  saveLabel,
}: {
  initial: {
    title: string;
    link: string;
    cost: string;
    cheapIn: boolean;
    ceremonyId: string;
    ogImage: string | null;
    ogDescription: string | null;
  };
  ceremonies: { id: string; title: string }[];
  fixedCeremonyId?: string;
  onSave: (data: WishlistFormData) => Promise<boolean>;
  onCancel?: () => void;
  saveLabel: string;
}) {
  const [title, setTitle] = useState(initial.title);
  const [link, setLink] = useState(initial.link);
  const [cost, setCost] = useState(initial.cost);
  const [cheapIn, setCheapIn] = useState(initial.cheapIn);
  const [targetCeremony, setTargetCeremony] = useState(initial.ceremonyId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(
    initial.ogImage || initial.ogDescription
      ? {
          title: initial.title,
          description: initial.ogDescription,
          image: initial.ogImage,
          siteName: null,
          price: null,
          url: initial.link,
        }
      : null,
  );
  const lastFetchedUrl = useRef<string>(initial.link);

  async function fetchPreview(url: string) {
    if (!url || url === lastFetchedUrl.current) return;
    lastFetchedUrl.current = url;
    setFetchingPreview(true);
    try {
      const res = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`,
      );
      if (!res.ok) return;
      const data: LinkPreview = (await res.json()).data ?? (await res.json());
      setPreview(data);
      if (!title.trim() && data.title) setTitle(data.title);
    } catch {
      // silent
    } finally {
      setFetchingPreview(false);
    }
  }

  async function submit() {
    setError("");
    const parsedCost = getAmountFromInput(cost);
    if (!title.trim() || !parsedCost) {
      setError("Title and price are required.");
      return;
    }
    setBusy(true);
    const ok = await onSave({
      title: title.trim(),
      link: link.trim(),
      ogImage: preview?.image ?? null,
      ogDescription: preview?.description ?? null,
      cost: parsedCost,
      allowCheapIn: cheapIn,
      ceremonyId: fixedCeremonyId ?? (targetCeremony || undefined),
    });
    setBusy(false);
    if (!ok) setError("Could not save.");
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Link input */}
      <div className="border-b border-border bg-muted-subtle/40 px-4 py-4">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Product link (optional — autofills title)
        </Label>
        <div className="relative mt-1.5">
          <Icon
            name="link"
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://shop.example.com/product"
            className="pl-8"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v.startsWith("http")) fetchPreview(v);
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text").trim();
              if (pasted.startsWith("http"))
                setTimeout(() => fetchPreview(pasted), 50);
            }}
          />
        </div>
        {fetchingPreview && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted animate-pulse">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-bounce" />
            Fetching product info…
          </p>
        )}
      </div>

      {/* Link preview */}
      {preview && (
        <div className="relative flex items-center gap-3 border-b border-border bg-emerald-50/60 px-4 py-3">
          {preview.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.image}
              alt=""
              className="h-14 w-14 flex-shrink-0 rounded-lg object-cover border border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            {preview.siteName && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
                {preview.siteName}
              </p>
            )}
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {preview.title ?? "Untitled"}
            </p>
            {preview.description && (
              <p className="text-xs text-muted line-clamp-1 mt-0.5">
                {preview.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="shrink-0 rounded-full p-1.5 text-muted hover:bg-white hover:text-foreground transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4 px-4 py-4">
        <div>
          <Label>Gift name</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sony WH-1000XM5 headphones"
          />
        </div>

        <div
          className={`grid gap-3 ${!fixedCeremonyId && ceremonies.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <div>
            <Label>Price (Toman)</Label>
            <MoneyInput
              value={cost}
              onValueChange={setCost}
              placeholder="1,500,000"
            />
          </div>
          {!fixedCeremonyId && ceremonies.length > 0 && (
            <div>
              <Label>Link to party</Label>
              <select
                className={selectClass}
                value={targetCeremony}
                onChange={(e) => setTargetCeremony(e.target.value)}
              >
                <option value="">General wishlist</option>
                {ceremonies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-muted-subtle/50 px-3 py-2.5 text-sm transition-colors hover:bg-muted-subtle select-none">
          <input
            type="checkbox"
            checked={cheapIn}
            onChange={(e) => setCheapIn(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          <span className="font-medium text-foreground">Pay what you can</span>
          <span className="ml-auto text-xs text-muted">Accept any amount</span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-border bg-muted-subtle/30 px-4 py-3">
        {onCancel && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={submit}
          loading={busy}
          loadingText="Saving…"
          className="ml-auto"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

// Item Card
function WishlistCard({
  item,
  ceremonies,
  canEdit,
  onEdit,
  onDelete,
  deleting,
}: {
  item: Item;
  ceremonies: { id: string; title: string }[];
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="group relative flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      {item.ogImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.ogImage}
          alt={item.title}
          className="h-auto w-28 flex-shrink-0 object-cover sm:w-32"
          onError={(e) => {
            (e.target as HTMLImageElement).parentElement?.classList.add(
              "hidden",
            );
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-semibold text-foreground leading-snug line-clamp-2 no-underline hover:text-accent transition-colors"
              >
                {item.title}
              </a>
            ) : (
              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {item.title}
              </p>
            )}
            {item.ogDescription && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                {item.ogDescription}
              </p>
            )}
          </div>

          {canEdit && (
            <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg p-1.5 text-muted hover:bg-muted-subtle hover:text-foreground transition-colors"
                title="Edit"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Delete"
              >
                {deleting ? (
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <Money
            amount={item.cost}
            className="text-base font-bold tabular-nums text-accent"
          />
          {item.allowCheapIn && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Pay what you can
            </span>
          )}
          {item.ceremonyId && ceremonies.length > 0 && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              🎉{" "}
              {ceremonies.find((c) => c.id === item.ceremonyId)?.title ??
                "Party"}
            </span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="ml-auto rounded-full bg-muted-subtle px-2.5 py-0.5 text-[10px] font-medium text-muted no-underline hover:text-foreground transition-colors"
            >
              View →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Manager
function itemToFormState(item: Item) {
  return {
    title: item.title,
    link: item.link ?? "",
    cost: formatAmountInputString(String(item.cost)),
    cheapIn: item.allowCheapIn,
    ceremonyId: item.ceremonyId ?? "",
    ogImage: item.ogImage,
    ogDescription: item.ogDescription,
  };
}

const EMPTY_FORM = {
  title: "",
  link: "",
  cost: "",
  cheapIn: false,
  ceremonyId: "",
  ogImage: null as null,
  ogDescription: null as null,
};

export function WishlistManager({
  items: initialItems,
  ceremonies = [],
  ceremonyId: fixedCeremonyId,
  canEdit = true,
  birthdayUserId: _birthdayUserId,
  actAsAdmin: _actAsAdmin,
}: {
  items: Item[];
  ceremonies?: { id: string; title: string }[];
  ceremonyId?: string;
  canEdit?: boolean;
  birthdayUserId?: string;
  actAsAdmin?: boolean;
}) {
  const router = useRouter();
  const formatMoney = useFormatMoney();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayItems = fixedCeremonyId
    ? initialItems.filter(
        (i) => i.ceremonyId === fixedCeremonyId || i.ceremonyId === null,
      )
    : initialItems;

  async function saveNew(data: WishlistFormData) {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        link: data.link || undefined,
        ogImage: data.ogImage,
        ogDescription: data.ogDescription,
        cost: data.cost,
        allowCheapIn: data.allowCheapIn,
        ceremonyId: data.ceremonyId,
      }),
    });
    if (res.ok) {
      setShowAdd(false);
      router.refresh();
      return true;
    }
    return false;
  }

  async function saveEdit(id: string, data: WishlistFormData) {
    const res = await fetch(`/api/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        link: data.link || null,
        ogImage: data.ogImage,
        ogDescription: data.ogDescription,
        cost: data.cost,
        allowCheapIn: data.allowCheapIn,
        ceremonyId: data.ceremonyId ?? null,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      router.refresh();
      return true;
    }
    return false;
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error ?? "Could not delete");
    }
  }

  if (!canEdit && displayItems.length === 0) {
    return <EmptyState>No wishlist items yet.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      {canEdit &&
        (showAdd ? (
          <WishlistItemForm
            initial={EMPTY_FORM}
            ceremonies={ceremonies}
            fixedCeremonyId={fixedCeremonyId}
            saveLabel="Add gift"
            onCancel={() => setShowAdd(false)}
            onSave={saveNew}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowAdd(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-white px-4 py-4 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:bg-accent/5 hover:text-accent"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted-subtle">
              <Icon name="plus" size={16} className="text-current" />
            </span>
            Add a gift idea
          </button>
        ))}

      {displayItems.length === 0 ? (
        <EmptyState>
          No gift ideas yet. Add one so friends know what to get you.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {displayItems.map((item) =>
            editingId === item.id && canEdit ? (
              <li key={item.id}>
                <WishlistItemForm
                  initial={itemToFormState(item)}
                  ceremonies={ceremonies}
                  fixedCeremonyId={fixedCeremonyId}
                  saveLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSave={(data) => saveEdit(item.id, data)}
                />
              </li>
            ) : (
              <li key={item.id}>
                <WishlistCard
                  item={item}
                  ceremonies={ceremonies}
                  canEdit={canEdit}
                  onEdit={() => {
                    setShowAdd(false);
                    setEditingId(item.id);
                  }}
                  onDelete={() => deleteItem(item.id)}
                  deleting={deletingId === item.id}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
