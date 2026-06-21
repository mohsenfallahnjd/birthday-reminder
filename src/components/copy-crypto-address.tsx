"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export function CopyCryptoAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg border border-border bg-muted-subtle px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-border hover:text-foreground"
    >
      {copied ? (
        <span className="text-emerald-600">Copied</span>
      ) : (
        <Icon name="copy" size={13} />
      )}
    </button>
  );
}
