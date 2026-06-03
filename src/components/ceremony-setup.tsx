"use client";

import { useRouter } from "@/lib/navigation";
import { useMemo, useState } from "react";
import { AdminPicker } from "@/components/admin-picker";
import { FriendGuestPicker } from "@/components/friend-guest-picker";
import { PartyColorBar } from "@/components/party-color-bar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PARTY_COLORS, randomPartyColor } from "@/lib/ceremony-roles";

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
  const [partyColor, setPartyColor] = useState(randomPartyColor());
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
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
    <div className="mt-4 space-y-4">
      <PartyColorBar color={partyColor} className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs font-medium text-foreground">Party color</p>
          <div className="flex flex-wrap gap-1.5">
            {PARTY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title="Pick color"
                className="h-6 w-6 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
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
              className="text-xs text-muted hover:text-foreground px-1"
              onClick={() => setPartyColor(randomPartyColor())}
            >
              Random
            </button>
          </div>
        </div>
      </PartyColorBar>

      <div>
        <Label>Party title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-11" />
      </div>
      {members.length > 1 && (
        <div>
          <Label>Birthday holder</Label>
          <select
            className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm"
            value={birthdayUserId}
            onChange={(e) => onBirthdayChange(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
        <p className="text-xs text-muted">
          Group members are also invited automatically (share the group code for anyone else).
        </p>
      )}

      <div>
        <Label>Treasurer card number (admins can edit later)</Label>
        <Input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="font-mono min-h-11"
          placeholder="6037..."
        />
      </div>
      <div>
        <Label>Cardholder name</Label>
        <Input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className="min-h-11" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="button"
        onClick={create}
        loading={loading}
        loadingText="Creating…"
        disabled={!birthdayUserId || adminIds.length === 0}
        className="min-h-11"
      >
        Create party
      </Button>
    </div>
  );
}
