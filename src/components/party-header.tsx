"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { PARTY_COLORS, randomPartyColor } from "@/lib/ceremony-roles";

type Person = { id: string; name: string; avatarUrl?: string | null };

export function PartyHeader({
  ceremonyId,
  title: initialTitle,
  color: initialColor,
  birthdayUserId: initialHolderId,
  birthdayName: initialHolderName,
  birthdayAvatarUrl: initialHolderAvatar,
  groupId,
  groupName,
  holderCandidates,
  canManage,
  isAdmin,
  isBirthdayPerson,
  shareToken,
  active,
}: {
  ceremonyId: string;
  title: string;
  color: string;
  birthdayUserId: string;
  birthdayName: string;
  birthdayAvatarUrl?: string | null;
  groupId: string | null;
  groupName: string | null;
  holderCandidates: Person[];
  canManage: boolean;
  isAdmin: boolean;
  isBirthdayPerson: boolean;
  shareToken?: string;
  active: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [partyColor, setPartyColor] = useState(initialColor);
  const [holderId, setHolderId] = useState(initialHolderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const displayColor = editing ? partyColor : initialColor;
  const displayTitle = editing ? title : initialTitle;
  const selectedHolder = holderCandidates.find((p) => p.id === holderId);
  const displayHolderName = editing ? (selectedHolder?.name ?? initialHolderName) : initialHolderName;
  const displayHolderAvatar = editing ? (selectedHolder?.avatarUrl ?? initialHolderAvatar) : initialHolderAvatar;

  const roleLabel = isBirthdayPerson ? "Your birthday 🎂" : isAdmin ? "You're admin" : null;

  async function copyShareLink() {
    if (!shareToken) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${shareToken}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: initialTitle, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  async function save() {
    setBusy(true); setError("");
    const res = await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ title: title.trim(), color: partyColor, birthdayUserId: holderId }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) { setEditing(false); router.refresh(); }
    else setError(data.error ?? "Could not save");
  }

  async function endParty() {
    if (!confirm("End this party? It will move to your party history and can be re-opened later.")) return;
    setBusy(true);
    const res = await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ active: false }),
    });
    setBusy(false);
    if (res.ok) router.refresh(); else setError("Could not end party");
  }

  async function reopenParty() {
    setBusy(true);
    const res = await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ active: true }),
    });
    setBusy(false);
    if (res.ok) router.refresh(); else setError("Could not re-open party");
  }

  async function removeParty() {
    if (!confirm("Delete this party? Payments and party items will be removed. This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/ceremonies/${ceremonyId}`, { method: "DELETE", credentials: "same-origin" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      if (data.groupId) router.push(`/groups/${data.groupId}`);
      else router.push("/dashboard");
      router.refresh();
    } else setError(data.error ?? "Could not delete");
  }

  function cancelEdit() {
    setTitle(initialTitle); setPartyColor(initialColor); setHolderId(initialHolderId);
    setEditing(false); setError("");
  }

  return (
    <section
      className="relative mb-8 overflow-hidden rounded-2xl border shadow-sm"
      style={{
        background: active
          ? `linear-gradient(145deg, ${displayColor}18 0%, #ffffff 42%, ${displayColor}12 100%)`
          : "linear-gradient(145deg, #f8f8f8 0%, #ffffff 50%, #f4f4f4 100%)",
        boxShadow: active
          ? `0 1px 0 ${displayColor}22, 0 12px 40px -12px ${displayColor}44`
          : "0 1px 0 #e4e4e7, 0 8px 24px -10px rgba(0,0,0,0.06)",
        borderColor: active ? `${displayColor}44` : "#e4e4e7",
      }}
    >
      {/* colour blobs */}
      {active && (
        <>
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: displayColor }} aria-hidden />
          <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full opacity-20 blur-xl" style={{ backgroundColor: displayColor }} aria-hidden />
        </>
      )}

      {/* top stripe */}
      <div
        className="h-1.5 w-full"
        style={{
          background: active
            ? `linear-gradient(90deg, ${displayColor}, ${displayColor}66, ${displayColor})`
            : "linear-gradient(90deg, #d4d4d8, #a1a1aa, #d4d4d8)",
        }}
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        {!editing ? (
          <>
            {/* ── header row ── */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
                style={{ backgroundColor: active ? `${displayColor}22` : "#f0f0f0", color: active ? displayColor : "#a1a1aa" }}
              >
                <Icon name="party" size={22} className="text-current" strokeWidth={1.75} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {displayTitle}
                  </h1>
                  {!active && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Ended
                    </span>
                  )}
                  {roleLabel && active && (
                    <span className="rounded-full bg-foreground/8 px-2.5 py-0.5 text-[11px] font-medium text-foreground/60">
                      {roleLabel}
                    </span>
                  )}
                </div>
                {groupName && groupId && (
                  <p className="mt-0.5 text-xs text-muted">
                    In{" "}
                    <Link href={`/groups/${groupId}`} className="font-medium text-foreground">
                      {groupName}
                    </Link>
                  </p>
                )}
              </div>
            </div>

            {/* ── birthday holder ── */}
            <div
              className="mt-4 flex items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: active ? `${displayColor}33` : "#e4e4e7",
                backgroundColor: active ? `${displayColor}0a` : "#fafafa",
              }}
            >
              <UserAvatar name={displayHolderName} avatarUrl={displayHolderAvatar} size="md" accentColor={active ? displayColor : "#a1a1aa"} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Birthday holder</p>
                <p className="truncate text-sm font-semibold text-foreground">{displayHolderName}</p>
              </div>
              <span className="shrink-0 opacity-40" style={{ color: active ? displayColor : undefined }}>
                <Icon name="cake" size={18} className="text-current" />
              </span>
            </div>

            {/* ── action bar ── */}
            {(canManage || (active && shareToken)) && (
              <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border/50 pt-3">
                {active && shareToken && (
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-muted-subtle hover:text-foreground"
                  >
                    <Icon name={shareCopied ? "copy" : "share"} size={13} className="text-current" />
                    {shareCopied ? "Copied!" : "Share"}
                  </button>
                )}
                {canManage && active && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-muted-subtle hover:text-foreground"
                  >
                    <Icon name="pencil" size={13} className="text-current" />
                    Edit
                  </button>
                )}
                {canManage && (
                  active ? (
                    <button
                      type="button"
                      onClick={endParty}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-muted-subtle hover:text-foreground disabled:opacity-50"
                    >
                      <Icon name="archive" size={13} className="text-current" />
                      End party
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={reopenParty}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                    >
                      <Icon name="rotate-ccw" size={13} className="text-current" />
                      Re-open
                    </button>
                  )
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={removeParty}
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Icon name="trash" size={13} className="text-current" />
                    Delete
                  </button>
                )}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Party title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-11 bg-white" />
            </div>

            <div>
              <Label>Birthday holder</Label>
              <select
                className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={holderId}
                onChange={(e) => setHolderId(e.target.value)}
              >
                {holderCandidates.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">Choose who this party celebrates.</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Party color</p>
              <div className="flex flex-wrap gap-2">
                {PARTY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title="Pick color"
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm ring-1 ring-border transition-transform hover:scale-105"
                    style={{ backgroundColor: c, outline: partyColor === c ? `2px solid ${c}` : undefined, outlineOffset: 2 }}
                    onClick={() => setPartyColor(c)}
                  />
                ))}
                <button
                  type="button"
                  className="self-center px-2 text-xs text-muted hover:text-foreground"
                  onClick={() => setPartyColor(randomPartyColor())}
                >
                  Random
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="primary" loading={busy} loadingText="Saving…" disabled={!title.trim() || !holderId} onClick={save}>
                Save changes
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
