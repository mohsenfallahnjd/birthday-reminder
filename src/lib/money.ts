/** Format integer amount with thousands separators (e.g. 1,500,000). */
export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

/** Parse user input with optional commas into a positive integer or null. */
export function parseAmountInput(value: string): number | null {
  const digits = value.replace(/,/g, "").replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** Keep only digits while typing; returns formatted display string. */
export function formatAmountInputString(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return formatAmount(Number(digits));
}
