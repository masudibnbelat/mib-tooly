"use client";

import { useEffect, useMemo, useState } from "react";
import SelectOption, { SelectOptionItem } from "../ui/SelectOption";

const EN_MONTHS = [
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

const EN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EN_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BN_MONTHS = [
  "Boishakh",
  "Jyoishtho",
  "Asharh",
  "Shrabon",
  "Bhadro",
  "Ashwin",
  "Kartik",
  "Ogrohayon",
  "Poush",
  "Magh",
  "Falgun",
  "Choitro",
];

const BN_MONTHS_SHORT = [
  "Boi",
  "Jyo",
  "Ash",
  "Shr",
  "Bha",
  "Ashw",
  "Kar",
  "Ogr",
  "Pou",
  "Mag",
  "Fal",
  "Cho",
];

const BN_SEASONS = [
  "Summer",
  "Summer",
  "Monsoon",
  "Monsoon",
  "Autumn",
  "Autumn",
  "Late Autumn",
  "Late Autumn",
  "Winter",
  "Winter",
  "Spring",
  "Spring",
];

const BN_SEASON_ICONS = [
  "☀️",
  "☀️",
  "🌧️",
  "🌧️",
  "🍂",
  "🍂",
  "🌾",
  "🌾",
  "❄️",
  "❄️",
  "🌸",
  "🌸",
];

const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Ula",
  "Jumada al-Akhirah",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhul-Qadah",
  "Dhul-Hijjah",
];

const HIJRI_MONTHS_SHORT = [
  "Muh",
  "Saf",
  "Rab-I",
  "Rab-II",
  "Jum-I",
  "Jum-II",
  "Raj",
  "Sha",
  "Ram",
  "Shaw",
  "Dhu-Q",
  "Dhu-H",
];

const MONTH_OPTIONS: SelectOptionItem[] = EN_MONTHS.map((label, index) => ({
  label,
  value: String(index),
}));

const YEAR_OPTIONS: SelectOptionItem[] = Array.from({ length: 301 }, (_, i) => {
  const year = 1900 + i;
  return { label: String(year), value: String(year) };
});

const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

function ordSuffix(d: number) {
  if (d >= 11 && d <= 13) return "th";
  return ["th", "st", "nd", "rd"][d % 10] ?? "th";
}

