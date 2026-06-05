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
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [partyColor, setPartyColor] = useState(initialColor);
  const [holderId, setHolderId] = useState(initialHolderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const displayTitle = editing ? title : initialTitle;
  const displayColor = editing ? partyColor : initialColor;
  const selectedHolder = holderCandidates.find((p) => p.id === holderId);
  const displayHolderName = editing
    ? selectedHolder?.name ?? initialHolderName
    : initialHolderName;
  const displayHolderAvatar = editing
    ? selectedHolder?.avatarUrl ?? initialHolderAvatar
    : initialHolderAvatar;

  const roleHint = isBirthdayPerson
    ? "You are the birthday holder"
    : isAdmin
      ? "You are a party admin"
      : null;

  async function save() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        title: title.trim(),
        color: partyColor,
        birthdayUserId: holderId,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(data.error ?? "Could not save");
    }
  }

  async function removeParty() {
    if (
      !confirm(
        "Delete this party? Payments and party items will be removed. This cannot be undone.",
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/ceremonies/${ceremonyId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      if (data.groupId) router.push(`/groups/${data.groupId}`);
      else router.push("/dashboard");
      router.refresh();
    } else {
      setError(data.error ?? "Could not delete");
    }
  }

  function cancelEdit() {
    setTitle(initialTitle);
    setPartyColor(initialColor);
    setHolderId(initialHolderId);
    setEditing(false);
    setError("");
  }

  return (
    <section
      className="relative mb-8 overflow-hidden rounded-2xl border shadow-sm"
      style={{
        background: `linear-gradient(145deg, ${displayColor}18 0%, #ffffff 42%, ${displayColor}12 100%)`,
        boxShadow: `0 1px 0 ${displayColor}22, 0 12px 40px -12px ${displayColor}44`,
        borderColor: `${displayColor}44`,
      }}
    >
      <div
        className="absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: displayColor }}
        aria-hidden
      />
      <div
        className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full opacity-20 blur-xl"
        style={{ backgroundColor: displayColor }}
        aria-hidden
      />

      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${displayColor}, ${displayColor}66, ${displayColor})`,
        }}
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: `${displayColor}22`, color: displayColor }}
          >
            <Icon name="party" size={26} className="text-current" strokeWidth={1.75} />
          </div>

          {canManage && !editing && (
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-9 gap-1.5"
                onClick={() => setEditing(true)}
                aria-label="Edit party"
              >
                <Icon name="pencil" size={15} className="text-foreground" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-9 gap-1.5 text-red-600 hover:text-red-700"
                loading={busy}
                onClick={removeParty}
                aria-label="Delete party"
              >
                <Icon name="trash" size={15} className="text-current" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {!editing ? (
          <>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {displayTitle}
            </h1>
            {groupName && groupId && (
              <p className="mt-1 text-sm text-muted">
                In group{" "}
                <Link href={`/groups/${groupId}`} className="font-medium text-foreground">
                  {groupName}
                </Link>
              </p>
            )}
            <div
              className="mt-4 inline-flex max-w-full items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: `${displayColor}44`,
                backgroundColor: `${displayColor}0d`,
              }}
            >
              <UserAvatar
                name={displayHolderName}
                avatarUrl={displayHolderAvatar}
                size="md"
                accentColor={displayColor}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Birthday holder
                </p>
                <p className="truncate text-base font-medium text-foreground">
                  {displayHolderName}
                </p>
              </div>
              <span className="ml-auto shrink-0" style={{ color: displayColor }}>
                <Icon name="cake" size={20} className="text-current opacity-90" />
              </span>
            </div>
            {roleHint && (
              <p className="mt-3 text-xs text-muted">{roleHint}</p>
            )}
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <Label>Party title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-h-11 bg-white"
              />
            </div>

            <div>
              <Label>Birthday holder</Label>
              <select
                className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={holderId}
                onChange={(e) => setHolderId(e.target.value)}
              >
                {holderCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Choose who this party celebrates. Group members or people already on the team.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground mb-2">Party color</p>
              <div className="flex flex-wrap gap-2">
                {PARTY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title="Pick color"
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm ring-1 ring-border transition-transform hover:scale-105"
                    style={{
                      backgroundColor: c,
                      outline: partyColor === c ? `2px solid ${c}` : undefined,
                      outlineOffset: 2,
                    }}
                    onClick={() => setPartyColor(c)}
                  />
                ))}
                <button
                  type="button"
                  className="text-xs text-muted hover:text-foreground self-center px-2"
                  onClick={() => setPartyColor(randomPartyColor())}
                >
                  Random
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                loading={busy}
                loadingText="Saving…"
                disabled={!title.trim() || !holderId}
                onClick={save}
              >
                Save changes
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && !editing && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
