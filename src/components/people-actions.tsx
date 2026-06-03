"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AcceptFriendButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={loading}
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
      size="sm"
      variant="ghost"
      disabled={loading}
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
      size="sm"
      variant="outline"
      disabled={loading}
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
      size="sm"
      variant="ghost"
      className="text-red-600 hover:text-red-700"
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
