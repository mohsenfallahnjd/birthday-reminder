"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatJalaliBirthday } from "@/lib/jalali";

type SearchUser = {
  id: string;
  name: string;
  email: string;
  birthMonth: number | null;
  birthDay: number | null;
  relation: "none" | "friends" | "pending_sent" | "pending_received";
  friendshipId: string | null;
};

export function FriendSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/people/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResults(data);
    else setResults([]);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function sendRequest(userId: string) {
    setActionId(userId);
    setMsg("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setActionId(null);
    if (res.ok) {
      router.refresh();
      search(query);
    } else {
      setMsg(data.error ?? "Could not send request");
    }
  }

  async function acceptRequest(friendshipId: string) {
    setActionId(friendshipId);
    const res = await fetch(`/api/people/${friendshipId}`, { method: "PATCH" });
    setActionId(null);
    if (res.ok) {
      router.refresh();
      search(query);
    }
  }

  async function removeFriendship(friendshipId: string) {
    setActionId(friendshipId);
    const res = await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
    setActionId(null);
    if (res.ok) {
      router.refresh();
      search(query);
    }
  }

  function actionButton(user: SearchUser) {
    const busy = actionId === user.id || actionId === user.friendshipId;

    switch (user.relation) {
      case "friends":
        return (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => user.friendshipId && removeFriendship(user.friendshipId)}
          >
            Remove
          </Button>
        );
      case "pending_sent":
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => user.friendshipId && removeFriendship(user.friendshipId)}
          >
            Cancel request
          </Button>
        );
      case "pending_received":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => user.friendshipId && acceptRequest(user.friendshipId)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => user.friendshipId && removeFriendship(user.friendshipId)}
            >
              Decline
            </Button>
          </div>
        );
      default:
        return (
          <Button size="sm" disabled={busy} onClick={() => sendRequest(user.id)}>
            Add friend
          </Button>
        );
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="friend-search">Search by name or email</Label>
        <Input
          id="friend-search"
          type="search"
          placeholder="Start typing…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1.5"
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted">At least 2 characters. They must accept your request.</p>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {loading && <p className="text-sm text-muted">Searching…</p>}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted">No users found.</p>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {results.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="truncate text-muted">{user.email}</p>
                {user.birthMonth && user.birthDay && (
                  <p className="mt-0.5 text-xs text-muted">
                    Birthday: {formatJalaliBirthday(user.birthMonth, user.birthDay)}
                  </p>
                )}
              </div>
              <div className="shrink-0">{actionButton(user)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
