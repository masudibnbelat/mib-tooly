"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  CalendarClock,
} from "lucide-react";

interface CountDownModalProps {
  onClose: () => void;
}

type Mode = "timer" | "date";

const padZero = (num: number) => String(num).padStart(2, "0");

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: padZero(hours),
    minutes: padZero(minutes),
    seconds: padZero(seconds),
  };
};

const getSecondsUntilDate = (target: string): number => {
  const now = new Date().getTime();
  const end = new Date(target).getTime();
  const diff = Math.floor((end - now) / 1000);
  return diff > 0 ? diff : 0;
};

/* ─── Animated Digit ─── */
const AnimatedDigit = ({
  digit,
  isFinished,
}: {
  digit: string;
  isFinished: boolean;
}) => (
  <span className="relative inline-flex h-[1.15em] w-[0.62em] items-center justify-center overflow-hidden">
    <AnimatePresence mode="popLayout">
      <motion.span
        key={digit}
        initial={{ y: -28, opacity: 0, filter: "blur(6px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: 28, opacity: 0, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.7 }}
        className={`absolute ${isFinished ? "text-red-500" : ""}`}
      >
        {digit}
      </motion.span>
    </AnimatePresence>
  </span>
);

/* ─── Animated Colon ─── */
const AnimatedColon = ({ isFinished }: { isFinished: boolean }) => (
  <motion.span
    className={`mx-0.5 ${isFinished ? "text-red-500" : ""}`}
    animate={{ opacity: [1, 0.3, 1] }}
    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
  >
    :
  </motion.span>
);

/* ─── Animated Time Display ─── */
const AnimatedTimeDisplay = ({
  hours,
  minutes,
  seconds,
  isFinished,
  size = "large",
}: {
  hours: string;
  minutes: string;
  seconds: string;
  isFinished: boolean;
  size?: "large" | "small";
}) => {
  const sizeClass =
    size === "large"
      ? "font-mono text-5xl font-bold sm:text-7xl"
      : "font-mono text-3xl font-bold sm:text-4xl";

  return (
    <motion.div
      className={`flex items-center tabular-nums ${sizeClass} ${isFinished ? "text-red-500" : "text-(--color-text)"}`}
      animate={isFinished ? { scale: [1, 1.04, 1] } : {}}
      transition={
        isFinished ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" } : {}
      }
    >
      <AnimatedDigit digit={hours[0]} isFinished={isFinished} />
      <AnimatedDigit digit={hours[1]} isFinished={isFinished} />
      <AnimatedColon isFinished={isFinished} />
      <AnimatedDigit digit={minutes[0]} isFinished={isFinished} />
      <AnimatedDigit digit={minutes[1]} isFinished={isFinished} />
      <AnimatedColon isFinished={isFinished} />
      <AnimatedDigit digit={seconds[0]} isFinished={isFinished} />
      <AnimatedDigit digit={seconds[1]} isFinished={isFinished} />
    </motion.div>
  );
};

/* ─── Progress Bar ─── */
const ProgressBar = ({
  progress,
  isRunning,
  isFinished,
}: {
  progress: number;
  isRunning: boolean;
  isFinished: boolean;
}) => (
  <div className="relative h-2 w-full max-w-xs overflow-hidden rounded-full bg-(--color-active-bg)">
    <motion.div
      className={`absolute inset-y-0 left-0 rounded-full ${isFinished ? "bg-red-500" : "bg-(--color-text)"}`}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    {isRunning && (
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${isFinished ? "bg-red-500" : "bg-(--color-text)"}`}
        animate={{ width: `${progress}%`, opacity: [0.5, 0.15, 0.5] }}
        transition={{
          width: { duration: 0.5, ease: "easeOut" },
          opacity: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
        }}
      />
    )}
  </div>
);

/* ─── Scroll Picker Column ─── */
interface ScrollPickerProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  delay?: number;
}

const ScrollPicker = ({
  label,
  value,
  min,
  max,
  onChange,
  delay = 0,
}: ScrollPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 48;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const range = max - min + 1;

  const scrollTo = useCallback(
    (v: number, smooth = true) => {
      if (!containerRef.current) return;
      containerRef.current.scrollTo({
        top: (v - min) * ITEM_H,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [min],
  );

  useEffect(() => {
    scrollTo(value, false);
  }, [scrollTo, value]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const idx = Math.round(containerRef.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, range - 1));
      const nv = clamped + min;
      containerRef.current.scrollTo({
        top: clamped * ITEM_H,
        behavior: "smooth",
      });
      if (nv !== value) onChange(nv);
    }, 80);
  };

  const inc = () => {
    const n = value < max ? value + 1 : min;
    onChange(n);
    scrollTo(n);
  };
  const dec = () => {
    const n = value > min ? value - 1 : max;
    onChange(n);
    scrollTo(n);
  };

  const items = Array.from({ length: range }, (_, i) => i + min);

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay,
      }}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-(--color-gray)">
        {label}
      </span>

      <motion.button
        onClick={inc}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.15 }}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-(--color-gray) hover:bg-(--color-active-bg) hover:text-(--color-text)"
        aria-label={`Increase ${label}`}
      >
        <ChevronUp className="h-4 w-4" />
      </motion.button>

      <div className="relative h-36 w-16 overflow-hidden rounded-xl border border-(--color-active-border) bg-(--color-active-bg)">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-linear-to-b from-(--color-active-bg) to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-(--color-active-bg) to-transparent" />
        <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-12 -translate-y-1/2 rounded-lg border border-(--color-active-border) bg-(--color-bg)/40" />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="hide-scrollbar h-full snap-y snap-mandatory overflow-y-auto pt-12 pb-12"
        >
          {items.map((item) => (
            <div
              key={item}
              className="flex h-12 snap-center items-center justify-center"
            >
              <span
                className={`font-mono text-xl font-bold transition-all duration-200 ${
                  item === value
                    ? "scale-110 text-(--color-text)"
                    : "scale-90 text-(--color-gray)/50"
                }`}
              >
                {padZero(item)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={dec}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.15 }}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-(--color-gray) hover:bg-(--color-active-bg) hover:text-(--color-text)"
        aria-label={`Decrease ${label}`}
      >
        <ChevronDown className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

/* ─── Status Dot ─── */
const StatusDot = ({
  color,
  pulse = false,
}: {
  color: string;
  pulse?: boolean;
}) => (
  <motion.span
    className={`inline-block h-2 w-2 rounded-full ${color}`}
    animate={pulse ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
    transition={
      pulse ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" } : {}
    }
  />
);

/* ─── Main Modal ─── */
export const CountDownModal = ({ onClose }: CountDownModalProps) => {
  const [mode, setMode] = useState<Mode>("timer");
  const [copied, setCopied] = useState(false);

  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [targetDate, setTargetDate] = useState("");
  const [dateRemaining, setDateRemaining] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isRunning || mode !== "timer") return;
    intervalRef.current = setInterval(() => {
      setRemaining((p) => {
        if (p <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setIsFinished(true);
          // eslint-disable-next-line react-hooks/immutability
          playAlarm();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  useEffect(() => {
    if (mode !== "date" || !targetDate) return;
    const update = () => setDateRemaining(getSecondsUntilDate(targetDate));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [mode, targetDate]);

  const playAlarm = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 1500);
    } catch {}
  };

  const handleStart = () => {
    const t = inputHours * 3600 + inputMinutes * 60 + inputSeconds;
    if (t <= 0) return;
    setTotalSeconds(t);
    setRemaining(t);
    setIsRunning(true);
    setIsFinished(false);
  };

  const handlePause = () => setIsRunning(false);

  const handleResume = () => {
    if (remaining > 0) {
      setIsRunning(true);
      setIsFinished(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setRemaining(0);
    setTotalSeconds(0);
  };

  const handleCopy = async () => {
    const d =
      mode === "timer" ? formatTime(remaining) : formatTime(dateRemaining);
    try {
      await navigator.clipboard.writeText(
        `${d.hours}:${d.minutes}:${d.seconds}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const progress =
    totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const display = formatTime(mode === "timer" ? remaining : dateRemaining);

  const getMinDate = () => {
    const n = new Date();
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
    return n.toISOString().slice(0, 16);
  };

  const timerActive = totalSeconds > 0;
  const idle = !isRunning && remaining === 0 && !isFinished;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-(--color-bg) text-(--color-text)"
    >
      {/* hide-scrollbar utility */}
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* ── Header ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 26,
          delay: 0.04,
        }}
        className="flex shrink-0 items-center justify-between gap-4 border-b border-(--color-active-border) px-4 py-3 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-active-bg)"
            whileHover={{ rotate: 20 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Timer className="h-5 w-5 text-(--color-text)" />
          </motion.div>
          <h2 className="text-base font-semibold sm:text-lg">
            Countdown Timer
          </h2>
        </div>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.85 }}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 26,
          delay: 0.08,
        }}
        className="flex shrink-0 gap-2 border-b border-(--color-active-border) px-4 py-2.5 sm:px-6"
      >
        {(["timer", "date"] as Mode[]).map((m) => (
          <motion.button
            key={m}
            onClick={() => {
              setMode(m);
              handleReset();
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`cursor-pointer shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === m
                ? "bg-(--color-text) text-(--color-bg)"
                : "bg-(--color-active-bg) text-(--color-text) hover:opacity-80"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {m === "timer" ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5" />
              )}
              {m === "timer" ? "Timer" : "Target Date"}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode + (timerActive ? "-active" : "-idle")}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Time */}
            <div className="flex flex-col items-center gap-4">
              <AnimatedTimeDisplay
                hours={display.hours}
                minutes={display.minutes}
                seconds={display.seconds}
                isFinished={isFinished}
                size={mode === "timer" && timerActive ? "large" : "large"}
              />

              {/* Progress bar */}
              {mode === "timer" && timerActive && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.5 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  className="w-full max-w-xs"
                >
                  <ProgressBar
                    progress={progress}
                    isRunning={isRunning}
                    isFinished={isFinished}
                  />
                  <motion.p
                    className="mt-1.5 text-center text-xs font-medium text-(--color-gray)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {Math.round(progress)}% elapsed
                  </motion.p>
                </motion.div>
              )}

              {/* Finished label */}
              {isFinished && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-base font-semibold text-red-500"
                >
                  <motion.span
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.1,
                      ease: "easeInOut",
                    }}
                  >
                    ⏰ Time is up!
                  </motion.span>
                </motion.p>
              )}
            </div>

            {/* Timer controls */}
            {mode === "timer" && (
              <div className="flex w-full max-w-md flex-col items-center gap-6">
                {/* Picker */}
                <AnimatePresence>
                  {idle && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-end gap-2 pb-2 sm:gap-4">
                        <ScrollPicker
                          label="Hours"
                          value={inputHours}
                          min={0}
                          max={23}
                          onChange={setInputHours}
                          delay={0}
                        />
                        <span className="mb-20.5 text-2xl font-bold text-(--color-gray)">
                          :
                        </span>
                        <ScrollPicker
                          label="Minutes"
                          value={inputMinutes}
                          min={0}
                          max={59}
                          onChange={setInputMinutes}
                          delay={0.05}
                        />
                        <span className="mb-20.5 text-2xl font-bold text-(--color-gray)">
                          :
                        </span>
                        <ScrollPicker
                          label="Seconds"
                          value={inputSeconds}
                          min={0}
                          max={59}
                          onChange={setInputSeconds}
                          delay={0.1}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <motion.div className="flex gap-3" layout>
                  <AnimatePresence mode="popLayout">
                    {idle && (
                      <motion.button
                        key="start"
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={handleStart}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-text) px-8 py-3.5 text-sm font-semibold text-(--color-bg)"
                      >
                        <Play className="h-4 w-4" />
                        Start
                      </motion.button>
                    )}

                    {isRunning && (
                      <motion.button
                        key="pause"
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={handlePause}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-active-bg) px-6 py-3 text-sm font-medium text-(--color-text)"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </motion.button>
                    )}

                    {!isRunning && remaining > 0 && !isFinished && (
                      <motion.button
                        key="resume"
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={handleResume}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-text) px-6 py-3 text-sm font-medium text-(--color-bg)"
                      >
                        <Play className="h-4 w-4" />
                        Resume
                      </motion.button>
                    )}

                    {(remaining > 0 || isFinished) && (
                      <motion.button
                        key="reset"
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={handleReset}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-6 py-3 text-sm font-medium text-(--color-text)"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* Date input */}
            {mode === "date" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full max-w-sm flex-col items-center gap-4"
              >
                <label className="text-sm font-medium text-(--color-text)">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={targetDate}
                  min={getMinDate()}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3 text-sm text-(--color-text) outline-none transition focus:border-(--color-text)"
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 26,
          delay: 0.12,
        }}
        className="flex shrink-0 items-center justify-between gap-2 border-t border-(--color-active-border) px-4 py-3 sm:px-6"
      >
        {/* Status */}
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {mode === "timer" && (
            <AnimatePresence mode="wait">
              <motion.span
                key={isRunning ? "run" : isFinished ? "fin" : "rdy"}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-1.5 truncate rounded-lg bg-(--color-active-bg) px-2.5 py-1.5 text-xs font-medium text-(--color-text) sm:text-sm"
              >
                {isRunning && <StatusDot color="bg-green-500" pulse />}
                {isFinished && <StatusDot color="bg-red-500" pulse />}
                {!isRunning && !isFinished && (
                  <StatusDot color="bg-(--color-gray)" />
                )}
                {isRunning ? "Running" : isFinished ? "Finished" : "Ready"}
              </motion.span>
            </AnimatePresence>
          )}

          {mode === "timer" && timerActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden rounded-lg bg-(--color-active-bg) px-2.5 py-1.5 text-xs font-medium text-(--color-text) sm:inline-flex sm:text-sm"
            >
              {Math.round(progress)}%
            </motion.span>
          )}

          {mode === "date" && targetDate && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 truncate rounded-lg bg-(--color-active-bg) px-2.5 py-1.5 text-xs font-medium text-(--color-text) sm:text-sm"
            >
              {dateRemaining > 0 ? (
                <StatusDot color="bg-blue-500" pulse />
              ) : (
                <StatusDot color="bg-green-500" pulse />
              )}
              {dateRemaining > 0 ? "Counting..." : "Reached!"}
            </motion.span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              handleReset();
              setTargetDate("");
            }}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-3 py-2 text-xs font-medium text-(--color-text) sm:px-4 sm:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleCopy}
            disabled={mode === "timer" ? remaining === 0 : dateRemaining === 0}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-(--color-text) px-3 py-2 text-xs font-medium text-(--color-bg) disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="yes"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copied</span>
                </motion.span>
              ) : (
                <motion.span
                  key="no"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
