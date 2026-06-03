"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AddFriendByEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function add() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    setMsg("");
    setOk(false);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail("");
        setOk(true);
        router.refresh();
      } else {
        setMsg(data.error ?? "Could not send request");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon name="heart" size={16} className="text-foreground" />
        <Label htmlFor="add-friend-email" className="text-sm font-medium text-foreground">
          Add by email
        </Label>
      </div>
      <p className="mt-1 text-xs text-muted">
        Know their address? Send a request even if they do not appear in search.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          id="add-friend-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setOk(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="min-h-11"
        />
        <Button
          type="button"
          variant="primary"
          disabled={loading || !email.trim()}
          onClick={add}
          className="shrink-0 min-h-11 sm:min-w-[7rem]"
        >
          {loading ? "Sending…" : "Add friend"}
        </Button>
      </div>
      {ok && <p className="mt-2 text-sm text-emerald-700">Request sent.</p>}
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
    </div>
  );
}

export function AcceptFriendButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={loading}
        className="min-h-11"
        onClick={async () => {
          setLoading(true);
          await fetch(`/api/people/${friendshipId}`, { method: "PATCH" });
          setLoading(false);
          router.refresh();
        }}
      >
        {loading ? "…" : "Accept"}
      </Button>
      <DeclineFriendButton friendshipId={friendshipId} />
    </div>
  );
}

export function DeclineFriendButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={loading}
      className="min-h-11"
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? "…" : "Decline"}
    </Button>
  );
}

export function CancelRequestButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={loading}
      className="min-h-11"
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? "…" : "Cancel"}
    </Button>
  );
}

export function RemoveFriendButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="min-h-11 text-red-600 hover:text-red-700"
      disabled={loading}
      onClick={async () => {
        if (!confirm("Remove this friend?")) return;
        setLoading(true);
        await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? "…" : "Remove"}
    </Button>
  );
}
