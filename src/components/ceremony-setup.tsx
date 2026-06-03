"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Member = { id: string; name: string };

export function CeremonySetup({
  groupId,
  members,
  defaultBirthdayUserId,
}: {
  groupId?: string;
  members: Member[];
  defaultBirthdayUserId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Birthday party");
  const [birthdayUserId, setBirthdayUserId] = useState(defaultBirthdayUserId ?? members[0]?.id ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/ceremonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        birthdayUserId,
        groupId,
        cardNumber: cardNumber || undefined,
        cardHolder: cardHolder || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push(`/ceremonies/${data.id}`);
  }

  return (
    <div className="space-y-3 mt-4">
      <div>
        <Label>Party title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {members.length > 1 && (
        <div>
          <Label>Birthday person</Label>
          <select
            className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
            value={birthdayUserId}
            onChange={(e) => setBirthdayUserId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label>Treasurer card number</Label>
        <Input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="font-mono"
          placeholder="6037..."
        />
      </div>
      <div>
        <Label>Cardholder name</Label>
        <Input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
      </div>
      <p className="text-xs text-muted">
        After creating the party, the birthday person can add wishlist items on the party page
        or from <strong>My wishlist</strong> in the nav.
      </p>
      <Button onClick={create} disabled={loading || !birthdayUserId}>
        Create party
      </Button>
    </div>
  );
}
