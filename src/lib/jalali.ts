import dayjs from "dayjs";
import jalaliday from "jalaliday/dayjs";

dayjs.extend(jalaliday);

export type JalaliDateParts = {
  year: number;
  month: number;
  day: number;
};

export function getTodayJalali(): JalaliDateParts {
  const j = dayjs().calendar("jalali");
  return { year: j.year(), month: j.month() + 1, day: j.date() };
}

export function formatJalaliBirthday(
  month: number,
  day: number,
  year?: number | null,
) {
  const months = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];
  const base = `${day} ${months[month - 1]}`;
  return year ? `${base} ${year}` : base;
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
