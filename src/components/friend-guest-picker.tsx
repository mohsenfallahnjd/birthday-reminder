"use client";

import { Label } from "@/components/ui/input";

type Friend = { id: string; name: string };

export function FriendGuestPicker({
  friends,
  birthdayUserId,
  currentUserId,
  selectedIds,
  onChange,
}: {
  friends: Friend[];
  birthdayUserId: string;
  currentUserId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const invitees = friends.filter(
    (f) => f.id !== birthdayUserId && f.id !== currentUserId,
  );

  if (invitees.length === 0) {
    return (
      <p className="text-xs text-muted">
        Add friends on the Friends page first, then you can invite them to this party.
      </p>
    );
  }

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function setAll(checked: boolean) {
    onChange(checked ? invitees.map((f) => f.id) : []);
  }

  const allSelected = invitees.length > 0 && invitees.every((f) => selectedIds.includes(f.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Invite friends to party</Label>
        <button
          type="button"
          className="text-xs font-medium text-muted hover:text-foreground"
          onClick={() => setAll(!allSelected)}
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-white p-2">
        {invitees.map((f) => (
          <li key={f.id}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded px-2 text-sm hover:bg-muted-subtle">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={selectedIds.includes(f.id)}
                onChange={() => toggle(f.id)}
              />
              <span className="font-medium text-foreground">{f.name}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        {selectedIds.length} friend{selectedIds.length === 1 ? "" : "s"} will be invited and notified.
      </p>
    </div>
  );
}
