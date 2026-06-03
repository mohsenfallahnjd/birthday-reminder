"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MoneyInput, getAmountFromInput } from "@/components/money-input";
import { formatAmountInputString } from "@/lib/money";
import { formatMoney } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  link: string | null;
  cost: number;
  allowCheapIn: boolean;
  ceremonyId: string | null;
};

const selectClass =
  "h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type WishlistFormData = {
  title: string;
  link: string;
  cost: number;
  allowCheapIn: boolean;
  ceremonyId?: string;
};

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
      cost: parsedCost,
      allowCheapIn: cheapIn,
      ceremonyId: fixedCeremonyId ?? (targetCeremony || undefined),
    });
    setBusy(false);
    if (!ok) setError("Could not save item.");
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted-subtle/50 p-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Link (optional)</Label>
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
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

function itemToFormState(item: Item) {
  return {
    title: item.title,
    link: item.link ?? "",
    cost: formatAmountInputString(String(item.cost)),
    cheapIn: item.allowCheapIn,
    ceremonyId: item.ceremonyId ?? "",
  };
}

export function WishlistManager({
  items: initialItems,
  ceremonies = [],
  ceremonyId: fixedCeremonyId,
  canEdit = true,
}: {
  items: Item[];
  ceremonies?: { id: string; title: string }[];
  ceremonyId?: string;
  canEdit?: boolean;
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
    return <p className="text-sm text-muted">No wishlist items yet.</p>;
  }

  return (
    <div className="space-y-6">
      {displayItems.length > 0 ? (
        <ul className="divide-y divide-border border-t border-border">
          {displayItems.map((item) => (
            <li key={item.id} className="py-4">
              {editingId === item.id && canEdit ? (
                <WishlistItemForm
                  initial={itemToFormState(item)}
                  ceremonies={ceremonies}
                  fixedCeremonyId={fixedCeremonyId}
                  saveLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSave={(data) => saveEdit(item.id, data)}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block truncate text-muted underline"
                      >
                        {item.link}
                      </a>
                    )}
                    <p className="mt-1 tabular-nums text-muted">{formatMoney(item.cost)}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                      {item.allowCheapIn && <span>Pay what you can</span>}
                      {item.ceremonyId && ceremonies.length > 0 && (
                        <span>
                          Party: {ceremonies.find((c) => c.id === item.ceremonyId)?.title ?? "—"}
                        </span>
                      )}
                      {!item.ceremonyId && ceremonies.length > 0 && !fixedCeremonyId && (
                        <span>General wishlist</span>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          setShowAdd(false);
                          setEditingId(item.id);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-red-600 hover:text-red-700 sm:flex-none"
                        loading={deletingId === item.id}
                        loadingText="Deleting…"
                        onClick={() => deleteItem(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No items yet.</p>
      )}

      {canEdit && (
        <div className="border-t border-border pt-6">
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
              Add item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
