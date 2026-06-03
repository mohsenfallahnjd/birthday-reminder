"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { formatAmountInputString, parseAmountInput } from "@/lib/money";
import { cn } from "@/lib/utils";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function MoneyInput({ value, onValueChange, className, placeholder, ...props }: MoneyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder ?? "0"}
      className={cn("tabular-nums", className)}
      value={value}
      onChange={(e) => {
        const formatted = formatAmountInputString(e.target.value);
        onValueChange(formatted);
      }}
      onBlur={() => {
        const parsed = parseAmountInput(value);
        if (parsed) onValueChange(formatAmountInputString(String(parsed)));
      }}
    />
  );
}

export function getAmountFromInput(value: string) {
  return parseAmountInput(value);
}
