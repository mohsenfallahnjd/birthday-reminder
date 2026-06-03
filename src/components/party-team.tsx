"use client";

import { useRouter } from "@/lib/navigation";
import { useMemo, useState } from "react";
import { FriendGuestPicker } from "@/components/friend-guest-picker";
import { Button } from "@/components/ui/button";

type Person = { id: string; name: string };
type Member = { id: string; name: string; role: "BIRTHDAY" | "ADMIN" | "GUEST" };

const roleLabel = {
  BIRTHDAY: "Birthday (holder)",
  ADMIN: "Admin",
  GUEST: "Guest",
} as const;

export function PartyTeam({
  ceremonyId,
  members,
  friends,
  birthdayUserId,
  birthdayName,
  currentUserId,
  canManage,
}: {
  ceremonyId: string;
  members: Member[];
  friends: Person[];
  birthdayUserId: string;
  birthdayName: string;
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState(members);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const memberIds = useMemo(() => new Set(list.map((m) => m.id)), [list]);

  const friendsToAdd = friends.filter(
    (f) =>
      f.id !== birthdayUserId &&
      f.id !== currentUserId &&
      !memberIds.has(f.id),
  );

  const holder = list.find((m) => m.role === "BIRTHDAY");
  const admins = list.filter((m) => m.role === "ADMIN");
  const guests = list.filter((m) => m.role === "GUEST");

  async function inviteFriends() {
    if (selectedFriendIds.length === 0) return;
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/ceremonies/${ceremonyId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userIds: selectedFriendIds, role: "GUEST" }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      const added = friends.filter((f) => selectedFriendIds.includes(f.id));
      setList((prev) => [
        ...prev,
        ...added
          .filter((a) => !prev.some((p) => p.id === a.id))
          .map((a) => ({ ...a, role: "GUEST" as const })),
      ]);
      setSelectedFriendIds([]);
      setMsg(`Added ${data.added ?? selectedFriendIds.length} friend(s).`);
      router.refresh();
    } else {
      setMsg(data.error ?? "Could not add");
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this person from the party?")) return;
    setBusy(true);
    const res = await fetch(
      `/api/ceremonies/${ceremonyId}/members?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE", credentials: "same-origin" },
    );
    setBusy(false);
    if (res.ok) {
      setList((prev) => prev.filter((m) => m.id !== userId));
      router.refresh();
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">Party team</h2>
        <p className="mt-0.5 text-xs text-muted">
          Birthday: <strong>{holder?.name ?? birthdayName}</strong> · Admins approve pay and manage the card · Guests contribute
          {canManage && (
            <span className="block mt-1">Use <strong>Edit</strong> above to change title, color, or birthday holder.</span>
          )}
        </p>
      </div>

      {admins.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-1">Admins</p>
          <ul className="space-y-1">
            {admins.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>{m.name}</span>
                {canManage && m.role !== "BIRTHDAY" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    loading={busy}
                    loadingText="…"
                    onClick={() => removeMember(m.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {guests.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-1">Friends & guests</p>
          <ul className="space-y-1">
            {guests.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  {m.name}
                  <span className="ml-1 text-xs text-muted">{roleLabel[m.role]}</span>
                </span>
                {canManage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    loading={busy}
                    onClick={() => removeMember(m.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && friendsToAdd.length > 0 && (
        <div className="border-t border-border pt-4 space-y-3">
          <FriendGuestPicker
            friends={friendsToAdd}
            birthdayUserId={birthdayUserId}
            currentUserId={currentUserId}
            selectedIds={selectedFriendIds}
            onChange={setSelectedFriendIds}
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            loading={busy}
            loadingText="Adding…"
            disabled={selectedFriendIds.length === 0}
            onClick={inviteFriends}
          >
            Add friends to party
          </Button>
        </div>
      )}

      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}
