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
  const [title, setTitle] = useState("جشن تولد");
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
        <Label>عنوان جشن</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {members.length > 1 && (
        <div>
          <Label>متولد</Label>
          <select
            className="w-full rounded-xl border-2 border-party-pink/20 bg-white px-4 py-3"
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
        <Label>شماره کارت ادمین مالی</Label>
        <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} dir="ltr" className="text-left" placeholder="6037..." />
      </div>
      <div>
        <Label>نام صاحب کارت</Label>
        <Input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
      </div>
      <Button onClick={create} disabled={loading || !birthdayUserId}>
        ساخت جشن و لیست هدیه
      </Button>
    </div>
  );
}
