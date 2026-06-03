"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PersianDatePicker } from "@/components/persian-date-picker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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
      setMsg("ذخیره شد!");
      router.refresh();
    } else {
      const d = await res.json();
      setMsg(d.error ?? "خطا");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>نام نمایشی</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>تاریخ تولد (شمسی)</Label>
        <PersianDatePicker value={birth} onChange={setBirth} onlyMonthDay={false} />
      </div>
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <Button onClick={save} disabled={loading} className="w-full">
        ذخیره پروفایل
      </Button>
    </div>
  );
}
