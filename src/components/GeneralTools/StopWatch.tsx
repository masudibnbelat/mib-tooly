"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Clock,
  Copy,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

interface StopWatchModalProps {
  onClose: () => void;
}

interface Lap {
  id: number;
  time: number;
  diff: number;
}

const padZero = (num: number, digits = 2) => String(num).padStart(digits, "0");

const formatTime = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return {
    hours: padZero(hours),
    minutes: padZero(minutes),
    seconds: padZero(seconds),
    milliseconds: padZero(milliseconds),
  };
};

const formatTimeString = (ms: number) => {
  const t = formatTime(ms);
  return `${t.hours}:${t.minutes}:${t.seconds}.${t.milliseconds}`;
};

export const StopWatchModal = ({ onClose }: StopWatchModalProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [copied, setCopied] = useState(false);

  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const lapListRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync so keyboard handler is never stale
  const isRunningRef = useRef(false);
  const elapsedRef = useRef(0);
  const lapsRef = useRef<Lap[]>([]);

  const updateElapsed = (value: number) => {
    elapsedRef.current = value;
    setElapsed(value);
  };

  const updateIsRunning = (value: boolean) => {
    isRunningRef.current = value;
    setIsRunning(value);
  };

  const updateLaps = (updater: (prev: Lap[]) => Lap[]) => {
    setLaps((prev) => {
      const next = updater(prev);
      lapsRef.current = next;
      return next;
    });
  };

  // ── RAF tick ──────────────────────────────────────────────
  const tick = () => {
    // eslint-disable-next-line react-hooks/purity
    const now = performance.now();
    const newElapsed = accumulatedRef.current + (now - startTimeRef.current);
    updateElapsed(newElapsed);
    rafRef.current = requestAnimationFrame(tick);
  };

  // ── Controls ──────────────────────────────────────────────
  const handleStart = () => {
    startTimeRef.current = performance.now();
    accumulatedRef.current = 0;
    updateElapsed(0);
    updateIsRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePause = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    accumulatedRef.current = elapsedRef.current;
    updateIsRunning(false);
  };

  const handleResume = () => {
    startTimeRef.current = performance.now();
    updateIsRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleReset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    updateIsRunning(false);
    updateElapsed(0);
    updateLaps(() => []);
    accumulatedRef.current = 0;
  };

  const handleLap = () => {
    const currentLaps = lapsRef.current;
    const currentElapsed = elapsedRef.current;
    const lastLapTime = currentLaps.length > 0 ? currentLaps[0].time : 0;

    const newLap: Lap = {
      id: currentLaps.length + 1,
      time: currentElapsed,
      diff: currentElapsed - lastLapTime,
    };

    updateLaps((prev) => [newLap, ...prev]);

    setTimeout(() => {
      lapListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  // ── Keyboard + scroll lock ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isRunningRef.current) handlePause();
        else if (elapsedRef.current > 0) handleResume();
        else handleStart();
        return;
      }
      if (e.key === "l" || e.key === "L") {
        if (isRunningRef.current) handleLap();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        handleReset();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // ── Copy ──────────────────────────────────────────────────
  const handleCopy = async () => {
    let text = `Stopwatch: ${formatTimeString(elapsedRef.current)}\n`;
    if (lapsRef.current.length > 0) {
      text += "\nLaps:\n";
      lapsRef.current
        .slice()
        .reverse()
        .forEach((lap) => {
          text += `#${padZero(lap.id)} — ${formatTimeString(lap.diff)} (Total: ${formatTimeString(lap.time)})\n`;
        });
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleClearLaps = () => updateLaps(() => []);

  const display = formatTime(elapsed);

  const fastestLap =
    laps.length > 1
      ? laps.reduce((min, lap) => (lap.diff < min.diff ? lap : min), laps[0])
      : null;

  const slowestLap =
    laps.length > 1
      ? laps.reduce((max, lap) => (lap.diff > max.diff ? lap : max), laps[0])
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 h-screen w-screen bg-(--color-bg) text-(--color-text)"
    >
      <div className="flex h-full w-full flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 border-b border-(--color-active-border) px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--color-active-bg)">
              <Clock className="h-5 w-5 text-(--color-text)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--color-text) sm:text-xl">
                Stopwatch
              </h2>
              <p className="hidden text-sm text-(--color-gray) sm:block">
                Precise stopwatch with lap tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) transition hover:opacity-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left — Timer */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:gap-8 sm:p-6">
            {/* Time Display */}
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-5xl font-bold text-(--color-text) sm:text-7xl md:text-8xl">
                {display.hours}
              </span>
              <span className="text-3xl font-bold text-(--color-gray) sm:text-5xl md:text-6xl">
                :
              </span>
              <span className="text-5xl font-bold text-(--color-text) sm:text-7xl md:text-8xl">
                {display.minutes}
              </span>
              <span className="text-3xl font-bold text-(--color-gray) sm:text-5xl md:text-6xl">
                :
              </span>
              <span className="text-5xl font-bold text-(--color-text) sm:text-7xl md:text-8xl">
                {display.seconds}
              </span>
              <span className="text-2xl font-semibold text-(--color-gray) sm:text-4xl md:text-5xl">
                .{display.milliseconds}
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isRunning && elapsed === 0 && (
                <button
                  onClick={handleStart}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-(--color-text) px-8 py-3.5 text-sm font-medium text-(--color-bg) transition hover:opacity-90 sm:px-10 sm:py-4 sm:text-base"
                >
                  <Play className="h-5 w-5" />
                  Start
                </button>
              )}

              {isRunning && (
                <>
                  <button
                    onClick={handlePause}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-6 py-3.5 text-sm font-medium text-(--color-text) transition hover:opacity-90 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <Pause className="h-5 w-5" />
                    Pause
                  </button>
                  <button
                    onClick={handleLap}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-(--color-text) px-6 py-3.5 text-sm font-medium text-(--color-bg) transition hover:opacity-90 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <Flag className="h-5 w-5" />
                    Lap
                  </button>
                </>
              )}

              {!isRunning && elapsed > 0 && (
                <>
                  <button
                    onClick={handleResume}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-(--color-text) px-6 py-3.5 text-sm font-medium text-(--color-bg) transition hover:opacity-90 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <Play className="h-5 w-5" />
                    Resume
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-6 py-3.5 text-sm font-medium text-(--color-text) transition hover:opacity-90 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Keyboard Shortcuts */}
            <div className="hidden flex-wrap justify-center gap-3 text-xs text-(--color-gray) sm:flex">
              <span className="rounded-lg bg-(--color-active-bg) px-2.5 py-1.5">
                Space — Start / Pause
              </span>
              <span className="rounded-lg bg-(--color-active-bg) px-2.5 py-1.5">
                L — Lap
              </span>
              <span className="rounded-lg bg-(--color-active-bg) px-2.5 py-1.5">
                R — Reset
              </span>
              <span className="rounded-lg bg-(--color-active-bg) px-2.5 py-1.5">
                Esc — Close
              </span>
            </div>
          </div>

          {/* Right — Laps */}
          <div className="flex min-h-0 w-full flex-col border-t border-(--color-active-border) lg:max-w-sm lg:border-l lg:border-t-0 xl:max-w-md">
            <div className="flex items-center justify-between border-b border-(--color-active-border) px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold text-(--color-text)">
                Laps ({laps.length})
              </h3>
              {laps.length > 0 && (
                <button
                  onClick={handleClearLaps}
                  className="cursor-pointer text-xs text-(--color-gray) transition hover:opacity-70"
                >
                  Clear all
                </button>
              )}
            </div>

            <div ref={lapListRef} className="flex-1 overflow-y-auto">
              {laps.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-6">
                  <Flag className="h-8 w-8 text-(--color-gray) opacity-40" />
                  <p className="text-sm text-(--color-gray)">No laps yet</p>
                  <p className="text-xs text-(--color-gray)">
                    Press Lap while running to record
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-(--color-active-border)">
                  {laps.map((lap) => {
                    const isFastest = fastestLap && lap.id === fastestLap.id;
                    const isSlowest = slowestLap && lap.id === slowestLap.id;
                    return (
                      <motion.div
                        key={lap.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-between px-4 py-3 sm:px-5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                              isFastest
                                ? "bg-green-500/15 text-green-500"
                                : isSlowest
                                  ? "bg-red-500/15 text-red-500"
                                  : "bg-(--color-active-bg) text-(--color-text)"
                            }`}
                          >
                            {padZero(lap.id)}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-semibold text-(--color-text)">
                              {formatTimeString(lap.diff)}
                            </span>
                            <span className="font-mono text-xs text-(--color-gray)">
                              Total: {formatTimeString(lap.time)}
                            </span>
                          </div>
                        </div>
                        {(isFastest || isSlowest) && (
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${
                              isFastest
                                ? "bg-green-500/15 text-green-500"
                                : "bg-red-500/15 text-red-500"
                            }`}
                          >
                            {isFastest ? "Fastest" : "Slowest"}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-col gap-3 border-t border-(--color-active-border) px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              {isRunning ? "Running" : elapsed > 0 ? "Paused" : "Ready"}
            </span>
            {laps.length > 0 && (
              <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
                {laps.length} Lap{laps.length !== 1 && "s"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleReset}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2.5 text-sm font-medium text-(--color-text) transition hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleCopy}
              disabled={elapsed === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--color-text) px-4 py-2.5 text-sm font-medium text-(--color-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Time
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
