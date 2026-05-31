"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Pause,
  Play,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

interface MorseCodeModalProps {
  onClose: () => void;
}

const CHAR_TO_MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
};

const MORSE_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(CHAR_TO_MORSE).map(([k, v]) => [v, k]),
);

const toPrettyCode = (c: string) => c.replace(/\./g, "·").replace(/-/g, "−");

const textToMorse = (text: string): string =>
  text
    .toUpperCase()
    .split("")
    .map((c) => (c === " " ? "/" : CHAR_TO_MORSE[c] || ""))
    .filter(Boolean)
    .join(" ");

const textToPrettyMorse = (text: string): string => {
  const t = text.trim();
  if (!t) return "";
  return t
    .toUpperCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split("")
        .map((c) => CHAR_TO_MORSE[c] || "")
        .filter(Boolean)
        .map(toPrettyCode)
        .join("/"),
    )
    .join("//");
};

const normalizeMorseInput = (input: string): string => {
  const W = "__WORD__";
  let t = input.replace(/[·•]/g, ".").replace(/[−–—]/g, "-").trim();
  t = t.replace(/\s*\/\/\s*/g, ` ${W} `);
  t = t.replace(/\s\/\s/g, ` ${W} `);
  t = t.replace(/\s*\/\s*/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t
    .split(" ")
    .map((tk) => (tk === W ? "/" : tk))
    .join(" ");
};

const morseToText = (morse: string): string => {
  const n = normalizeMorseInput(morse);
  if (!n) return "";
  return n
    .split(" ")
    .map((c) => (c === "/" ? " " : (MORSE_TO_CHAR[c] ?? "")))
    .join("");
};

const DOT_DURATION = 80;
const DASH_DURATION = DOT_DURATION * 3;
const SYMBOL_GAP = DOT_DURATION;
const LETTER_GAP = DOT_DURATION * 3;
const WORD_GAP = DOT_DURATION * 7;
const FREQUENCY = 600;

interface RefSectionProps {
  className?: string;
  onAppend: (char: string, morse: string) => void;
}

const RefSection = ({ className = "", onAppend }: RefSectionProps) => (
  <div className={className}>
    <div className="mb-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-gray)">
        Letters
      </p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7 lg:grid-cols-5">
        {Object.entries(CHAR_TO_MORSE)
          .filter(([k]) => /^[A-Z]$/.test(k))
          .map(([char, morse]) => (
            <button
              key={char}
              onClick={() => onAppend(char, morse)}
              className="flex cursor-pointer flex-col items-center rounded-lg bg-(--color-active-bg) p-1.5 transition hover:opacity-80 sm:p-2"
            >
              <span className="text-xs font-bold text-(--color-text) sm:text-sm">
                {char}
              </span>
              <span className="font-mono text-[10px] text-(--color-gray) sm:text-xs">
                {toPrettyCode(morse)}
              </span>
            </button>
          ))}
      </div>
    </div>

    <div className="mb-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-gray)">
        Numbers
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {Object.entries(CHAR_TO_MORSE)
          .filter(([k]) => /^[0-9]$/.test(k))
          .map(([char, morse]) => (
            <button
              key={char}
              onClick={() => onAppend(char, morse)}
              className="flex cursor-pointer flex-col items-center rounded-lg bg-(--color-active-bg) p-1.5 transition hover:opacity-80 sm:p-2"
            >
              <span className="text-xs font-bold text-(--color-text) sm:text-sm">
                {char}
              </span>
              <span className="font-mono text-[10px] text-(--color-gray) sm:text-xs">
                {toPrettyCode(morse)}
              </span>
            </button>
          ))}
      </div>
    </div>

    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-gray)">
        Punctuation
      </p>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 lg:grid-cols-5">
        {Object.entries(CHAR_TO_MORSE)
          .filter(([k]) => !/^[A-Z0-9]$/.test(k))
          .map(([char, morse]) => (
            <button
              key={char}
              onClick={() => onAppend(char, morse)}
              className="flex cursor-pointer flex-col items-center rounded-lg bg-(--color-active-bg) p-1.5 transition hover:opacity-80 sm:p-2"
            >
              <span className="text-xs font-bold text-(--color-text) sm:text-sm">
                {char}
              </span>
              <span className="font-mono text-[10px] leading-tight text-(--color-gray)">
                {toPrettyCode(morse)}
              </span>
            </button>
          ))}
      </div>
    </div>
  </div>
);

