"use client";

import { useRouter } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
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
      <Button
        type="button"
        onClick={create}
        loading={loading}
        loadingText="Creating…"
        className="shrink-0 sm:min-w-[8rem]"
      >
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
          loading={loading}
          loadingText="Joining…"
          disabled={!code.trim()}
          className="shrink-0 min-h-11 sm:min-w-[5rem]"
        >
          Join
        </Button>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}

export function DeleteGroupButton({
  groupId,
  groupName,
  partyCount = 0,
}: {
  groupId: string;
  groupName: string;
  partyCount?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    const partyNote =
      partyCount > 0
        ? ` This will also delete ${partyCount} party${partyCount === 1 ? "" : "ies"} in this group.`
        : "";
    if (
      !confirm(
        `Delete "${groupName}"? All members will lose access.${partyNote} This cannot be undone.`,
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push("/groups");
      router.refresh();
    } else {
      setError(data.error ?? "Could not delete group");
    }
  }

  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-4">
      <p className="text-sm font-medium text-foreground">Delete group</p>
      <p className="mt-1 text-xs text-muted">
        Permanently remove this group, its members, and all parties linked to it. Only you as owner
        can do this.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="mt-3 gap-1.5 text-red-600 hover:bg-red-100 hover:text-red-700"
        loading={loading}
        loadingText="Deleting…"
        onClick={remove}
      >
        <Icon name="trash" size={15} className="text-current" />
        Delete group
      </Button>
    </div>
  );
}
