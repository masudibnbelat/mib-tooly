// src/components/Date/CalenderHelper.ts

export function ordSuffix(d: number) {
  if (d >= 11 && d <= 13) return "th";
  return ["th", "st", "nd", "rd"][d % 10] ?? "th";
}
export function sameDate(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

export function toBanglaDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const leapEn = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const cutoff = leapEn
    ? [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = 0;
  for (let i = 0; i < m - 1; i++) dayOfYear += cutoff[i];
  dayOfYear += d;
  const leapBn =
    ((y + 594) % 4 === 0 && (y + 594) % 100 !== 0) || (y + 594) % 400 === 0;
  const bnStart = 80;
  let bYear: number,
    bMonth = 0,
    bDay = 1;
  if (dayOfYear < bnStart) {
    bYear = y - 1 + 593;
    const prevLeap =
      ((y + 593) % 4 === 0 && (y + 593) % 100 !== 0) || (y + 593) % 400 === 0;
    const prevYearDays = prevLeap ? 366 : 365;
    const dFromBnNew = prevYearDays - bnStart + 1 + dayOfYear;
    let acc = 0;
    for (bMonth = 0; bMonth < 12; bMonth++) {
      const mdays =
        bMonth < 5 ? 31 : bMonth === 11 ? 14 + (prevLeap ? 1 : 0) : 30;
      if (dFromBnNew <= acc + mdays) {
        bDay = dFromBnNew - acc;
        break;
      }
      acc += mdays;
    }
  } else {
    bYear = y + 593;
    const dFromBnNew = dayOfYear - bnStart + 1;
    let acc = 0;
    for (bMonth = 0; bMonth < 12; bMonth++) {
      const mdays =
        bMonth < 5 ? 31 : bMonth === 11 ? 14 + (leapBn ? 1 : 0) : 30;
      if (dFromBnNew <= acc + mdays) {
        bDay = dFromBnNew - acc;
        break;
      }
      acc += mdays;
    }
  }
  return { day: bDay, month: bMonth, year: bYear };
}

export const hijriFormatter = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura",
  {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  },
);

export function toHijriDate(date: Date) {
  const parts = hijriFormatter.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    day: Number(get("day")),
    month: Number(get("month")) - 1,
    year: Number(get("year")),
  };
}

export function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const prevMonthDays = daysInMonth(year, month - 1);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      inMonth: false,
    });
  for (let i = 1; i <= totalDays; i++)
    cells.push({ date: new Date(year, month, i), inMonth: true });
  while (cells.length < 42) {
    const nextDay = cells.length - (firstDay + totalDays) + 1;
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
  }
  return cells;
}
