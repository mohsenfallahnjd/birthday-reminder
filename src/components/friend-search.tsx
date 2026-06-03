"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { postFriendRequest } from "@/lib/friend-request-client";
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

async function apiFetch(url: string, init?: RequestInit) {
  return fetch(url, { credentials: "same-origin", ...init });
}

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
    try {
      const res = await apiFetch(`/api/people/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (res.ok) setResults(data);
      else setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function sendRequest(userId: string) {
    setActionId(userId);
    setMsg("");
    try {
      const { ok, data } = await postFriendRequest({ userId });
      if (ok) {
        setResults((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  relation: "pending_sent" as const,
                  friendshipId: data.id ?? u.friendshipId,
                }
              : u,
          ),
        );
        void router.refresh();
        void search(query);
      } else {
        setMsg(data.error ?? "Could not send request");
      }
    } catch {
      setMsg("Could not send request");
    } finally {
      setActionId(null);
    }
  }

  async function acceptRequest(friendshipId: string) {
    setActionId(friendshipId);
    try {
      const res = await apiFetch(`/api/people/${friendshipId}`, { method: "PATCH" });
      if (res.ok) {
        setResults((prev) =>
          prev.map((u) =>
            u.friendshipId === friendshipId
              ? { ...u, relation: "friends" as const }
              : u,
          ),
        );
        void router.refresh();
        void search(query);
      }
    } finally {
      setActionId(null);
    }
  }

  async function removeFriendship(friendshipId: string) {
    setActionId(friendshipId);
    try {
      const res = await apiFetch(`/api/people/${friendshipId}`, { method: "DELETE" });
      if (res.ok) {
        setResults((prev) =>
          prev.map((u) =>
            u.friendshipId === friendshipId
              ? { ...u, relation: "none" as const, friendshipId: null }
              : u,
          ),
        );
        void router.refresh();
        void search(query);
      }
    } finally {
      setActionId(null);
    }
  }

  function actionButton(user: SearchUser) {
    const busy = actionId === user.id || actionId === user.friendshipId;

    switch (user.relation) {
      case "friends":
        return (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => user.friendshipId && removeFriendship(user.friendshipId)}
            className="min-h-11"
          >
            {busy ? "…" : "Remove"}
          </Button>
        );
      case "pending_sent":
        return (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <span className="text-xs font-medium text-muted">Request sent</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => user.friendshipId && removeFriendship(user.friendshipId)}
              className="min-h-11"
            >
              {busy ? "…" : "Cancel request"}
            </Button>
          </div>
        );
      case "pending_received":
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={() => user.friendshipId && acceptRequest(user.friendshipId)}
              className="min-h-11 min-w-[5.5rem]"
            >
              {busy ? "…" : "Accept"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => user.friendshipId && removeFriendship(user.friendshipId)}
              className="min-h-11"
            >
              Decline
            </Button>
          </div>
        );
      default:
        return (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={() => sendRequest(user.id)}
            className="min-h-11 min-w-[6.5rem]"
          >
            {busy ? "Sending…" : "Add friend"}
          </Button>
        );
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="users" size={16} className="text-foreground" />
          <Label htmlFor="friend-search">Search by name or email</Label>
        </div>
        <Input
          id="friend-search"
          type="search"
          placeholder="Start typing…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1.5 min-h-11"
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted">
          At least 2 characters. They must accept your request.
        </p>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {loading && <p className="text-sm text-muted">Searching…</p>}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted">No users found. Try their full email below.</p>
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
