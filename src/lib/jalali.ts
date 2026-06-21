import dayjs from "dayjs";
import jalaliday from "jalaliday/dayjs";

dayjs.extend(jalaliday);

export type DateSystem = "jalali" | "gregorian";

export type JalaliDateParts = {
  year: number;
  month: number;
  day: number;
};

export const JALALI_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];

export const GREGORIAN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function gregorianDaysInMonth(month: number): number {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 30;
}

export function jalaliDaysInMonth(month: number): number {
  return month <= 6 ? 31 : month <= 11 ? 30 : 29;
}

/** Convert a Gregorian month+day to Jalali month+day (uses year 2000 as representative). */
export function gregorianToJalali(
  gMonth: number,
  gDay: number,
): { month: number; day: number } {
  const mm = String(gMonth).padStart(2, "0");
  const dd = String(gDay).padStart(2, "0");
  const d = dayjs(`2000-${mm}-${dd}`).calendar("jalali");
  return { month: d.month() + 1, day: d.date() };
}

/** Convert a Jalali month+day (+ optional year) to Gregorian month+day. */
export function jalaliToGregorian(
  jMonth: number,
  jDay: number,
  jYear = 1379,
): { month: number; day: number } {
  const yy = String(jYear).padStart(4, "0");
  const mm = String(jMonth).padStart(2, "0");
  const dd = String(jDay).padStart(2, "0");
  const d = dayjs(`${yy}/${mm}/${dd}`, { jalali: true } as Record<string, unknown>);
  const native = d.toDate();
  return { month: native.getMonth() + 1, day: native.getDate() };
}

export function getTodayJalali(): JalaliDateParts {
  const j = dayjs().calendar("jalali");
  return { year: j.year(), month: j.month() + 1, day: j.date() };
}

export function formatJalaliBirthday(
  month: number,
  day: number,
  year?: number | null,
) {
  const monthName = JALALI_MONTHS[month - 1] ?? String(month);
  const base = `${monthName} ${day}`;
  return year ? `${base}, ${year}` : base;
}

export function formatJalaliNumeric(
  month: number,
  day: number,
  year?: number | null,
) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const md = `${pad(month)}/${pad(day)}`;
  return year ? `${year}/${md}` : md;
}

export function daysUntilJalaliBirthday(
  birthMonth: number,
  birthDay: number,
): number {
  const today = getTodayJalali();
  let targetYear = today.year;

  const isPastThisYear =
    birthMonth < today.month ||
    (birthMonth === today.month && birthDay < today.day);

  if (isPastThisYear) targetYear += 1;

  const todayGreg = dayjs()
    .calendar("jalali")
    .year(today.year)
    .month(today.month - 1)
    .date(today.day);

  const targetGreg = dayjs()
    .calendar("jalali")
    .year(targetYear)
    .month(birthMonth - 1)
    .date(birthDay);

  return targetGreg.diff(todayGreg, "day");
}

export function isBirthdayWithinDays(
  birthMonth: number,
  birthDay: number,
  daysBefore: number,
): boolean {
  const until = daysUntilJalaliBirthday(birthMonth, birthDay);
  return until >= 0 && until <= daysBefore;
}

export function formatTodayDate(system: DateSystem): string {
  if (system === "gregorian") {
    return dayjs().format("D, MMMM YYYY");
  }
  const { year, month, day } = getTodayJalali();
  return `${day}, ${JALALI_MONTHS[month - 1]} ${year}`;
}

export function formatBirthdayBySystem(
  month: number,
  day: number,
  year: number | null | undefined,
  system: DateSystem,
): string {
  if (system === "gregorian") {
    const { month: gMonth, day: gDay } = jalaliToGregorian(month, day);
    return `${GREGORIAN_MONTHS[gMonth - 1]} ${gDay}`;
  }
  return formatJalaliBirthday(month, day, year);
}
