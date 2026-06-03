"use client";

import dynamic from "next/dynamic";
import type { Value } from "react-multi-date-picker";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const DatePicker = dynamic(() => import("react-multi-date-picker"), { ssr: false });

type PersianDatePickerProps = {
  value?: { year: number; month: number; day: number } | null;
  onChange: (value: { year: number; month: number; day: number }) => void;
  className?: string;
  onlyMonthDay?: boolean;
};

export function PersianDatePicker({
  value,
  onChange,
  className,
  onlyMonthDay = true,
}: PersianDatePickerProps) {
  const pickerValue = useMemo(() => {
    if (!value?.month || !value?.day) return undefined;
    const y = value.year ?? 1403;
    return new Date(y, value.month - 1, value.day);
  }, [value]);

  return (
    <div className={cn("persian-picker", className)}>
      <DatePicker
        calendar="persian"
        locale="persian_fa"
        format={onlyMonthDay ? "DD MMMM" : "DD MMMM YYYY"}
        value={pickerValue}
        onChange={(v: Value) => {
          if (!v || typeof v === "string") return;
          const raw = Array.isArray(v) ? v[0] : v;
          if (!raw || typeof raw === "string") return;
          const d = raw as { year: number; month: { number: number }; day: number };
          onChange({
            year: d.year,
            month: d.month.number,
            day: d.day,
          });
        }}
        inputClass="w-full rounded-xl border-2 border-party-pink/20 bg-white px-4 py-3 text-party-ink placeholder:text-party-ink/40 focus:border-party-fuchsia focus:outline-none focus:ring-2 focus:ring-party-pink/30"
        containerClassName="w-full"
        calendarPosition="bottom-center"
        animations={[]}
      />
      <p className="mt-2 text-xs text-party-ink/50">
        تاریخ تولد شمسی — ماه و روز برای یادآوری کافی است
      </p>
    </div>
  );
}
