"use client";

import { createContext, useContext } from "react";
import type { DateSystem } from "@/lib/jalali";

const DateSystemContext = createContext<DateSystem>("jalali");

export function DateSystemProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DateSystem;
}) {
  return (
    <DateSystemContext.Provider value={value}>
      {children}
    </DateSystemContext.Provider>
  );
}

export function useDateSystem(): DateSystem {
  return useContext(DateSystemContext);
}
