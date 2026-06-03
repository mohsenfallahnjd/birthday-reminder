"use client";

import { useRouter } from "@/lib/navigation";
import { useMemo, useState } from "react";
import { FormSection, personInitials } from "@/components/app-section";
import { AdminPicker } from "@/components/admin-picker";
import { FriendGuestPicker } from "@/components/friend-guest-picker";
import { Icon } from "@/components/icon";
import { PartyColorPicker } from "@/components/party-color-picker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { randomPartyColor } from "@/lib/ceremony-roles";

type Member = { id: string; name: string };

export function CeremonySetup({
  groupId,
  members,
  friends,
  currentUserId,
  defaultBirthdayUserId,
  includeGroupMembers = false,
}: {
  groupId?: string;
  members: Member[];
  friends: Member[];
  currentUserId: string;
  defaultBirthdayUserId?: string;
  includeGroupMembers?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Birthday party");
  const [birthdayUserId, setBirthdayUserId] = useState(
    defaultBirthdayUserId ?? members[0]?.id ?? "",
  );
  const [partyColor, setPartyColor] = useState<string>(randomPartyColor());
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const adminCandidates = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(m.id, m);
    for (const f of friends) map.set(f.id, f);
    return [...map.values()];
  }, [members, friends]);

  const defaultGuestIds = useMemo(() => {
    return friends
      .filter((f) => f.id !== birthdayUserId && f.id !== currentUserId)
      .map((f) => f.id);
  }, [friends, birthdayUserId, currentUserId]);

  const [guestIds, setGuestIds] = useState<string[]>(defaultGuestIds);
  const [adminIds, setAdminIds] = useState<string[]>([currentUserId]);

  const holderName =
    members.find((m) => m.id === birthdayUserId)?.name ??
    friends.find((f) => f.id === birthdayUserId)?.name ??
    "—";

  function onBirthdayChange(id: string) {
    setBirthdayUserId(id);
    setGuestIds(
      friends.filter((f) => f.id !== id && f.id !== currentUserId).map((f) => f.id),
    );
    setAdminIds((prev) => prev.filter((aid) => aid !== id));
  }

  async function create() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/ceremonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        title,
        birthdayUserId,
        groupId,
        guestIds,
        adminIds,
        includeGroupMembers: includeGroupMembers && Boolean(groupId),
        color: partyColor,
        cardNumber: cardNumber || undefined,
        cardHolder: cardHolder || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push(`/ceremonies/${data.id}`);
    else setError(data.error ?? "Could not create party");
  }

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/80 shadow-sm"
        style={{
          background: `linear-gradient(145deg, ${partyColor}18 0%, #ffffff 50%, ${partyColor}10 100%)`,
          boxShadow: `0 1px 0 ${partyColor}22, 0 10px 32px -14px ${partyColor}55`,
        }}
      >
        <div
          className="absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl"
          style={{ backgroundColor: partyColor }}
          aria-hidden
        />
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${partyColor}, ${partyColor}55, ${partyColor})`,
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-4 p-5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${partyColor}22`, color: partyColor }}
          >
            <Icon name="party" size={24} className="text-current" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
            <p className="truncate text-lg font-semibold text-foreground">
              {title.trim() || "Birthday party"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: partyColor }}
              >
                {personInitials(holderName)}
              </span>
              <span className="text-sm text-muted">
                Birthday · <span className="font-medium text-foreground">{holderName}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <FormSection
        step={1}
        title="Look & name"
        description="Pick a color and title — each party gets its own style."
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Party color</Label>
            <PartyColorPicker value={partyColor} onChange={setPartyColor} />
          </div>
          <div>
            <Label>Party title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 min-h-11 bg-white"
              placeholder="e.g. Sarah's 30th"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Birthday holder"
        description="Who is this party for? They can manage their wishlist."
      >
        {members.length > 1 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {members.map((m) => {
              const selected = birthdayUserId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onBirthdayChange(m.id)}
                  className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                    selected
                      ? "border-foreground/20 bg-muted-subtle ring-2 ring-foreground/10"
                      : "border-border bg-white hover:border-foreground/15"
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: selected ? partyColor : "#a1a1aa" }}
                  >
                    {personInitials(m.name)}
                  </span>
                  <span className="font-medium text-foreground">{m.name}</span>
                  {selected && (
                    <span className="ml-auto shrink-0" style={{ color: partyColor }}>
                      <Icon name="cake" size={18} className="text-current" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : members.length === 1 ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted-subtle/50 px-4 py-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: partyColor }}
            >
              {personInitials(members[0].name)}
            </span>
            <div>
              <p className="font-medium text-foreground">{members[0].name}</p>
              <p className="text-xs text-muted">Birthday holder for this party</p>
            </div>
          </div>
        ) : (
          <select
            className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            value={birthdayUserId}
            onChange={(e) => onBirthdayChange(e.target.value)}
          >
            {adminCandidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </FormSection>

      <FormSection
        step={3}
        title="Team"
        description="Admins run payments; friends join as guests."
      >
        <div className="space-y-5">
          <AdminPicker
            people={adminCandidates}
            birthdayUserId={birthdayUserId}
            currentUserId={currentUserId}
            selectedIds={adminIds}
            onChange={setAdminIds}
          />
          <FriendGuestPicker
            friends={friends}
            birthdayUserId={birthdayUserId}
            currentUserId={currentUserId}
            selectedIds={guestIds}
            onChange={setGuestIds}
          />
          {includeGroupMembers && groupId && (
            <p className="flex items-start gap-2 rounded-lg bg-muted-subtle/80 px-3 py-2.5 text-xs text-muted">
              <Icon name="users" size={14} className="mt-0.5 shrink-0" />
              Group members are invited automatically. Share the group code for anyone else.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        step={4}
        title="Payment (optional)"
        description="Admins can add or change the card later."
      >
        <button
          type="button"
          className="mb-3 text-sm font-medium text-muted hover:text-foreground"
          onClick={() => setShowPayment((v) => !v)}
        >
          {showPayment ? "Hide card fields" : "Add treasurer card now"}
        </button>
        {showPayment && (
          <div className="space-y-3">
            <div>
              <Label>Card number</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="mt-1.5 min-h-11 bg-white font-mono"
                placeholder="6037…"
              />
            </div>
            <div>
              <Label>Cardholder name</Label>
              <Input
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="mt-1.5 min-h-11 bg-white"
              />
            </div>
          </div>
        )}
        {!showPayment && (
          <p className="text-xs text-muted">Skip for now — set up when the party is live.</p>
        )}
      </FormSection>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={create}
        loading={loading}
        loadingText="Creating party…"
        disabled={!birthdayUserId || adminIds.length === 0 || !title.trim()}
        className="min-h-12 w-full text-base"
      >
        <Icon name="party" size={18} className="mr-2 text-white" />
        Create party
      </Button>
    </div>
  );
}
