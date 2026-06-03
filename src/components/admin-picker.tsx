"use client";

import { Label } from "@/components/ui/input";

type Person = { id: string; name: string };

export function AdminPicker({
  people,
  birthdayUserId,
  currentUserId,
  selectedIds,
  onChange,
}: {
  people: Person[];
  birthdayUserId: string;
  currentUserId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const candidates = people.filter(
    (p) => p.id !== birthdayUserId,
  );

  if (candidates.length === 0) {
    return (
      <p className="text-xs text-muted">
        Pick a birthday person first, then choose admins (treasurers).
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

  const allSelected =
    candidates.length > 0 && candidates.every((p) => selectedIds.includes(p.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Party admins (treasurers)</Label>
        <button
          type="button"
          className="text-xs font-medium text-muted hover:text-foreground"
          onClick={() =>
            onChange(allSelected ? [currentUserId].filter(Boolean) : candidates.map((p) => p.id))
          }
        >
          {allSelected ? "Just me" : "Select all"}
        </button>
      </div>
      <p className="text-xs text-muted">
        Admins approve payments, set the shared card number, and can add gift or party-cost items.
      </p>
      <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-white p-2">
        {candidates.map((p) => (
          <li key={p.id}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded px-2 text-sm hover:bg-muted-subtle">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span className="font-medium text-foreground">
                {p.name}
                {p.id === currentUserId && (
                  <span className="ml-1 text-xs text-muted">(you)</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
