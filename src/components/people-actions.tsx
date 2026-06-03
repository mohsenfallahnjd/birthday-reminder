"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { postFriendRequest } from "@/lib/friend-request-client";

export function AddFriendByEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function add() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || loading) return;
    setLoading(true);
    setMsg("");
    setOk(false);
    try {
      const { ok, data } = await postFriendRequest({ email: trimmed });
      if (ok) {
        setOk(true);
        setMsg("");
        void router.refresh();
      } else {
        setMsg(data.error ?? "Could not send request");
      }
    } catch {
      setMsg("Could not send request");
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
          onKeyDown={(e) => e.key === "Enter" && !loading && add()}
          className="min-h-11"
          disabled={loading}
        />
        <Button
          type="button"
          variant="primary"
          loading={loading}
          loadingText="Sending…"
          onClick={add}
          className="shrink-0 min-h-11 sm:min-w-[7rem]"
        >
          Add friend
        </Button>
      </div>
      {ok && (
        <p className="mt-2 text-sm text-emerald-700">
          Request sent. They will get an alert in Notifications (and push if enabled).
        </p>
      )}
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
        className="min-h-11"
        loading={loading}
        loadingText="Accepting…"
        onClick={async () => {
          setLoading(true);
          try {
            await fetch(`/api/people/${friendshipId}`, { method: "PATCH" });
            router.refresh();
          } finally {
            setLoading(false);
          }
        }}
      >
        Accept
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
      className="min-h-11"
      loading={loading}
      loadingText="Declining…"
      onClick={async () => {
        setLoading(true);
        try {
          await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      Decline
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
      className="min-h-11"
      loading={loading}
      loadingText="Canceling…"
      onClick={async () => {
        setLoading(true);
        try {
          await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      Cancel
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
      loading={loading}
      loadingText="Removing…"
      onClick={async () => {
        if (!confirm("Remove this friend?")) return;
        setLoading(true);
        try {
          await fetch(`/api/people/${friendshipId}`, { method: "DELETE" });
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      Remove
    </Button>
  );
}
