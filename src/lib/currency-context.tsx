"use client";

import { createContext, useContext } from "react";
import type { Currency } from "@/lib/currency-format";
import { formatMoney } from "@/lib/currency-format";

const CurrencyContext = createContext<Currency>("toman");

export function CurrencyProvider({ children, value }: { children: React.ReactNode; value: Currency }) {
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): Currency {
  return useContext(CurrencyContext);
}

export function useFormatMoney(): (amount: number) => string {
  const currency = useCurrency();
  return (amount: number) => formatMoney(amount, currency);
}
