"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || hidden) return null;

  return (
    <div
      className="fixed left-4 right-4 z-40 mx-auto max-w-md rounded-lg border border-border bg-white p-4 shadow-lg md:bottom-4 md:left-auto md:right-4"
      style={{ bottom: "calc(var(--mobile-nav-height, 3.5rem) + env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <p className="text-sm font-medium text-foreground">Install Birthday app</p>
      <p className="mt-1 text-xs text-muted">Add to home screen for push alerts and quick access.</p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            setHidden(true);
          }}
        >
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setHidden(true)}>
          Later
        </Button>
      </div>
    </div>
  );
}
