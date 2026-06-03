"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { PersianDatePicker } from "@/components/persian-date-picker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link } from "@/components/link";

type Props = {
  initial: {
    name: string;
    birthMonth: number | null;
    birthDay: number | null;
    birthYear: number | null;
  };
};

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [birth, setBirth] = useState({
    year: initial.birthYear ?? 1370,
    month: initial.birthMonth ?? 1,
    day: initial.birthDay ?? 1,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        birthMonth: birth.month,
        birthDay: birth.day,
        birthYear: birth.year,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg("Saved!");
      router.refresh();
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Display name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Birthday (Jalali / Shamsi)</Label>
        <PersianDatePicker value={birth} onChange={setBirth} showYear />
      </div>
      <p className="text-sm text-muted">
        Manage gifts you want on{" "}
        <Link href="/wishlist" className="text-foreground font-medium">
          your wishlist
        </Link>
        .
      </p>
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <Button
        type="button"
        onClick={save}
        loading={loading}
        loadingText="Saving…"
        className="w-full"
      >
        Save profile
      </Button>
    </div>
  );
}
