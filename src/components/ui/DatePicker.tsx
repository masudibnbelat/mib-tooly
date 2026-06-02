"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  RotateCcw,
} from "lucide-react";

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

const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Helpers ──────────────────────────────────────────

const sameDate = (a: Date, b: Date): boolean => {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
};

const daysInMonth = (y: number, m: number): number => {
  return new Date(y, m + 1, 0).getDate();
};

const getCalendarCells = (year: number, month: number) => {
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
};

// ─── Types ────────────────────────────────────────────

export interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  align?: "left" | "right";
  minDate?: Date;
  maxDate?: Date;
  triggerClassName?: string;
}

// ─── DatePicker Component ─────────────────────────────

export default function DatePicker({
  value,
  onChange,
  align = "right",
  minDate,
  maxDate,
  triggerClassName,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"date" | "month" | "year">("date");
  const [pickerMonth, setPickerMonth] = useState(value.getMonth());
  const [pickerYear, setPickerYear] = useState(value.getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const cells = useMemo(
    () => getCalendarCells(pickerYear, pickerMonth),
    [pickerYear, pickerMonth],
  );

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear - 50;
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 50;

  const years = useMemo(() => {
    const arr = [];
    for (let y = minYear; y <= maxYear; y++) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setPickerMonth(value.getMonth());
    setPickerYear(value.getFullYear());
    setView("date");
    setOpen((prev) => !prev);
  };

  const isDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const selectDate = (date: Date) => {
    if (isDisabled(date)) return;
    onChange(date);
    setOpen(false);
  };

  // ✅ FIXED: Month select करे तो month दिखाए, फिर date view में जाए
  const selectMonth = (month: number) => {
    setPickerMonth(month);
    setView("date");
  };

  // ✅ FIXED: Year select करे तो month view में जाए, date view में न जाए
  const selectYear = (year: number) => {
    setPickerYear(year);
    setView("month");
  };

  // ✅ FIXED: Month header click करे तो year view दिखाए
  const handleMonthHeaderClick = () => {
    setView("year");
  };

  const popoverAlign = align === "right" ? "right-0" : "left-0";

  return (
    <div ref={ref} className="relative inline-block">
      {/* ── Trigger Button ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={handleOpen}
        className={
          triggerClassName ??
          "flex items-center gap-2 h-10 px-4 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) text-sm font-medium transition-all hover:opacity-80 active:scale-95 cursor-pointer select-none"
        }
      >
        <motion.span
          animate={{ rotate: open ? 15 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <CalendarDays size={15} className="text-(--color-active-text)" />
        </motion.span>
        <span>
          {EN_MONTHS_SHORT[value.getMonth()]} {value.getDate()},{" "}
          {value.getFullYear()}
        </span>
      </motion.button>

      {/* ── Popover ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`absolute top-12 ${popoverAlign} z-50 w-80 rounded-2xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden`}
            style={{
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            {/* Top accent line */}
            <div className="h-0.5 w-full bg-(--color-active-text)" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VIEW: DATE */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              {view === "date" && (
                <motion.div
                  key="date-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* ── Month/Year Header ── */}
                  <div className="px-4 py-4 border-b border-(--color-active-border)">
                    <div className="flex items-center justify-between mb-3">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => {
                          const prev = new Date(pickerYear, pickerMonth - 1, 1);
                          setPickerMonth(prev.getMonth());
                          setPickerYear(prev.getFullYear());
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-active-bg) text-(--color-text) transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </motion.button>

                      {/* ✅ FIXED: Month header click করে month view যাবে না, year view যাবে */}
                      <motion.button
                        type="button"
                        onClick={handleMonthHeaderClick}
                        className="flex-1 text-center text-lg font-bold text-(--color-text) hover:opacity-70 transition-opacity"
                      >
                        {EN_MONTHS[pickerMonth]} {pickerYear}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => {
                          const next = new Date(pickerYear, pickerMonth + 1, 1);
                          setPickerMonth(next.getMonth());
                          setPickerYear(next.getFullYear());
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-active-bg) text-(--color-text) transition-colors"
                      >
                        <ChevronRight size={18} />
                      </motion.button>
                    </div>
                  </div>

                  {/* ── Day Headers ── */}
                  <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {EN_DAYS_SHORT.map((d) => (
                      <div
                        key={d}
                        className="text-center text-[10px] font-bold uppercase tracking-wider text-(--color-gray)"
                      >
                        {d[0]}
                      </div>
                    ))}
                  </div>

                  {/* ── Calendar Dates ── */}
                  <div className="grid grid-cols-7 gap-1 px-3 py-2 pb-3">
                    {cells.map(({ date, inMonth }, idx) => {
                      const isTod = sameDate(date, today);
                      const isSel = sameDate(date, value);
                      const disabled = isDisabled(date);

                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          whileHover={
                            !disabled && inMonth ? { scale: 1.1 } : {}
                          }
                          whileTap={!disabled && inMonth ? { scale: 0.9 } : {}}
                          onClick={() => selectDate(date)}
                          disabled={disabled}
                          className={`
                            relative h-10 rounded-lg text-sm font-semibold transition-all
                            ${
                              isSel
                                ? "bg-(--color-active-text) text-(--color-bg)"
                                : isTod
                                  ? "border-2 border-(--color-active-text) text-(--color-active-text)"
                                  : inMonth
                                    ? "text-(--color-text) hover:bg-(--color-active-bg)"
                                    : "text-(--color-gray)"
                            }
                            ${!inMonth || disabled ? "opacity-40 cursor-default" : "cursor-pointer"}
                          `}
                        >
                          {date.getDate()}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── Footer ── */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-(--color-active-border)">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => selectDate(new Date())}
                      className="flex items-center gap-1.5 text-xs text-(--color-gray) hover:text-(--color-text) transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      Today
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 text-xs text-(--color-active-text) font-semibold hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      <Check size={12} />
                      Done
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* VIEW: MONTH */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {view === "month" && (
                <motion.div
                  key="month-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* ── Year Header ── */}
                  <div className="px-4 py-4 border-b border-(--color-active-border)">
                    {/* ✅ FIXED: Year header click করে back যাবে year view এ */}
                    <motion.button
                      type="button"
                      onClick={() => setView("year")}
                      className="w-full text-center text-2xl font-bold text-(--color-text) hover:opacity-70 transition-opacity"
                    >
                      {pickerYear}
                    </motion.button>
                  </div>

                  {/* ── Month Grid ── */}
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {EN_MONTHS.map((month, idx) => {
                      const isSelected = idx === pickerMonth;
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => selectMonth(idx)}
                          className={`
                            py-3 rounded-xl font-semibold text-sm transition-all
                            ${
                              isSelected
                                ? "bg-(--color-active-text) text-(--color-bg)"
                                : "border border-(--color-active-border) text-(--color-text) hover:bg-(--color-active-bg)"
                            }
                          `}
                        >
                          {month.slice(0, 3)}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── Back Button ── */}
                  <div className="px-4 py-3 border-t border-(--color-active-border)">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setView("year")}
                      className="w-full text-xs text-(--color-gray) hover:text-(--color-text) transition-colors cursor-pointer font-medium py-2"
                    >
                      ← Select Year
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* VIEW: YEAR */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {view === "year" && (
                <motion.div
                  key="year-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* ── Range Header ── */}
                  <div className="px-4 py-4 border-b border-(--color-active-border)">
                    <p className="text-center text-sm text-(--color-gray)">
                      Select Year
                    </p>
                  </div>

                  {/* ── Year Grid ── */}
                  <div className="grid grid-cols-4 gap-2 p-4 max-h-80 overflow-y-auto">
                    {years.map((year) => {
                      const isSelected = year === pickerYear;
                      return (
                        <motion.button
                          key={year}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => selectYear(year)}
                          className={`
                            py-2.5 rounded-lg font-semibold text-sm transition-all
                            ${
                              isSelected
                                ? "bg-(--color-active-text) text-(--color-bg)"
                                : "border border-(--color-active-border) text-(--color-text) hover:bg-(--color-active-bg)"
                            }
                          `}
                        >
                          {year}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
