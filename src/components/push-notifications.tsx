"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushNotifications() {
  const [status, setStatus] = useState<
    "loading" | "unsupported" | "unconfigured" | "default" | "granted" | "denied"
  >("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const checkStatus = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    const res = await fetch("/api/push/vapid-key");
    const data = await res.json();
    if (!data.configured || !data.publicKey) {
      setStatus("unconfigured");
      return;
    }

    const perm = Notification.permission;
    if (perm === "granted") setStatus("granted");
    else if (perm === "denied") setStatus("denied");
    else setStatus("default");
  }, []);

  useEffect(() => {
    checkStatus();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [checkStatus]);

  async function enablePush() {
    setBusy(true);
    setMessage("");
    try {
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey, configured } = await keyRes.json();
      if (!configured || !publicKey) {
        setMessage("Push is not configured on the server.");
        setStatus("unconfigured");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Permission denied. Enable notifications in browser settings.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const json = sub.toJSON();
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        setMessage(err.error ?? "Could not save subscription");
        return;
      }

      setStatus("granted");
      setMessage("Push notifications enabled.");
    } catch {
      setMessage("Could not enable push. Try again or use HTTPS.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      } else {
        await fetch("/api/push/subscribe", { method: "DELETE" });
      }
      setStatus("default");
      setMessage("Push notifications turned off.");
    } catch {
      setMessage("Could not disable push.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-muted">Checking push support…</p>;
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted">
        Push is not supported in this browser. Install the app on a phone or use Chrome.
      </p>
    );
  }

  if (status === "unconfigured") {
    return (
      <p className="text-sm text-muted">
        Server push keys are missing. Add VAPID keys to <code className="text-xs">.env</code>.
      </p>
    );
  }

  return (
    <div className="space-y-3 border-t border-border pt-8">
      <div>
        <h3 className="text-sm font-medium text-foreground">Push notifications</h3>
        <p className="mt-1 text-sm text-muted">
          Get birthday reminders and party updates on this device. Install as PWA for best results.
        </p>
      </div>

      {status === "denied" && (
        <p className="text-sm text-amber-700">
          Notifications are blocked. Allow them in your browser or OS settings.
        </p>
      )}

      {status === "granted" ? (
        <Button variant="outline" size="sm" onClick={disablePush} disabled={busy}>
          Turn off push
        </Button>
      ) : (
        <Button size="sm" onClick={enablePush} disabled={busy || status === "denied"}>
          {busy ? "Enabling…" : "Enable push notifications"}
        </Button>
      )}

      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
