import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatToman(amount: number) {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}
