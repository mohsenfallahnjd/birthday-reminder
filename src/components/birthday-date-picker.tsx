"use client";

import dynamic from "next/dynamic";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDateSystem } from "@/lib/date-system-context";
import {
  formatJalaliBirthday,
  gregorianToJalali,
  jalaliToGregorian,
  GREGORIAN_MONTHS,
  JALALI_MONTHS,
} from "@/lib/jalali";

const DatePicker = dynamic(() => import("react-multi-date-picker"), { ssr: false });

type DateParts = { year: number; month: number; day: number };

type Props = {
  value?: DateParts | null;
  onChange: (value: DateParts) => void;
  className?: string;
  showYear?: boolean;
};

/**
 * Birthday date picker that adapts to the global date system setting.
 * Internally always stores/emits Jalali month+day+year.
 * When system=gregorian, shows Gregorian calendar and converts on change.
 */
export function BirthdayDatePicker({ value, onChange, className, showYear = true }: Props) {
  const system = useDateSystem();
  const isGregorian = system === "gregorian";

  const pickerValue = useMemo(() => {
    if (!value?.month || !value?.day) return undefined;

    if (isGregorian) {
      const { month: gMonth, day: gDay } = jalaliToGregorian(value.month, value.day, value.year ?? 1379);
      return new DateObject({
        year: value.year ? value.year + 621 : 2000,
        month: gMonth,
        day: gDay,
      });
    }

    return new DateObject({
      calendar: persian,
      year: value.year ?? 1380,
      month: value.month,
      day: value.day,
    });
  }, [value, isGregorian]);

  const displayLabel = useMemo(() => {
    if (!value?.month || !value?.day) return null;
    if (isGregorian) {
      const { month: gMonth, day: gDay } = jalaliToGregorian(value.month, value.day, value.year ?? 1379);
      return `${GREGORIAN_MONTHS[gMonth - 1]} ${gDay}`;
    }
    return formatJalaliBirthday(value.month, value.day, showYear ? value.year : null);
  }, [value, isGregorian, showYear]);

  function handleChange(v: DateObject | DateObject[] | null) {
    if (!v) return;
    const raw = Array.isArray(v) ? v[0] : v;
    if (!raw || typeof raw === "string") return;
    const d = raw as DateObject;

    if (isGregorian) {
      const { month: jMonth, day: jDay } = gregorianToJalali(d.month.number, d.day);
      const jYear = d.year - 621;
      onChange({ year: showYear ? jYear : (value?.year ?? 1380), month: jMonth, day: jDay });
    } else {
      onChange({ year: d.year, month: d.month.number, day: d.day });
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <DatePicker
        {...(isGregorian
          ? { format: showYear ? "YYYY/MM/DD" : "MM/DD" }
          : { calendar: persian, locale: persian_en, format: showYear ? "YYYY/MM/DD" : "MM/DD" }
        )}
        value={pickerValue}
        onChange={handleChange}
        containerClassName="w-full"
        calendarPosition="bottom-center"
        animations={[]}
        arrow={false}
        editable={false}
      />
      {displayLabel && (
        <p className="text-xs text-muted">
          {displayLabel} · {isGregorian ? "Gregorian calendar" : "Jalali (Shamsi) calendar"}
        </p>
      )}
    </div>
  );
}
