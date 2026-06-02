"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import DatePicker from "../ui/DatePicker";
import {
  BN_MONTHS,
  BN_SEASON_ICONS,
  BN_SEASONS,
  EN_DAYS_SHORT,
  EN_MONTHS,
  HIJRI_MONTHS,
} from "./CalenderData";
import {
  getCalendarCells,
  ordSuffix,
  sameDate,
  toBanglaDate,
  toHijriDate,
} from "./CalenderHelper";

export default function MultiCalendar() {
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [slideDir, setSlideDir] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // ✅ Close modal on outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const today = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

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

  const changeMonth = (dir: number) => {
    setSlideDir(dir);
    const next = new Date(viewYear, viewMonth + dir, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  const goToday = () => {
    const d = new Date();
    setNow(d);
    setSelectedDate(d);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const handleDatePick = (date: Date) => {
    setSelectedDate(date);
    setViewMonth(date.getMonth());
    setViewYear(date.getFullYear());
  };

  // ✅ Open modal when date is clicked
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDateClick = (date: Date, inMonth: boolean) => {
    setModalDate(date);
    setModalOpen(true);
  };

  const selectedBn = useMemo(() => toBanglaDate(selectedDate), [selectedDate]);
  const selectedHijri = useMemo(
    () => toHijriDate(selectedDate),
    [selectedDate],
  );

  const modalBn = useMemo(
    () => (modalDate ? toBanglaDate(modalDate) : null),
    [modalDate],
  );
  const modalHijri = useMemo(
    () => (modalDate ? toHijriDate(modalDate) : null),
    [modalDate],
  );

  const bnMonthsInView = useMemo(() => {
    const months = new Set(
      cells.filter((c) => c.inMonth).map((c) => c.bn.month),
    );
    return Array.from(months).map((m) => BN_MONTHS[m]);
  }, [cells]);

  const hijriMonthsInView = useMemo(() => {
    const months = new Set(
      cells.filter((c) => c.inMonth).map((c) => c.hijri.month),
    );
    return Array.from(months).map((m) => HIJRI_MONTHS[m]);
  }, [cells]);

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text) transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6 space-y-4">
        {/* ── Calendar + Side Panel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          {/* ── Main Calendar Panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-(--color-active-border) bg-(--color-bg)"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-(--color-active-text)" />

            {/* Toolbar */}
            <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-(--color-active-border) space-y-3">
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) hover:opacity-80 transition-opacity shrink-0"
                >
                  <ChevronLeft size={16} />
                </motion.button>

                <div className="flex-1 text-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${viewYear}-${viewMonth}`}
                      initial={{ opacity: 0, x: slideDir * 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -slideDir * 20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <p className="text-lg sm:text-xl font-black text-(--color-text) leading-none">
                        {EN_MONTHS[viewMonth]} {viewYear}
                      </p>
                      <p className="mt-1 text-[10px] text-(--color-gray) flex items-center justify-center gap-2 flex-wrap">
                        <span style={{ color: "var(--cal-bn)" }}>
                          {bnMonthsInView.join(" / ")}
                        </span>
                        <span className="text-(--color-active-border)">·</span>
                        <span style={{ color: "var(--cal-hj)" }}>
                          {hijriMonthsInView.join(" / ")}
                        </span>
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) hover:opacity-80 transition-opacity shrink-0"
                >
                  <ChevronRight size={16} />
                </motion.button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={goToday}
                  className="h-9 px-3 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-xs font-semibold text-(--color-text) hover:opacity-80 transition-opacity flex items-center gap-1.5"
                >
                  <RotateCcw size={12} /> Today
                </motion.button>

                <DatePicker value={selectedDate} onChange={handleDatePick} />
              </div>

              {/* Color legend */}
              <div className="flex items-center gap-3 flex-wrap text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-(--color-text) opacity-70 shrink-0" />
                  <span className="text-(--color-gray)">English</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--cal-bn)" }}
                  />
                  <span className="text-(--color-gray)">Bangla</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--cal-hj)" }}
                  />
                  <span className="text-(--color-gray)">Hijri</span>
                </div>
              </div>
            </div>

            {/* Day headings */}
            <div className="grid grid-cols-7 px-2 pt-3 pb-1 sm:px-3">
              {EN_DAYS_SHORT.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-(--color-gray)"
                >
                  {day.slice(0, 2)}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewYear}-${viewMonth}`}
                initial={{ opacity: 0, x: slideDir * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -slideDir * 30 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid grid-cols-7 gap-1 p-2 sm:gap-1.5 sm:p-3"
              >
                {cells.map(({ date, inMonth, bn, hijri }, idx) => {
                  const isToday = sameDate(date, today);
                  const isSelected = sameDate(date, selectedDate);
                  const showBnMonth = bn.day === 1;
                  const showHijriMonth = hijri.day === 1;

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={inMonth ? { scale: 1.02 } : {}}
                      whileTap={inMonth ? { scale: 0.95 } : {}}
                      onClick={() => {
                        handleDateClick(date, inMonth);
                        setSelectedDate(date);
                        if (!inMonth) {
                          setViewMonth(date.getMonth());
                          setViewYear(date.getFullYear());
                        }
                      }}
                      className={`
        relative rounded-xl p-1.5 sm:p-2 text-left transition-all min-h-18 sm:min-h-21 lg:min-h-22
        flex flex-col justify-between cursor-pointer
        ${
          isSelected
            ? "border border-(--color-active-text) bg-(--color-active-bg)"
            : isToday
              ? "border border-(--color-active-text)/50 bg-(--color-active-bg)/50"
              : "border border-(--color-active-border)/60 hover:border-(--color-active-border) hover:bg-(--color-active-bg)/40"
        }
        ${!inMonth ? "opacity-30" : ""}
      `}
                    >
                      {/* ✅ Top: Bangla Left */}
                      <div className="flex justify-start">
                        <p
                          className="text-[8px] sm:text-[9px] leading-none font-bold"
                          style={{
                            color: isSelected
                              ? "var(--cal-bn-sel, var(--cal-bn))"
                              : "var(--cal-bn)",
                          }}
                        >
                          {bn.day}
                          {showBnMonth && (
                            <span className="font-bold ml-0.5">
                              {BN_MONTHS[bn.month].slice(0, 2)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* ✅ Middle: English BIG (CENTER) */}
                      <div className="flex flex-col items-center justify-center py-0.5">
                        <span
                          className={`text-xl sm:text-2xl font-black leading-none ${
                            isSelected
                              ? "text-(--color-active-text)"
                              : "text-(--color-text)"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {isToday && (
                          <span className="text-[6px] font-bold mt-1 text-(--color-active-text)">
                            ●
                          </span>
                        )}
                      </div>

                      {/* ✅ Bottom: Hijri Right */}
                      <div className="flex justify-end">
                        <p
                          className="text-[8px] sm:text-[9px] leading-none font-bold text-right"
                          style={{
                            color: isSelected
                              ? "var(--cal-hj-sel, var(--cal-hj))"
                              : "var(--cal-hj)",
                          }}
                        >
                          {hijri.day}
                          {showHijriMonth && (
                            <span className="font-bold ml-0.5">
                              {HIJRI_MONTHS[hijri.month].slice(0, 2)}
                            </span>
                          )}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Right Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {/* Selected date card */}
            <div className="relative overflow-hidden rounded-2xl border border-(--color-active-border) bg-(--color-bg) p-4 sm:p-5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-(--color-active-text)" />

              <p className="text-[10px] uppercase tracking-[0.2em] text-(--color-gray)">
                Selected
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate.toDateString()}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-(--color-text) leading-none">
                    {
                      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                        selectedDate.getDay()
                      ]
                    }
                  </p>

                  {/* English */}
                  <div className="mt-3 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3">
                    <p className="text-[10px] uppercase tracking-widest text-(--color-gray)">
                      English
                    </p>
                    <p className="mt-1 text-base font-bold text-(--color-text)">
                      {selectedDate.getDate()}
                      {ordSuffix(selectedDate.getDate())}{" "}
                      {EN_MONTHS[selectedDate.getMonth()]}{" "}
                      {selectedDate.getFullYear()}
                    </p>
                  </div>

                  {/* Bangla */}
                  <div
                    className="mt-2 rounded-xl border p-3"
                    style={{
                      borderColor: "var(--cal-bn)",
                      background: "var(--cal-bn-bg, transparent)",
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--cal-bn)", opacity: 0.7 }}
                    >
                      Bangla
                    </p>
                    <p
                      className="mt-1 text-base font-bold"
                      style={{ color: "var(--cal-bn)" }}
                    >
                      {selectedBn.day} {BN_MONTHS[selectedBn.month]}{" "}
                      {selectedBn.year} BS
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--cal-bn)", opacity: 0.7 }}
                    >
                      {BN_SEASON_ICONS[selectedBn.month]}{" "}
                      {BN_SEASONS[selectedBn.month]}
                    </p>
                  </div>

                  {/* Hijri */}
                  <div
                    className="mt-2 rounded-xl border p-3"
                    style={{
                      borderColor: "var(--cal-hj)",
                      background: "var(--cal-hj-bg, transparent)",
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--cal-hj)", opacity: 0.7 }}
                    >
                      Hijri
                    </p>
                    <p
                      className="mt-1 text-base font-bold"
                      style={{ color: "var(--cal-hj)" }}
                    >
                      {selectedHijri.day} {HIJRI_MONTHS[selectedHijri.month]}{" "}
                      {selectedHijri.year} AH
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="rounded-2xl border border-(--color-active-border) bg-(--color-bg) p-4">
              <p className="text-[10px] uppercase tracking-widest text-(--color-gray) mb-3">
                Color Key
              </p>
              <div className="space-y-2">
                {[
                  {
                    color: "text-(--color-text)",
                    label: "English date",
                    desc: "Main focus, large",
                  },
                  {
                    color: "[color:var(--cal-bn)]",
                    label: "Bangla date",
                    desc: "Month shown on day 1",
                  },
                  {
                    color: "[color:var(--cal-hj)]",
                    label: "Hijri date",
                    desc: "Month shown on day 1",
                  },
                ].map(({ color, label, desc }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={`text-sm font-black ${color} shrink-0 w-5`}
                    >
                      28
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-(--color-text)">
                        {label}
                      </p>
                      <p className="text-[10px] text-(--color-gray)">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ✅ MODAL */}
      <AnimatePresence>
        {modalOpen && modalDate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            {/* Modal */}
            {/* Modal - 3 Column Layout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-2xl rounded-2xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-2xl">
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-(--color-active-text)" />

                {/* Close button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) hover:opacity-70 transition-opacity z-10"
                >
                  <X size={16} />
                </motion.button>

                {/* Content */}
                <div className="p-5 sm:p-6">
                  {/* Title */}
                  <p className="text-[10px] uppercase tracking-[0.2em] text-(--color-gray) font-bold">
                    Selected Date Details
                  </p>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={modalDate.toDateString()}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Three Column Layout */}
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {/* LEFT: Bangla */}
                        {modalBn && (
                          <div
                            className="rounded-xl border p-4 flex flex-col items-center text-center space-y-2"
                            style={{
                              borderColor: "var(--cal-bn)",
                              background: "var(--cal-bn-bg, rgba(0,0,0,0.02))",
                            }}
                          >
                            <p
                              className="text-[9px] uppercase tracking-widest font-bold"
                              style={{ color: "var(--cal-bn)" }}
                            >
                              Bangla
                            </p>
                            <p
                              className="text-3xl sm:text-4xl font-black leading-none"
                              style={{ color: "var(--cal-bn)" }}
                            >
                              {modalBn.day}
                            </p>
                            <p
                              className="text-xs font-bold"
                              style={{ color: "var(--cal-bn)", opacity: 0.85 }}
                            >
                              {BN_MONTHS[modalBn.month]}
                            </p>
                            <p
                              className="text-[9px]"
                              style={{ color: "var(--cal-bn)", opacity: 0.7 }}
                            >
                              {modalBn.year} BS
                            </p>
                            <p
                              className="text-sm pt-1"
                              style={{ color: "var(--cal-bn)" }}
                            >
                              {BN_SEASON_ICONS[modalBn.month]}{" "}
                              {BN_SEASONS[modalBn.month]}
                            </p>
                          </div>
                        )}

                        {/* CENTER: English (BIG) */}
                        <div className="rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-4 flex flex-col items-center justify-center text-center space-y-1">
                          <p className="text-[9px] uppercase tracking-widest text-(--color-gray) font-bold">
                            English
                          </p>
                          <p className="text-5xl sm:text-6xl font-black text-(--color-text) leading-none">
                            {modalDate.getDate()}
                          </p>
                          <p className="text-sm font-bold text-(--color-text)">
                            {EN_MONTHS[modalDate.getMonth()]}
                          </p>
                          <p className="text-[10px] text-(--color-gray)">
                            {modalDate.getFullYear()}
                          </p>
                          <div className="pt-2 border-t border-(--color-active-border) w-full">
                            <p className="text-xs font-semibold text-(--color-text) pt-2">
                              {
                                [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday",
                                ][modalDate.getDay()]
                              }
                            </p>
                          </div>
                        </div>

                        {/* RIGHT: Hijri */}
                        {modalHijri && (
                          <div
                            className="rounded-xl border p-4 flex flex-col items-center text-center space-y-2"
                            style={{
                              borderColor: "var(--cal-hj)",
                              background: "var(--cal-hj-bg, rgba(0,0,0,0.02))",
                            }}
                          >
                            <p
                              className="text-[9px] uppercase tracking-widest font-bold"
                              style={{ color: "var(--cal-hj)" }}
                            >
                              Hijri
                            </p>
                            <p
                              className="text-3xl sm:text-4xl font-black leading-none"
                              style={{ color: "var(--cal-hj)" }}
                            >
                              {modalHijri.day}
                            </p>
                            <p
                              className="text-xs font-bold"
                              style={{ color: "var(--cal-hj)", opacity: 0.85 }}
                            >
                              {HIJRI_MONTHS[modalHijri.month]}
                            </p>
                            <p
                              className="text-[9px]"
                              style={{ color: "var(--cal-hj)", opacity: 0.7 }}
                            >
                              {modalHijri.year} AH
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 sm:px-6 border-t border-(--color-active-border) flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:opacity-80 transition-opacity"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
