// NumberGenerator.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import {
  X,
  Dices,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Layers,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ─── Types ─── */
type Mode = "single" | "multiple";

interface GeneratorState {
  mode: Mode;
  min: string;
  max: string;
  count: string;
  allowDecimal: boolean;
  decimalPlaces: string;
  results: string[];
}

/* ─── Modal Wrapper ─── */
export const NumberGeneratorModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="relative w-full max-w-lg rounded-2xl border border-(--color-active-border) bg-(--color-bg) p-5 shadow-2xl sm:p-6"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.15 }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-active-bg)">
              <Dices className="h-5 w-5 text-(--color-text)" />
            </div>
            <h2 className="text-lg font-semibold text-(--color-text)">
              Number Generator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 hover:bg-(--color-active-bg)"
          >
            <X className="h-5 w-5 text-(--color-gray)" />
          </button>
        </div>

        <NumberGeneratorContent />
      </motion.div>
    </motion.div>
  );
};

/* ─── Core Content ─── */
const NumberGeneratorContent = () => {
  const [state, setState] = useState<GeneratorState>({
    mode: "single",
    min: "1",
    max: "100",
    count: "5",
    allowDecimal: false,
    decimalPlaces: "2",
    results: [],
  });

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    <K extends keyof GeneratorState>(key: K, value: GeneratorState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    [],
  );

  /* ── Generate ── */
  const generate = useCallback(() => {
    const min = parseFloat(state.min);
    const max = parseFloat(state.max);
    const count =
      state.mode === "multiple" ? Math.max(1, parseInt(state.count) || 1) : 1;
    const places = Math.max(
      0,
      Math.min(10, parseInt(state.decimalPlaces) || 2),
    );

    if (isNaN(min) || isNaN(max)) {
      setError("Please enter valid min and max numbers.");
      return;
    }
    if (min > max) {
      setError("Min must be less than or equal to Max.");
      return;
    }
    if (state.mode === "multiple" && count > 1000) {
      setError("Count must be 1,000 or less.");
      return;
    }

    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      const raw = Math.random() * (max - min) + min;
      if (state.allowDecimal) {
        results.push(raw.toFixed(places));
      } else {
        results.push(
          String(
            Math.floor(
              raw +
                (max === min
                  ? 0
                  : Math.random() < raw - Math.floor(raw)
                    ? 0
                    : 0),
            ),
          ),
        );
        // Correct integer random: inclusive both ends
        results[i] = String(
          Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
            Math.ceil(min),
        );
      }
    }

    setState((prev) => ({ ...prev, results }));
    setError(null);
    setCopied(false);
  }, [
    state.min,
    state.max,
    state.count,
    state.mode,
    state.allowDecimal,
    state.decimalPlaces,
  ]);

  /* ── Copy ── */
  const copyResults = useCallback(() => {
    if (state.results.length === 0) return;
    const text =
      state.mode === "single" ? state.results[0] : state.results.join(", ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [state.results, state.mode]);

  /* ── Validation hint ── */
  const isValid = useMemo(() => {
    const min = parseFloat(state.min);
    const max = parseFloat(state.max);
    return !isNaN(min) && !isNaN(max) && min <= max;
  }, [state.min, state.max]);

  return (
    <div className="space-y-4">
      {/* ── Mode Toggle ── */}
      <div className="flex gap-2">
        {(["single", "multiple"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => update("mode", m)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
              state.mode === m
                ? "border-(--color-text)/30 bg-(--color-active-bg) text-(--color-active-text)"
                : "border-(--color-active-border) text-(--color-gray) hover:bg-(--color-active-bg)"
            }`}
          >
            {m === "single" ? (
              <Hash className="h-4 w-4" />
            ) : (
              <Layers className="h-4 w-4" />
            )}
            <span className="capitalize">{m}</span>
          </button>
        ))}
      </div>

      {/* ── Min / Max ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-(--color-gray) uppercase">
            Min
          </label>
          <input
            type="number"
            value={state.min}
            onChange={(e) => update("min", e.target.value)}
            className="w-full rounded-xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text)/30 placeholder:text-(--color-gray)"
            placeholder="1"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-(--color-gray) uppercase">
            Max
          </label>
          <input
            type="number"
            value={state.max}
            onChange={(e) => update("max", e.target.value)}
            className="w-full rounded-xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text)/30 placeholder:text-(--color-gray)"
            placeholder="100"
          />
        </div>
      </div>

      {/* ── Count (multiple mode) ── */}
      {state.mode === "multiple" && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-(--color-gray) uppercase">
            Count
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            value={state.count}
            onChange={(e) => update("count", e.target.value)}
            className="w-full rounded-xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text)/30 placeholder:text-(--color-gray)"
            placeholder="5"
          />
        </motion.div>
      )}

      {/* ── Decimal Toggle ── */}
      <div className="flex items-center justify-between rounded-xl border border-(--color-active-border) px-4 py-3">
        <span className="text-sm font-medium text-(--color-text)">
          Allow Decimals
        </span>
        <button
          type="button"
          onClick={() => update("allowDecimal", !state.allowDecimal)}
          className="cursor-pointer text-(--color-text) transition-colors"
          aria-label="Toggle decimal"
        >
          {state.allowDecimal ? (
            <ToggleRight className="h-7 w-7" />
          ) : (
            <ToggleLeft className="h-7 w-7 text-(--color-gray)" />
          )}
        </button>
      </div>

      {/* ── Decimal Places ── */}
      {state.allowDecimal && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-(--color-gray) uppercase">
            Decimal Places
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={state.decimalPlaces}
            onChange={(e) => update("decimalPlaces", e.target.value)}
            className="w-full rounded-xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text)/30 placeholder:text-(--color-gray)"
            placeholder="2"
          />
        </motion.div>
      )}

      {/* ── Error ── */}
      {error && (
        <motion.p
          className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* ── Generate Button ── */}
      <button
        type="button"
        onClick={generate}
        disabled={!isValid}
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
          isValid
            ? "bg-(--color-text) text-(--color-bg) hover:opacity-90"
            : "cursor-not-allowed bg-(--color-active-bg) text-(--color-gray)"
        }`}
      >
        <RefreshCw className="h-4 w-4" />
        Generate
      </button>

      {/* ── Results ── */}
      {state.results.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-(--color-gray) uppercase">
              Result{state.results.length > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={copyResults}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-(--color-gray) transition-colors hover:bg-(--color-active-bg) hover:text-(--color-text)"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Single result - big display */}
          {state.mode === "single" && (
            <div className="flex items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) py-8">
              <span className="text-4xl font-bold tracking-tight text-(--color-text) sm:text-5xl">
                {state.results[0]}
              </span>
            </div>
          )}

          {/* Multiple results - grid */}
          {state.mode === "multiple" && (
            <div className="max-h-52 overflow-y-auto rounded-xl border border-(--color-active-border)">
              <div className="grid grid-cols-3 gap-px bg-(--color-active-border) sm:grid-cols-4">
                {state.results.map((num, i) => (
                  <div
                    key={`${i}-${num}`}
                    className="flex items-center justify-center bg-(--color-bg) px-2 py-2.5 text-sm font-medium tabular-nums text-(--color-text)"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-(--color-gray)">
            {state.results.length} number{state.results.length > 1 ? "s" : ""}{" "}
            generated
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default NumberGeneratorContent;
