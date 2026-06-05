"use client";

import { useRouter } from "@/lib/navigation";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { AppList, AppListItem, EmptyState } from "@/components/app-section";
import { formatAmountInputString } from "@/lib/money";
import { formatMoney } from "@/lib/utils";
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

const selectClass =
  "h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type WishlistFormData = {
  title: string;
  link: string;
  ogImage: string | null;
  ogDescription: string | null;
  cost: number;
  allowCheapIn: boolean;
  ceremonyId?: string;
};

// ─── Link Preview Badge ────────────────────────────────────────────────────────
function PreviewBadge({
  preview,
  onDismiss,
}: {
  preview: LinkPreview;
  onDismiss: () => void;
}) {
  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
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
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
            {preview.siteName}
          </p>
        )}
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {preview.title ?? "Untitled"}
        </p>
        {preview.description && (
          <p className="text-xs text-muted line-clamp-2 mt-0.5">{preview.description}</p>
        )}
        {preview.price && (
          <p className="text-xs font-semibold text-accent mt-1">{preview.price}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2 right-2 text-muted hover:text-foreground text-xs"
        title="Dismiss preview"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────
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
      if (!res.ok) { setFetchingPreview(false); return; }
      const data: LinkPreview = (await res.json()).data ?? await res.json();
      setPreview(data);
      // Auto-fill title if still empty
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
      setError("Title and a valid price are required.");
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
    if (!ok) setError("Could not save item.");
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted-subtle/40 p-4">
      <div>
        <Label>Link (optional)</Label>
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v.startsWith("http")) fetchPreview(v);
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").trim();
            if (pasted.startsWith("http")) {
              // use setTimeout to let the state update first
              setTimeout(() => fetchPreview(pasted), 50);
            }
          }}
        />
        {fetchingPreview && (
          <p className="mt-1.5 text-xs text-muted animate-pulse">
            Fetching link info…
          </p>
        )}
      </div>

      {preview && (
        <PreviewBadge preview={preview} onDismiss={() => setPreview(null)} />
      )}

      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Price (Toman)</Label>
        <MoneyInput value={cost} onValueChange={setCost} placeholder="1,500,000" />
      </div>
      {!fixedCeremonyId && ceremonies.length > 0 && (
        <div>
          <Label>Party (optional)</Label>
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
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={cheapIn}
          onChange={(e) => setCheapIn(e.target.checked)}
          className="rounded border-border"
        />
        Allow pay-what-you-can
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={submit}
          loading={busy}
          loadingText="Saving…"
        >
          {saveLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
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
  const hasPreview = !!(item.ogImage || item.ogDescription);

  return (
    <div className="group flex flex-col sm:flex-row gap-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image panel */}
      {item.ogImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.ogImage}
          alt={item.title}
          className="h-36 w-full sm:h-auto sm:w-36 object-cover flex-shrink-0 border-b sm:border-b-0 sm:border-r border-border"
          onError={(e) => {
            (e.target as HTMLImageElement).parentElement?.classList.add("hidden");
          }}
        />
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-foreground hover:text-accent transition-colors leading-snug line-clamp-2 block"
                >
                  {item.title}
                </a>
              ) : (
                <p className="font-semibold text-foreground leading-snug line-clamp-2">
                  {item.title}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              {formatMoney(item.cost)}
            </span>
          </div>

          {item.ogDescription && (
            <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
              {item.ogDescription}
            </p>
          )}

          {item.link && !hasPreview && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs text-muted underline"
            >
              {item.link}
            </a>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted">
            {item.allowCheapIn && (
              <span className="rounded-full bg-muted-subtle px-2 py-0.5">Pay what you can</span>
            )}
            {item.ceremonyId && ceremonies.length > 0 && (
              <span className="rounded-full bg-muted-subtle px-2 py-0.5">
                🎉 {ceremonies.find((c) => c.id === item.ceremonyId)?.title ?? "Party"}
              </span>
            )}
            {!item.ceremonyId && ceremonies.length > 0 && (
              <span className="rounded-full bg-muted-subtle px-2 py-0.5">General</span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="mt-3 flex gap-2 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onEdit}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="flex-1 text-red-600 hover:text-red-700 sm:flex-none"
              loading={deleting}
              loadingText="Deleting…"
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manager ──────────────────────────────────────────────────────────────────
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(initialItems.length === 0 && canEdit);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayItems = fixedCeremonyId
    ? initialItems.filter((i) => i.ceremonyId === fixedCeremonyId || i.ceremonyId === null)
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
    if (!confirm("Delete this wishlist item?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Could not delete");
    }
  }

  if (!canEdit && displayItems.length === 0) {
    return <EmptyState>No wishlist items yet.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      {displayItems.length > 0 ? (
        <div className="space-y-3">
          {displayItems.map((item) =>
            editingId === item.id && canEdit ? (
              <div key={item.id} className="rounded-xl border border-border overflow-hidden">
                <WishlistItemForm
                  initial={itemToFormState(item)}
                  ceremonies={ceremonies}
                  fixedCeremonyId={fixedCeremonyId}
                  saveLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSave={(data) => saveEdit(item.id, data)}
                />
              </div>
            ) : (
              <WishlistCard
                key={item.id}
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
            ),
          )}
        </div>
      ) : (
        <EmptyState>No items yet.</EmptyState>
      )}

      {canEdit && (
        <div className="rounded-xl border border-border bg-white/80 p-4 pt-5 shadow-sm">
          {showAdd ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Add item</h3>
              <WishlistItemForm
                initial={{
                  title: "",
                  link: "",
                  cost: "",
                  cheapIn: false,
                  ceremonyId: fixedCeremonyId ?? "",
                  ogImage: null,
                  ogDescription: null,
                }}
                ceremonies={ceremonies}
                fixedCeremonyId={fixedCeremonyId}
                saveLabel="Add"
                onCancel={displayItems.length > 0 ? () => setShowAdd(false) : undefined}
                onSave={saveNew}
              />
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
              + Add item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
