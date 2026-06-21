import { formatAmount } from "@/lib/money";

export type Currency = "toman" | "usd";

export function formatMoney(amount: number, currency: Currency = "toman"): string {
  if (currency === "usd") return `$${formatAmount(amount)}`;
  return `${formatAmount(amount)} تومان`;
}
