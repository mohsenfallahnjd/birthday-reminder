"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AddFriendForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setEmail("");
      router.refresh();
    } else {
      setMsg(data.error);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Friend&apos;s email</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-11"
        />
        <Button onClick={add} disabled={loading} className="shrink-0 sm:min-w-[5rem]">
          Invite
        </Button>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}

export function AcceptFriendButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  return (
    <Button
      size="sm"
      onClick={async () => {
        await fetch("/api/people/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendshipId }),
        });
        router.refresh();
      }}
    >
      Accept
    </Button>
  );
}