export const MorseCodeModal = ({ onClose }: MorseCodeModalProps) => {
  const [mode, setMode] = useState<"text-to-morse" | "morse-to-text">(
    "text-to-morse",
  );
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const abortRef = useRef(false);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const output =
    mode === "text-to-morse" ? textToPrettyMorse(input) : morseToText(input);

  const morseForPlayback =
    mode === "text-to-morse" ? textToMorse(input) : normalizeMorseInput(input);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
      abortRef.current = true;
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [onClose]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const playTone = useCallback(async (duration: number) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") await ctx.resume();
    if (!isMutedRef.current) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = FREQUENCY;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + duration / 1000 - 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    }
    await sleep(duration);
  }, []);

  const handlePlay = useCallback(async () => {
    if (!morseForPlayback) return;
    abortRef.current = false;
    setIsPlaying(true);
    const syms = morseForPlayback.split("");
    for (let i = 0; i < syms.length; i++) {
      if (abortRef.current) break;
      const s = syms[i];
      setCurrentSymbol(i);
      if (s === ".") {
        await playTone(DOT_DURATION);
        if (
          !abortRef.current &&
          i < syms.length - 1 &&
          syms[i + 1] !== " " &&
          syms[i + 1] !== "/"
        )
          await sleep(SYMBOL_GAP);
      } else if (s === "-") {
        await playTone(DASH_DURATION);
        if (
          !abortRef.current &&
          i < syms.length - 1 &&
          syms[i + 1] !== " " &&
          syms[i + 1] !== "/"
        )
          await sleep(SYMBOL_GAP);
      } else if (s === " ") {
        if (i + 1 < syms.length && syms[i + 1] === "/") continue;
        if (i > 0 && syms[i - 1] === "/") continue;
        await sleep(LETTER_GAP);
      } else if (s === "/") {
        await sleep(WORD_GAP);
      }
    }
    setIsPlaying(false);
    setCurrentSymbol(-1);
  }, [morseForPlayback, playTone]);

  const handleStop = () => {
    abortRef.current = true;
    setIsPlaying(false);
    setCurrentSymbol(-1);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleSwap = () => {
    if (isPlaying) handleStop();
    if (mode === "text-to-morse") {
      setMode("morse-to-text");
      setInput(output);
    } else {
      setMode("text-to-morse");
      setInput(output);
    }
  };

  const appendChar = useCallback(
    (char: string, morse: string) => {
      if (mode === "text-to-morse") {
        setInput((p) => p + char);
      } else {
        setInput((p) =>
          p ? `${p}/${toPrettyCode(morse)}` : toPrettyCode(morse),
        );
      }
    },
    [mode],
  );

  const handleClear = () => {
    if (isPlaying) handleStop();
    setInput("");
  };

  const morseSymbols = morseForPlayback.split("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex h-dvh w-screen flex-col bg-(--color-bg) text-(--color-text)"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-(--color-active-border) px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-active-bg) sm:h-11 sm:w-11">
            <Zap className="h-5 w-5 text-(--color-text)" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-(--color-text) sm:text-xl">
              Morse Code
            </h2>
            <p className="hidden text-sm text-(--color-gray) sm:block">
              {mode === "text-to-morse"
                ? "Convert text to Morse code"
                : "Convert Morse code to text"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) transition hover:opacity-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Main content — scrollable */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
            {/* Mode toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-1 items-center rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-1">
                <button
                  onClick={() => {
                    if (mode !== "text-to-morse") {
                      setMode("text-to-morse");
                      setInput("");
                      if (isPlaying) handleStop();
                    }
                  }}
                  className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-xs font-medium transition sm:px-4 sm:py-2.5 sm:text-sm ${
                    mode === "text-to-morse"
                      ? "bg-(--color-text) text-(--color-bg)"
                      : "text-(--color-gray) hover:text-(--color-text)"
                  }`}
                >
                  Text → Morse
                </button>
                <button
                  onClick={() => {
                    if (mode !== "morse-to-text") {
                      setMode("morse-to-text");
                      setInput("");
                      if (isPlaying) handleStop();
                    }
                  }}
                  className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-xs font-medium transition sm:px-4 sm:py-2.5 sm:text-sm ${
                    mode === "morse-to-text"
                      ? "bg-(--color-text) text-(--color-bg)"
                      : "text-(--color-gray) hover:text-(--color-text)"
                  }`}
                >
                  Morse → Text
                </button>
              </div>
              <button
                onClick={handleSwap}
                aria-label="Swap"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) transition hover:opacity-90 sm:h-11 sm:w-11"
              >
                <ArrowDownUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-(--color-text) sm:text-sm">
                  {mode === "text-to-morse" ? "Text Input" : "Morse Input"}
                </label>
                <span className="text-xs text-(--color-gray)">
                  {input.length} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "text-to-morse"
                    ? "Type your text here..."
                    : "····/·/·−··/·−··/−−−//·−−/−−−/·−·/·−··/−··"
                }
                rows={3}
                className="w-full resize-none rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 font-mono text-sm text-(--color-text) outline-none transition placeholder:text-(--color-gray) focus:border-(--color-text)"
              />
            </div>

            {/* Output */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-(--color-text) sm:text-sm">
                  {mode === "text-to-morse" ? "Morse Output" : "Text Output"}
                </label>
                {output && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs text-(--color-gray) transition hover:text-(--color-text)"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="min-h-20 w-full break-all rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 font-mono text-sm text-(--color-text) sm:min-h-28">
                {output || (
                  <span className="text-(--color-gray)">
                    Output will appear here...
                  </span>
                )}
              </div>
            </div>

            {/* Visual */}
            {morseForPlayback && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-(--color-text) sm:text-sm">
                  Visual Signal
                </label>
                <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-3 sm:gap-1.5 sm:p-4">
                  {morseSymbols.map((sym, idx) => {
                    const active = idx === currentSymbol && isPlaying;
                    if (sym === ".")
                      return (
                        <div
                          key={idx}
                          className={`h-2.5 w-2.5 rounded-full transition-colors duration-100 sm:h-3 sm:w-3 ${
                            active
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                              : "bg-(--color-gray) opacity-40"
                          }`}
                        />
                      );
                    if (sym === "-")
                      return (
                        <div
                          key={idx}
                          className={`h-2.5 w-6 rounded-full transition-colors duration-100 sm:h-3 sm:w-8 ${
                            active
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                              : "bg-(--color-gray) opacity-40"
                          }`}
                        />
                      );
                    if (sym === "/")
                      return (
                        <div
                          key={idx}
                          className="mx-1.5 h-2.5 w-px bg-(--color-active-border) sm:mx-2 sm:h-3"
                        />
                      );
                    if (sym === " ")
                      return <div key={idx} className="w-1.5 sm:w-2" />;
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Mobile Reference (collapsible) */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowRef(!showRef)}
                className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 text-sm font-medium text-(--color-text) transition hover:opacity-90"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Reference Chart
                </div>
                {showRef ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <AnimatePresence>
                {showRef && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <RefSection className="pt-3" onAppend={appendChar} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Desktop Reference — sidebar */}
        <div className="hidden min-h-0 w-full flex-col border-l border-(--color-active-border) lg:flex lg:max-w-sm xl:max-w-md">
          <div className="flex items-center justify-between border-b border-(--color-active-border) px-5 py-3">
            <h3 className="text-sm font-semibold text-(--color-text)">
              Reference Chart
            </h3>
            <span className="text-xs text-(--color-gray)">
              {Object.keys(CHAR_TO_MORSE).length} symbols
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <RefSection onAppend={appendChar} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-(--color-active-border) px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl bg-(--color-active-bg) px-2.5 py-1.5 text-xs text-(--color-text) sm:px-3 sm:py-2 sm:text-sm">
            {mode === "text-to-morse" ? "Text → Morse" : "Morse → Text"}
          </span>
          {output && (
            <span className="rounded-xl bg-(--color-active-bg) px-2.5 py-1.5 text-xs text-(--color-text) sm:px-3 sm:py-2 sm:text-sm">
              {output.length} chars
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-3 py-2 text-xs font-medium text-(--color-text) transition hover:opacity-90 sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          <button
            onClick={handleClear}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-3 py-2 text-xs font-medium text-(--color-text) transition hover:opacity-90 sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {isPlaying ? (
            <button
              onClick={handleStop}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Pause className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={!morseForPlayback}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-(--color-text) px-3 py-2 text-xs font-medium text-(--color-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Play className="h-4 w-4" />
              Play
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MorseCodeModal;
