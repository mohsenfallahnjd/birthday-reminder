"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { PersianDatePicker } from "@/components/persian-date-picker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AvatarPicker } from "@/components/avatar-picker";
import { Link } from "@/components/link";

type Props = {
  initial: {
    name: string;
    avatarUrl: string | null;
    birthMonth: number | null;
    birthDay: number | null;
    birthYear: number | null;
    username: string | null;
  };
};

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [username, setUsername] = useState(initial.username ?? "");
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
        avatarUrl,
        birthMonth: birth.month,
        birthDay: birth.day,
        birthYear: birth.year,
        username: username.trim() || null,
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
    <div className="space-y-6">
      <AvatarPicker
        name={name.trim() || "You"}
        initialAvatarUrl={initial.avatarUrl}
        onChange={setAvatarUrl}
      />

      <div>
        <Label>Display name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Username</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="your_username"
            className="pl-7"
          />
        </div>
        <p className="mt-1 text-xs text-muted">Lowercase letters, numbers, underscores. Used in your profile URL.</p>
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
