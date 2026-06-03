"use client";

import { useRouter } from "@/lib/navigation";
import { useMemo, useState } from "react";
import { FriendGuestPicker } from "@/components/friend-guest-picker";
import { Button } from "@/components/ui/button";

type Friend = { id: string; name: string };

export function PartyGuests({
  ceremonyId,
  guests: initialGuests,
  friends,
  birthdayUserId,
  currentUserId,
  canManage,
}: {
  ceremonyId: string;
  guests: Friend[];
  friends: Friend[];
  birthdayUserId: string;
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [guests, setGuests] = useState(initialGuests);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const guestIdSet = useMemo(() => new Set(guests.map((g) => g.id)), [guests]);

  const friendsNotYetInvited = friends.filter(
    (f) =>
      f.id !== birthdayUserId &&
      f.id !== currentUserId &&
      !guestIdSet.has(f.id),
  );

  async function inviteSelected() {
    if (selectedIds.length === 0) return;
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/ceremonies/${ceremonyId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userIds: selectedIds }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      const added = friends.filter((f) => selectedIds.includes(f.id));
      setGuests((prev) => {
        const ids = new Set(prev.map((g) => g.id));
        return [...prev, ...added.filter((a) => !ids.has(a.id))];
      });
      setSelectedIds([]);
      setMsg(`Invited ${data.added ?? selectedIds.length} friend(s).`);
      router.refresh();
    } else {
      setMsg(data.error ?? "Could not invite");
    }
  }

  async function removeGuest(userId: string) {
    if (!confirm("Remove this friend from the party?")) return;
    setBusy(true);
    const res = await fetch(
      `/api/ceremonies/${ceremonyId}/guests?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE", credentials: "same-origin" },
    );
    setBusy(false);
    if (res.ok) {
      setGuests((prev) => prev.filter((g) => g.id !== userId));
      router.refresh();
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h2 className="text-sm font-medium text-foreground">Party guests</h2>
      <p className="mt-0.5 text-xs text-muted">
        Friends you invite can see this party and contribute to the gift.
      </p>

      {guests.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No friends invited yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {guests.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="font-medium">{g.name}</span>
              {canManage && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  loadingText="Removing…"
                  className="text-red-600"
                  onClick={() => removeGuest(g.id)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && friendsNotYetInvited.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <FriendGuestPicker
            friends={friendsNotYetInvited}
            birthdayUserId={birthdayUserId}
            currentUserId={currentUserId}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            loading={busy}
            loadingText="Inviting…"
            disabled={selectedIds.length === 0}
            onClick={inviteSelected}
          >
            Invite to party
          </Button>
        </div>
      )}

      {canManage && friendsNotYetInvited.length === 0 && friends.length > 0 && (
        <p className="mt-3 text-xs text-muted">All your friends are already on this party.</p>
      )}

      {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}
