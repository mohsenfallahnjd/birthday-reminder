"use client";

import { useState } from "react";

export function CopyCardButton({ cardNumber }: { cardNumber: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const clean = cardNumber.replace(/-/g, "");
    await navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-muted-subtle px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      {copied ? "✓ Copied" : "Copy number"}
    </button>
  );
}
