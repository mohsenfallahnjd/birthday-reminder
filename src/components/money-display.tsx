import { TomanIcon } from "@/components/toman-icon";
import { formatAmount } from "@/lib/money";
import type { Currency } from "@/lib/currency-format";

export function MoneyDisplay({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: Currency;
  className?: string;
}) {
  if (currency === "usd") {
    return <span className={className}>${formatAmount(amount)}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      {formatAmount(amount)}
      <TomanIcon size={13} className="shrink-0 opacity-80" />
    </span>
  );
}
