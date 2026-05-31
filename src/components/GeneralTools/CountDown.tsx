"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trash2,
  X,
} from "lucide-react";

interface CountDownModalProps {
  onClose: () => void;
}

type Mode = "timer" | "date";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "30 min", seconds: 1800 },
  { label: "1 hour", seconds: 3600 },
];

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

export const CountDownModal = ({ onClose }: CountDownModalProps) => {
  const [mode, setMode] = useState<Mode>("timer");
  const [copied, setCopied] = useState(false);

  // Timer mode
  const [inputHours, setInputHours] = useState("0");
  const [inputMinutes, setInputMinutes] = useState("5");
  const [inputSeconds, setInputSeconds] = useState("0");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Date mode
  const [targetDate, setTargetDate] = useState("");
  const [dateRemaining, setDateRemaining] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // ESC & scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onClose]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || mode !== "timer") return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setIsFinished(true);
          // eslint-disable-next-line react-hooks/immutability
          playAlarm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  // Date countdown
  useEffect(() => {
    if (mode !== "date" || !targetDate) return;

    const update = () => {
      setDateRemaining(getSecondsUntilDate(targetDate));
    };

    update();
    const id = setInterval(update, 1000);

    return () => clearInterval(id);
  }, [mode, targetDate]);

  const playAlarm = () => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gain.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 1500);
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  const handleStart = () => {
    const total =
      Number(inputHours) * 3600 +
      Number(inputMinutes) * 60 +
      Number(inputSeconds);

    if (total <= 0) return;

    setTotalSeconds(total);
    setRemaining(total);
    setIsRunning(true);
    setIsFinished(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

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

  const handlePreset = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    setInputHours(String(h));
    setInputMinutes(String(m));
    setInputSeconds(String(s));

    setTotalSeconds(seconds);
    setRemaining(seconds);
    setIsRunning(true);
    setIsFinished(false);
  };

  const handleCopy = async () => {
    const display =
      mode === "timer" ? formatTime(remaining) : formatTime(dateRemaining);

    const text = `${display.hours}:${display.minutes}:${display.seconds}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const progress =
    totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const timerDisplay = formatTime(mode === "timer" ? remaining : dateRemaining);

  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 h-screen w-screen bg-(--color-bg) text-(--color-text)"
    >
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-(--color-active-border) px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--color-active-bg)">
              <Timer className="h-5 w-5 text-(--color-text)" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-(--color-text) sm:text-xl">
                Countdown Timer
              </h2>
              <p className="text-sm text-(--color-gray)">
                Set a timer or count down to a specific date
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

        {/* Mode Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-(--color-active-border) px-4 py-3 sm:px-6">
          {(["timer", "date"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                handleReset();
              }}
              className={`cursor-pointer shrink-0 rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
                mode === m
                  ? "bg-(--color-text) text-(--color-bg)"
                  : "bg-(--color-active-bg) text-(--color-text) hover:opacity-80"
              }`}
            >
              {m === "timer" ? "Timer" : "Target Date"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-4 sm:p-6">
          {/* Timer Display */}
          <div className="flex flex-col items-center gap-4">
            {/* Progress Ring */}
            {mode === "timer" && totalSeconds > 0 && (
              <div className="relative mb-2">
                <svg
                  className="h-48 w-48 sm:h-56 sm:w-56"
                  viewBox="0 0 200 200"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    strokeWidth="6"
                    className="stroke-(--color-active-border)"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="stroke-(--color-text)"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                    transform="rotate(-90 100 100)"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`font-mono text-4xl font-bold sm:text-5xl ${
                      isFinished
                        ? "animate-pulse text-red-500"
                        : "text-(--color-text)"
                    }`}
                  >
                    {timerDisplay.hours}:{timerDisplay.minutes}:
                    {timerDisplay.seconds}
                  </span>
                </div>
              </div>
            )}

            {/* Date mode or not started */}
            {(mode === "date" || (mode === "timer" && totalSeconds === 0)) && (
              <span
                className={`font-mono text-5xl font-bold sm:text-7xl ${
                  isFinished
                    ? "animate-pulse text-red-500"
                    : "text-(--color-text)"
                }`}
              >
                {timerDisplay.hours}:{timerDisplay.minutes}:
                {timerDisplay.seconds}
              </span>
            )}

            {isFinished && (
              <p className="animate-pulse text-lg font-semibold text-red-500">
                Time is up!
              </p>
            )}
          </div>

          {/* Controls */}
          {mode === "timer" && (
            <div className="flex w-full max-w-md flex-col items-center gap-6">
              {/* Input fields */}
              {!isRunning && remaining === 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-xs text-(--color-gray)">
                        Hours
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={inputHours}
                        onChange={(e) => setInputHours(e.target.value)}
                        className="w-20 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3 text-center text-lg font-semibold text-(--color-text) outline-none"
                      />
                    </div>

                    <span className="mt-5 text-2xl font-bold text-(--color-gray)">
                      :
                    </span>

                    <div className="flex flex-col items-center gap-1">
                      <label className="text-xs text-(--color-gray)">
                        Minutes
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={inputMinutes}
                        onChange={(e) => setInputMinutes(e.target.value)}
                        className="w-20 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3 text-center text-lg font-semibold text-(--color-text) outline-none"
                      />
                    </div>

                    <span className="mt-5 text-2xl font-bold text-(--color-gray)">
                      :
                    </span>

                    <div className="flex flex-col items-center gap-1">
                      <label className="text-xs text-(--color-gray)">
                        Seconds
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={inputSeconds}
                        onChange={(e) => setInputSeconds(e.target.value)}
                        className="w-20 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3 text-center text-lg font-semibold text-(--color-text) outline-none"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {PRESETS.map(({ label, seconds }) => (
                      <button
                        key={label}
                        onClick={() => handlePreset(seconds)}
                        className="cursor-pointer rounded-xl bg-(--color-active-bg) px-4 py-2 text-sm font-medium text-(--color-text) transition hover:opacity-80"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Play / Pause / Reset */}
              <div className="flex gap-3">
                {!isRunning && remaining === 0 && !isFinished && (
                  <button
                    onClick={handleStart}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-text) px-6 py-3 text-sm font-medium text-(--color-bg) transition hover:opacity-90"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </button>
                )}

                {isRunning && (
                  <button
                    onClick={handlePause}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-active-bg) px-6 py-3 text-sm font-medium text-(--color-text) transition hover:opacity-90"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                )}

                {!isRunning && remaining > 0 && !isFinished && (
                  <button
                    onClick={handleResume}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-text) px-6 py-3 text-sm font-medium text-(--color-bg) transition hover:opacity-90"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </button>
                )}

                {(remaining > 0 || isFinished) && (
                  <button
                    onClick={handleReset}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-6 py-3 text-sm font-medium text-(--color-text) transition hover:opacity-90"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Date mode input */}
          {mode === "date" && (
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
              <label className="text-sm font-medium text-(--color-text)">
                Target Date & Time
              </label>

              <input
                type="datetime-local"
                value={targetDate}
                min={getMinDate()}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3 text-sm text-(--color-text) outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-(--color-active-border) px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-2">
            {mode === "timer" && (
              <>
                <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
                  {isRunning ? "Running" : isFinished ? "Finished" : "Ready"}
                </span>
                {totalSeconds > 0 && (
                  <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
                    Progress: {Math.round(progress)}%
                  </span>
                )}
              </>
            )}

            {mode === "date" && targetDate && (
              <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
                {dateRemaining > 0 ? "Counting down..." : "Target reached!"}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => {
                handleReset();
                setTargetDate("");
              }}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2.5 text-sm font-medium text-(--color-text) transition hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>

            <button
              onClick={handleCopy}
              disabled={
                mode === "timer" ? remaining === 0 : dateRemaining === 0
              }
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
