import { cookies } from "next/headers";
import type { Currency } from "@/lib/currency-format";

export type { Currency } from "@/lib/currency-format";
export { formatMoney } from "@/lib/currency-format";

export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  const val = store.get("currency")?.value;
  return val === "usd" ? "usd" : "toman";
}
