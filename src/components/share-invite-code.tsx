"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  groupInviteShareMessage,
  groupJoinPath,
  groupJoinUrl,
} from "@/lib/invite";

type ShareInviteCodeProps = {
  inviteCode: string;
  groupName: string;
  /** Server-side origin from NEXT_PUBLIC_APP_URL */
  appOrigin?: string;
  compact?: boolean;
};

export function ShareInviteCode({
  inviteCode,
  groupName,
  appOrigin,
  compact = false,
}: ShareInviteCodeProps) {
  const [copied, setCopied] = useState<"code" | "link" | "all" | null>(null);
  const [shareError, setShareError] = useState("");

  const origin = useMemo(() => {
    if (appOrigin) return appOrigin.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, [appOrigin]);

  const joinUrl = groupJoinUrl(inviteCode, origin || "http://localhost:3000");
  const joinPath = groupJoinPath(inviteCode);
  const shareText = groupInviteShareMessage(groupName, inviteCode, origin || "http://localhost:3000");

  async function copyText(text: string, kind: "code" | "link" | "all") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setShareError("Could not copy — select the code and copy manually.");
    }
  }

  async function shareNative() {
    setShareError("");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName}`,
          text: shareText,
          url: joinUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    await copyText(shareText, "all");
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted-subtle px-2 py-1 font-mono text-xs">{inviteCode}</code>
        <Button type="button" size="sm" variant="outline" onClick={() => copyText(inviteCode, "code")}>
          {copied === "code" ? "Copied" : "Copy"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={shareNative}>
          Share
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start gap-2">
        <Icon name="users" size={18} className="mt-0.5 text-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Invite friends</p>
          <p className="mt-0.5 text-xs text-muted">
            Share the code or link. They open it, sign in, and tap Join — or paste the code on Groups.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-muted-subtle px-4 py-3 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Party code</p>
        <p className="mt-1 break-all font-mono text-xl font-semibold tracking-wide text-foreground">
          {inviteCode}
        </p>
      </div>

      <p className="mt-2 truncate font-mono text-xs text-muted" title={joinUrl}>
        {joinPath}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="min-h-11"
          onClick={() => copyText(inviteCode, "code")}
        >
          <Icon name="copy" size={14} className="text-white" />
          {copied === "code" ? "Copied" : "Copy code"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11"
          onClick={() => copyText(joinUrl, "link")}
        >
          {copied === "link" ? "Copied" : "Copy link"}
        </Button>
        <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={shareNative}>
          <Icon name="share" size={14} className="text-foreground" />
          Share
        </Button>
      </div>

      {copied === "all" && (
        <p className="mt-2 text-sm text-emerald-700">Invite message copied to clipboard.</p>
      )}
      {shareError && <p className="mt-2 text-sm text-red-600">{shareError}</p>}
    </div>
  );
}
