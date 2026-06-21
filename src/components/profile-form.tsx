"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { BirthdayDatePicker } from "@/components/birthday-date-picker";
import { useDateSystem } from "@/lib/date-system-context";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AvatarPicker } from "@/components/avatar-picker";

type Props = {
  initial: {
    name: string;
    avatarUrl: string | null;
    birthMonth: number | null;
    birthDay: number | null;
    birthYear: number | null;
    username: string | null;
    cardNumber: string | null;
    cardHolder: string | null;
  };
};

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const dateSystem = useDateSystem();
  const [name, setName] = useState(initial.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [username, setUsername] = useState(initial.username ?? "");
  const [cardNumber, setCardNumber] = useState(
    initial.cardNumber
      ? initial.cardNumber.replace(/(.{4})/g, "$1-").replace(/-$/, "")
      : ""
  );
  const [cardHolder, setCardHolder] = useState(initial.cardHolder ?? "");
  const [birth, setBirth] = useState({
    year: initial.birthYear ?? 1370,
    month: initial.birthMonth ?? 1,
    day: initial.birthDay ?? 1,
  });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  function formatCard(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "");
  }

  async function save() {
    setLoading(true);
    setMsg(null);
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
        cardNumber: cardNumber.replace(/-/g, "").trim() || null,
        cardHolder: cardHolder.trim() || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg({ text: "Profile saved", ok: true });
      router.refresh();
    } else {
      const d = await res.json();
      setMsg({ text: d.error ?? "Could not save", ok: false });
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="flex justify-center">
        <AvatarPicker name={name.trim() || "You"} initialAvatarUrl={initial.avatarUrl} onChange={setAvatarUrl} />
      </div>

      <Divider label="Identity" />

      {/* Name */}
      <div>
        <Label>Display name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>

      {/* Username */}
      <div>
        <Label>Username</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted select-none">@</span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="your_username"
            className="pl-7"
          />
        </div>
        <p className="mt-1 text-[11px] text-muted">Letters, numbers, underscores. Sets your profile URL: <span className="font-mono">/u/{username || "username"}</span></p>
      </div>

      <Divider label="Birthday" />

      {/* Birthday */}
      <div>
        <Label>Birthday ({dateSystem === "jalali" ? "Jalali / Shamsi" : "Gregorian"})</Label>
        <BirthdayDatePicker value={birth} onChange={setBirth} showYear />
      </div>

      <Divider label="Bank card" />

      {/* Card */}
      <div>
        <Label>Card number</Label>
        <Input
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCard(e.target.value))}
          placeholder="1234-5678-9012-3456"
          inputMode="numeric"
          dir="ltr"
          className="font-mono tracking-wider"
        />
        <p className="mt-1 text-[11px] text-muted">Shown on public profile so friends can transfer directly.</p>
      </div>

      <div>
        <Label>Card holder name</Label>
        <Input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Name on card" />
      </div>

      {/* Save */}
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {msg.ok ? "✓ " : ""}{msg.text}
        </p>
      )}
      <Button type="button" onClick={save} loading={loading} loadingText="Saving…" className="w-full" variant="primary">
        Save profile
      </Button>
    </div>
  );
}
