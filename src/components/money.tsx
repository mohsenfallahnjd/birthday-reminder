"use client";

import { useFormatMoney, useCurrency } from "@/lib/currency-context";
import { TomanIcon } from "@/components/toman-icon";
import { formatAmount } from "@/lib/money";

export function Money({ amount, className }: { amount: number; className?: string }) {
  const currency = useCurrency();
  const formatted = formatAmount(amount);

  if (currency === "usd") {
    return <span className={className}>${formatted}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      {formatted}
      <TomanIcon size={13} className="shrink-0 opacity-80" />
    </span>
  );
}