function sameDate(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toBanglaDate(date: Date) {
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
  let bYear: number;
  let bMonth = 0;
  let bDay = 1;

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

function toHijriDate(date: Date) {
  const parts = hijriFormatter.formatToParts(date);

  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    day: Number(getPart("day")),
    month: Number(getPart("month")) - 1,
    year: Number(getPart("year")),
  };
}

function formatEnglish(date: Date) {
  return `${date.getDate()}${ordSuffix(date.getDate())} ${
    EN_MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const prevMonthDays = daysInMonth(year, month - 1);

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      inMonth: false,
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    cells.push({
      date: new Date(year, month, i),
      inMonth: true,
    });
  }

  while (cells.length < 42) {
    const nextDay = cells.length - (firstDay + totalDays) + 1;
    cells.push({
      date: new Date(year, month + 1, nextDay),
      inMonth: false,
    });
  }

  return cells;
}

export default function MultiCalendar() {
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const currentTime = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now],
  );

  const todayBn = useMemo(() => toBanglaDate(today), [today]);
  const todayHijri = useMemo(() => toHijriDate(today), [today]);

  const selectedBn = useMemo(() => toBanglaDate(selectedDate), [selectedDate]);
  const selectedHijri = useMemo(
    () => toHijriDate(selectedDate),
    [selectedDate],
  );

  const visibleMonthApproxBn = useMemo(
    () => toBanglaDate(new Date(viewYear, viewMonth, 15)),
    [viewYear, viewMonth],
  );

  const visibleMonthApproxHijri = useMemo(
    () => toHijriDate(new Date(viewYear, viewMonth, 15)),
    [viewYear, viewMonth],
  );

  const cells = useMemo(
    () =>
      getCalendarCells(viewYear, viewMonth).map(({ date, inMonth }) => ({
        date,
        inMonth,
        bn: toBanglaDate(date),
        hijri: toHijriDate(date),
      })),
    [viewYear, viewMonth],
  );

  const goToday = () => {
    const d = new Date();
    setNow(d);
    setSelectedDate(d);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const changeMonth = (direction: number) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  const handlePickDate = (value: string) => {
    if (!value) return;

    const [y, m, d] = value.split("-").map(Number);
    const picked = new Date(y, m - 1, d);

    setSelectedDate(picked);
    setViewMonth(picked.getMonth());
    setViewYear(picked.getFullYear());
  };

  return (
    <div className="min-h-screen bg-(--color-bg) p-4 text-(--color-text) transition-colors duration-300 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Top Card */}
        <div className="relative overflow-hidden rounded-3xl border border-(--color-active-border) bg-(--color-bg) p-5 sm:p-6">
          <div className="absolute left-0 right-0 top-0 h-1 bg-(--color-active-text)" />

          <p className="text-[11px] uppercase tracking-[0.2em] text-(--color-gray)">
            Zero Loading Multi Calendar
          </p>

          <h1 className="mt-2 text-2xl font-black text-(--color-text) sm:text-3xl">
            English · Bangla · Hijri
          </h1>

          <p className="mt-2 text-sm text-(--color-gray)">
            Instant local calculation. No API, no loading. Local time:{" "}
            <span className="font-semibold text-(--color-text)">
              {currentTime}
            </span>
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                Day
              </p>
              <p className="text-lg font-bold text-(--color-text) sm:text-xl">
                {EN_DAYS[today.getDay()]}
              </p>
            </div>

            <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                English
              </p>
              <p className="text-base font-bold text-(--color-text) sm:text-lg">
                {formatEnglish(today)}
              </p>
            </div>

            <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                Bangla
              </p>
              <p className="text-base font-bold text-(--color-text) sm:text-lg">
                {todayBn.day} {BN_MONTHS[todayBn.month]} {todayBn.year} BS
              </p>
            </div>

            <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                Hijri
              </p>
              <p className="text-base font-bold text-(--color-text) sm:text-lg">
                {todayHijri.day} {HIJRI_MONTHS[todayHijri.month]}{" "}
                {todayHijri.year} AH
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.78fr]">
          {/* Main Calendar */}
          <div className="relative overflow-hidden rounded-3xl border border-(--color-active-border) bg-(--color-bg)">
            <div className="absolute left-0 right-0 top-0 h-1 bg-(--color-active-text)" />

            {/* Toolbar */}
            <div className="space-y-4 border-b border-(--color-active-border) p-4 sm:p-5">
              <div className="flex flex-wrap items-end gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => changeMonth(-1)}
                  className="h-11 w-11 shrink-0 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) text-xl leading-none text-(--color-text) transition-colors hover:opacity-90"
                >
                  ‹
                </button>

                <SelectOption
                  label="Month"
                  options={MONTH_OPTIONS}
                  value={String(viewMonth)}
                  onChange={(value) => setViewMonth(Number(value))}
                  className="min-w-45 flex-1"
                />

                <SelectOption
                  label="Year"
                  options={YEAR_OPTIONS}
                  value={String(viewYear)}
                  onChange={(value) => setViewYear(Number(value))}
                  className="w-full sm:w-35"
                />

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => changeMonth(1)}
                  className="h-11 w-11 shrink-0 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) text-xl leading-none text-(--color-text) transition-colors hover:opacity-90"
                >
                  ›
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <button
                  type="button"
                  onClick={goToday}
                  className="h-11 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 text-sm font-medium text-(--color-text) transition-colors hover:opacity-90"
                >
                  Back to Today
                </button>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                    Pick exact date
                  </label>
                  <input
                    type="date"
                    value={toInputValue(selectedDate)}
                    onChange={(e) => handlePickDate(e.target.value)}
                    className="h-11 rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-3 text-(--color-text) outline-none"
                  />
                </div>
              </div>

              <div className="text-xs text-(--color-gray)">
                Visible month approx:{" "}
                <span className="font-medium text-(--color-text)">
                  {BN_MONTHS[visibleMonthApproxBn.month]}{" "}
                  {visibleMonthApproxBn.year} BS
                </span>{" "}
                ·{" "}
                <span className="font-medium text-(--color-text)">
                  {HIJRI_MONTHS[visibleMonthApproxHijri.month]}{" "}
                  {visibleMonthApproxHijri.year} AH
                </span>
              </div>
            </div>

            {/* Day headings */}
            <div className="grid grid-cols-7 gap-2 px-3 pt-4 sm:px-5">
              {EN_DAYS_SHORT.map((day) => (
                <div
                  key={day}
                  className="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-gray) sm:text-xs"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 p-3 sm:p-5">
              {cells.map(({ date, inMonth, bn, hijri }, idx) => {
                const isToday = sameDate(date, today);
                const isSelected = sameDate(date, selectedDate);

                const showEnMonth = date.getDate() === 1 || !inMonth;
                const showBnMonth = bn.day === 1;
                const showHijriMonth = hijri.day === 1;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);

                      if (!inMonth) {
                        setViewMonth(date.getMonth());
                        setViewYear(date.getFullYear());
                      }
                    }}
                    className={`min-h-24 rounded-2xl border p-2.5 text-left transition-all sm:min-h-28 sm:p-3 ${
                      isSelected
                        ? "border-(--color-active-text) bg-(--color-active-bg)"
                        : "border-(--color-active-border) hover:bg-(--color-active-bg)"
                    } ${!inMonth ? "opacity-45" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-base font-black leading-none sm:text-lg ${
                          isSelected
                            ? "text-(--color-active-text)"
                            : "text-(--color-text)"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {isToday && (
                        <span className="rounded-full border border-(--color-active-border) bg-(--color-active-bg) px-1.5 py-0.5 text-[9px] font-semibold text-(--color-text)">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <p
                        className={`text-[10px] leading-none sm:text-[11px] ${
                          isSelected
                            ? "text-(--color-active-text)"
                            : "text-(--color-gray)"
                        }`}
                      >
                        <span className="font-semibold">EN:</span>{" "}
                        {date.getDate()}
                        {showEnMonth
                          ? ` ${EN_MONTHS_SHORT[date.getMonth()]}`
                          : ""}
                      </p>

                      <p
                        className={`text-[10px] leading-none sm:text-[11px] ${
                          isSelected
                            ? "text-(--color-active-text)"
                            : "text-(--color-gray)"
                        }`}
                      >
                        <span className="font-semibold">BN:</span> {bn.day}
                        {showBnMonth ? ` ${BN_MONTHS_SHORT[bn.month]}` : ""}
                      </p>

                      <p
                        className={`text-[10px] leading-none sm:text-[11px] ${
                          isSelected
                            ? "text-(--color-active-text)"
                            : "text-(--color-gray)"
                        }`}
                      >
                        <span className="font-semibold">HJ:</span> {hijri.day}
                        {showHijriMonth
                          ? ` ${HIJRI_MONTHS_SHORT[hijri.month]}`
                          : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-(--color-active-border) bg-(--color-bg) p-5 sm:p-6">
              <div className="absolute left-0 right-0 top-0 h-1 bg-(--color-active-text)" />

              <p className="text-[11px] uppercase tracking-[0.18em] text-(--color-gray)">
                Selected Date
              </p>

              <p className="mt-3 text-3xl font-black leading-none text-(--color-text) sm:text-4xl">
                {EN_DAYS[selectedDate.getDay()]}
              </p>

              <p className="mt-2 text-sm text-(--color-gray)">
                Full date details for the selected day.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                    English
                  </p>
                  <p className="mt-1 text-lg font-bold text-(--color-text)">
                    {formatEnglish(selectedDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                    Bangla
                  </p>
                  <p className="mt-1 text-lg font-bold text-(--color-text)">
                    {selectedBn.day} {BN_MONTHS[selectedBn.month]}{" "}
                    {selectedBn.year} BS
                  </p>
                  <p className="mt-1 text-sm text-(--color-gray)">
                    {BN_SEASON_ICONS[selectedBn.month]} Season:{" "}
                    {BN_SEASONS[selectedBn.month]}
                  </p>
                </div>

                <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-(--color-gray)">
                    Hijri
                  </p>
                  <p className="mt-1 text-lg font-bold text-(--color-text)">
                    {selectedHijri.day} {HIJRI_MONTHS[selectedHijri.month]}{" "}
                    {selectedHijri.year} AH
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-(--color-active-border) bg-(--color-bg) p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-(--color-gray)">
                Quick Guide
              </p>

              <div className="mt-4 space-y-3 text-sm text-(--color-gray)">
                <p>
                  <span className="font-semibold text-(--color-text)">EN</span>{" "}
                  = English date
                </p>
                <p>
                  <span className="font-semibold text-(--color-text)">BN</span>{" "}
                  = Bangla date
                </p>
                <p>
                  <span className="font-semibold text-(--color-text)">HJ</span>{" "}
                  = Hijri date
                </p>
                <p>
                  When Bangla or Hijri day becomes{" "}
                  <span className="font-semibold text-(--color-text)">1</span>,
                  the short month name appears beside it.
                </p>
                <p>
                  Everything is calculated locally in the browser, so it opens
                  instantly with zero loading state.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
