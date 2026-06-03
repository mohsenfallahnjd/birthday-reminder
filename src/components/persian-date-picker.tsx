"use client";

import dynamic from "next/dynamic";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatJalaliBirthday } from "@/lib/jalali";

const DatePicker = dynamic(() => import("react-multi-date-picker"), { ssr: false });

type PersianDatePickerProps = {
  value?: { year: number; month: number; day: number } | null;
  onChange: (value: { year: number; month: number; day: number }) => void;
  className?: string;
  showYear?: boolean;
};

export function PersianDatePicker({
  value,
  onChange,
  className,
  showYear = true,
}: PersianDatePickerProps) {
  const format = showYear ? "YYYY/MM/DD" : "MM/DD";

  const pickerValue = useMemo(() => {
    if (!value?.month || !value?.day) return undefined;
    return new DateObject({
      calendar: persian,
      year: value.year ?? 1403,
      month: value.month,
      day: value.day,
    });
  }, [value]);

  const displayLabel =
    value?.month && value?.day
      ? formatJalaliBirthday(value.month, value.day, showYear ? value.year : null)
      : null;

  return (
    <div className={cn("persian-picker space-y-1.5", className)}>
      <DatePicker
        calendar={persian}
        locale={persian_en}
        format={format}
        value={pickerValue}
        onChange={(v) => {
          if (!v) return;
          const raw = Array.isArray(v) ? v[0] : v;
          if (!raw || typeof raw === "string") return;
          const d = raw as DateObject;
          onChange({
            year: d.year,
            month: d.month.number,
            day: d.day,
          });
        }}
        containerClassName="w-full"
        calendarPosition="bottom-center"
        animations={[]}
        arrow={false}
        editable={false}
      />
      {displayLabel && (
        <p className="text-xs text-muted">{displayLabel} · Shamsi calendar</p>
      )}
    </div>
  );
}
