"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { CRYPTO_COINS, type CryptoAddresses } from "@/lib/crypto-wallets";

export function CryptoAddressesForm({ initial }: { initial: CryptoAddresses }) {
  const [values, setValues] = useState<CryptoAddresses>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function set(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/profile/crypto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(values),
    });
    setBusy(false);
    if (res.ok) setMsg({ text: "Saved", ok: true });
    else setMsg({ text: "Could not save", ok: false });
  }

  return (
    <div className="space-y-3">
      {CRYPTO_COINS.map((coin) => (
        <div key={coin.id} className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-center text-base" title={coin.label}>
            {coin.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <Label className="sr-only">{coin.label} address</Label>
            <Input
              value={values[coin.id] ?? ""}
              onChange={(e) => set(coin.id, e.target.value)}
              placeholder={`${coin.symbol} address`}
              className="font-mono text-xs"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save wallets"}
        </button>
        {msg && (
          <span className={`text-xs font-medium ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
