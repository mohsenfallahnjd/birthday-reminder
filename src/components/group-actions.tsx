"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    const data = await res.json();
    setLoading(false);
    if (res.ok && data.id) {
      setName("");
      router.push(`/groups/${data.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Group name, e.g. College friends"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-h-11"
      />
      <Button onClick={create} disabled={loading} className="shrink-0 sm:min-w-[8rem]">
        Create group
      </Button>
    </div>
  );
}

export function JoinGroupForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  async function join() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: trimmed }),
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
      <Label>Party / group code</Label>
      {initialCode && (
        <p className="text-xs text-muted">Code from your invite link is filled in below.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste code here"
          className="min-h-11 font-mono"
        />
        <Button
          type="button"
          variant="primary"
          onClick={join}
          disabled={loading || !code.trim()}
          className="shrink-0 min-h-11 sm:min-w-[5rem]"
        >
          Join
        </Button>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
