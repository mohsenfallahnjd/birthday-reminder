import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { formatAmount } from "@/lib/money";

export function formatMoney(amount: number) {
  return `${formatAmount(amount)} Toman`;
}
