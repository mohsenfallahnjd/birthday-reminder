"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import Link from "next/link";

export function ShareProfileButton({
  profileToken,
  username,
  name,
}: {
  profileToken: string;
  username: string | null;
  name: string;
}) {
  const [copied, setCopied] = useState(false);

  const slug = username ?? profileToken;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${slug}`
      : `/u/${slug}`;

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${name}'s Wishlist`,
          text: `Check out ${name}'s birthday wishlist`,
          url,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted break-all rounded-lg bg-muted-subtle px-3 py-2">
        /u/{slug}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={share}
          className="gap-2"
        >
          <Icon
            name={copied ? "copy" : "share"}
            size={14}
            className="text-foreground"
          />
          {copied ? "Copied!" : "Share wishlist link"}
        </Button>
        <Link href={url} target="_blank">
          <Button type="button" variant="outline" className="gap-2">
            <Icon name="users" size={14} className="text-foreground" />
            open profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
