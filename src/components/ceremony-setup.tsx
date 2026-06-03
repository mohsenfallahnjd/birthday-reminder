"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FriendGuestPicker } from "@/components/friend-guest-picker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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
  /** When true, all group members are also notified (in addition to selected friends) */
  includeGroupMembers?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Birthday party");
  const [birthdayUserId, setBirthdayUserId] = useState(
    defaultBirthdayUserId ?? members[0]?.id ?? "",
  );
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultGuestIds = useMemo(() => {
    return friends
      .filter((f) => f.id !== birthdayUserId && f.id !== currentUserId)
      .map((f) => f.id);
  }, [friends, birthdayUserId, currentUserId]);

  const [guestIds, setGuestIds] = useState<string[]>(defaultGuestIds);

  // Keep selections in sync when birthday person changes
  function onBirthdayChange(id: string) {
    setBirthdayUserId(id);
    setGuestIds(
      friends.filter((f) => f.id !== id && f.id !== currentUserId).map((f) => f.id),
    );
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
        includeGroupMembers: includeGroupMembers && Boolean(groupId),
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
      <div>
        <Label>Party title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-11" />
      </div>
      {members.length > 1 && (
        <div>
          <Label>Birthday person</Label>
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

      <FriendGuestPicker
        friends={friends}
        birthdayUserId={birthdayUserId}
        currentUserId={currentUserId}
        selectedIds={guestIds}
        onChange={setGuestIds}
      />

      {includeGroupMembers && groupId && (
        <p className="text-xs text-muted">
          Group members are also included automatically (share the group code for anyone else).
        </p>
      )}

      <div>
        <Label>Treasurer card number</Label>
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
      <p className="text-xs text-muted">
        Invited friends get a notification and can open the party to contribute.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="button"
        onClick={create}
        loading={loading}
        loadingText="Creating…"
        disabled={!birthdayUserId}
        className="min-h-11"
      >
        Create party
      </Button>
    </div>
  );
}
