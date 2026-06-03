"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      router.refresh();
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="نام گروه، مثلاً همکلاسی‌ها"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button onClick={create} disabled={loading}>
        ساخت گروه
      </Button>
    </div>
  );
}

export function JoinGroupForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(`/groups/${data.groupId}`);
    } else {
      setMsg(data.error);
    }
  }

  return (
    <div className="space-y-2">
      <Label>کد دعوت گروه</Label>
      <div className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" className="text-left" />
        <Button variant="outline" onClick={join} disabled={loading}>
          پیوستن
        </Button>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
