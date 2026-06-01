"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ArrowUpDown,
  Calculator,
  Hash,
  ChevronDown,
  Check,
  Eraser,
  Copy,
  CheckCheck,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SelectOptionItem {
  label: string;
  value: string;
  shortLabel?: string;
}

// ─── Custom Select ───────────────────────────────────────────────────────────

const SelectOption = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}: {
  options: SelectOptionItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`
          relative w-full flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-xl
          bg-(--color-active-bg) text-(--color-text) text-sm font-medium
          border-2 transition-all duration-200 focus:outline-none
          ${open ? "border-(--color-active-text) shadow-lg shadow-(--color-active-text)/10" : "border-transparent hover:border-(--color-active-border)"}
        `}
      >
        <span
          className={`truncate ${selected ? "text-(--color-text)" : "text-(--color-gray)"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="shrink-0 text-(--color-gray)"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-300000000 mt-1.5 w-full min-w-48 rounded-xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-2xl max-h-60 overflow-y-auto"
            style={{ top: "100%" }}
          >
            <div className="p-1">
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.02,
                      duration: 0.15,
                      ease: "easeOut",
                    }}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all duration-150
                      ${
                        isSelected
                          ? "bg-(--color-active-text)/10 text-(--color-active-text) font-medium"
                          : "text-(--color-text) hover:bg-(--color-active-bg)"
                      }
                    `}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                        className="text-(--color-active-text)"
                      >
                        <Check size={13} strokeWidth={3} />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Copy Button ─────────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={handleCopy}
      className="flex items-center gap-1 p-1 rounded-md text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-all"
      title="Copy"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-emerald-500"
          >
            <CheckCheck size={12} />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy size={12} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ─── Base System Types & Data ────────────────────────────────────────────────

type BaseSystem =
  | "bin"
  | "dec"
  | "oct"
  | "hex"
  | "text"
  | "ascii"
  | "roman"
  | "arabic-east"
  | "hebrew"
  | "russian";

const BASE_OPTIONS: SelectOptionItem[] = [
  { label: "Binary (2)", value: "bin", shortLabel: "BIN" },
  { label: "Decimal (10)", value: "dec", shortLabel: "DEC" },
  { label: "Octal (8)", value: "oct", shortLabel: "OCT" },
  { label: "Hex (16)", value: "hex", shortLabel: "HEX" },
  { label: "Text", value: "text", shortLabel: "TXT" },
  { label: "ASCII", value: "ascii", shortLabel: "ASCII" },
  { label: "Roman", value: "roman", shortLabel: "ROM" },
  { label: "Arabic (٠١٢)", value: "arabic-east", shortLabel: "AR" },
  { label: "Hebrew", value: "hebrew", shortLabel: "HEB" },
  { label: "Russian", value: "russian", shortLabel: "RUS" },
];

// ─── Linked pairs ────────────────────────────────────────────────────────────

const LINKED_PAIRS: Record<string, string> = {
  text: "ascii",
  ascii: "text",
};

// ─── Validation ──────────────────────────────────────────────────────────────

function getValidationPattern(base: BaseSystem): RegExp | null {
  switch (base) {
    case "bin":
      return /^[01\s]*$/;
    case "dec":
      return /^[0-9\s-]*$/;
    case "oct":
      return /^[0-7\s]*$/;
    case "hex":
      return /^[0-9a-fA-F\s]*$/;
    case "roman":
      return /^[IVXLCDMivxlcdm\s]*$/;
    case "arabic-east":
      return /^[٠-٩\s]*$/;
    case "hebrew":
      return /^[0-9\s]*$/;
    case "russian":
      return /^[0-9\s]*$/;
    case "ascii":
      return /^[0-9\s]*$/;
    case "text":
      return null;
    default:
      return null;
  }
}

function getValidationHint(base: BaseSystem): string {
  switch (base) {
    case "bin":
      return "Only 0 and 1 allowed";
    case "dec":
      return "Only digits 0–9 allowed";
    case "oct":
      return "Only digits 0–7 allowed";
    case "hex":
      return "Only 0–9 and A–F allowed";
    case "roman":
      return "Only I, V, X, L, C, D, M allowed";
    case "arabic-east":
      return "Only Eastern Arabic numerals (٠-٩) allowed";
    case "hebrew":
      return "Enter a number (1–9999)";
    case "russian":
      return "Enter a number (0–999999)";
    case "ascii":
      return "Only ASCII codes (space-separated numbers)";
    case "text":
      return "Any text allowed";
    default:
      return "";
  }
}

function isInputValid(value: string, base: BaseSystem): boolean {
  if (!value.trim()) return true;
  const pattern = getValidationPattern(base);
  if (!pattern) return true;
  return pattern.test(value);
}

// ─── Conversion Logic ────────────────────────────────────────────────────────

function toRoman(num: number): string {
  if (num <= 0 || num > 3999 || !Number.isInteger(num))
    return "Invalid (1–3999)";
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = [
    "M",
    "CM",
    "D",
    "CD",
    "C",
    "XC",
    "L",
    "XL",
    "X",
    "IX",
    "V",
    "IV",
    "I",
  ];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

function fromRoman(s: string): number {
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  const upper = s.toUpperCase().trim();
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const curr = map[upper[i]];
    const next = map[upper[i + 1]];
    if (curr === undefined) return NaN;
    total += next && curr < next ? -curr : curr;
  }
  return total;
}

function toArabicEastern(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => (d === "-" ? "-" : (digits[parseInt(d)] ?? d)))
    .join("");
}

function fromArabicEastern(s: string): number {
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return parseInt(
    s
      .split("")
      .map((c) => map[c] ?? c)
      .join(""),
    10,
  );
}

function toHebrew(num: number): string {
  if (num <= 0 || num > 9999 || !Number.isInteger(num))
    return "Invalid (1–9999)";
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hunds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  const thous = ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳"];
  const t = Math.floor(num / 1000);
  const h = Math.floor((num % 1000) / 100);
  const tn = Math.floor((num % 100) / 10);
  const o = num % 10;
  let r = thous[t] + hunds[h] + tens[tn] + ones[o];
  r = r.replace("יה", "טו").replace("יו", "טז");
  return r || "?";
}

function toRussian(num: number): string {
  if (!Number.isInteger(num) || num < 0 || num > 999999)
    return "Invalid (0–999999)";
  if (num === 0) return "ноль";
  const ones = [
    "",
    "один",
    "два",
    "три",
    "четыре",
    "пять",
    "шесть",
    "семь",
    "восемь",
    "девять",
  ];
  const onesF = [
    "",
    "одна",
    "две",
    "три",
    "четыре",
    "пять",
    "шесть",
    "семь",
    "восемь",
    "девять",
  ];
  const teens = [
    "десять",
    "одиннадцать",
    "двенадцать",
    "тринадцать",
    "четырнадцать",
    "пятнадцать",
    "шестнадцать",
    "семнадцать",
    "восемнадцать",
    "девятнадцать",
  ];
  const tens2 = [
    "",
    "",
    "двадцать",
    "тридцать",
    "сорок",
    "пятьдесят",
    "шестьдесят",
    "семьдесят",
    "восемьдесят",
    "девяносто",
  ];
  const hunds2 = [
    "",
    "сто",
    "двести",
    "триста",
    "четыреста",
    "пятьсот",
    "шестьсот",
    "семьсот",
    "восемьсот",
    "девятьсот",
  ];
  const parts: string[] = [];
  const thousands = Math.floor((num % 1000000) / 1000);
  const rest = num % 1000;

  function chunk(n: number, fem: boolean): string {
    const h = Math.floor(n / 100),
      t = Math.floor((n % 100) / 10),
      o = n % 10;
    const res: string[] = [];
    if (h) res.push(hunds2[h]);
    if (t === 1) res.push(teens[o]);
    else {
      if (t) res.push(tens2[t]);
      if (o) res.push(fem ? onesF[o] : ones[o]);
    }
    return res.join(" ");
  }

  if (thousands) {
    const c = chunk(thousands, true);
    const last = thousands % 10;
    const inTeens = thousands % 100 >= 11 && thousands % 100 <= 19;
    parts.push(
      c +
        " " +
        (inTeens || last >= 5 || last === 0
          ? "тысяч"
          : last === 1
            ? "тысяча"
            : "тысячи"),
    );
  }
  if (rest) parts.push(chunk(rest, false));
  return parts.join(" ").trim();
}

function textToAscii(text: string): string {
  if (!text.trim()) return "";
  return text
    .split("")
    .map((c) => c.charCodeAt(0))
    .join(" ");
}

function asciiToText(ascii: string): string {
  if (!ascii.trim()) return "";
  try {
    const codes = ascii.trim().split(/\s+/).map(Number);
    if (codes.some(isNaN)) return "Invalid ASCII codes";
    return String.fromCharCode(...codes);
  } catch {
    return "Invalid ASCII codes";
  }
}

function toDecimalNum(value: string, from: BaseSystem): number {
  const raw = value.trim();
  if (!raw) return NaN;
  switch (from) {
    case "bin":
      return parseInt(raw, 2);
    case "dec":
      return parseInt(raw, 10);
    case "oct":
      return parseInt(raw, 8);
    case "hex":
      return parseInt(raw, 16);
    case "roman":
      return fromRoman(raw);
    case "arabic-east":
      return fromArabicEastern(raw);
    case "hebrew":
    case "russian":
      return parseInt(raw, 10);
    case "ascii": {
      const codes = raw.trim().split(/\s+/).map(Number);
      if (codes.length === 1 && !isNaN(codes[0])) return codes[0];
      return NaN;
    }
    case "text":
      return NaN;
    default:
      return NaN;
  }
}

function fromDecimalNum(num: number, to: BaseSystem): string {
  if (isNaN(num)) return "Invalid input";
  switch (to) {
    case "bin":
      return num.toString(2);
    case "dec":
      return num.toString(10);
    case "oct":
      return num.toString(8);
    case "hex":
      return num.toString(16).toUpperCase();
    case "roman":
      return toRoman(num);
    case "arabic-east":
      return toArabicEastern(num);
    case "hebrew":
      return toHebrew(num);
    case "russian":
      return toRussian(num);
    case "ascii":
      return String(num);
    case "text":
      return String.fromCharCode(num);
    default:
      return "";
  }
}

function convertValue(input: string, from: BaseSystem, to: BaseSystem): string {
  const raw = input.trim();
  if (!raw) return "";
  try {
    // Text → ASCII
    if (from === "text" && to === "ascii") return textToAscii(raw);
    // ASCII → Text
    if (from === "ascii" && to === "text") return asciiToText(raw);
    // Text → other numeric bases (convert each char to its code, then to target base)
    if (from === "text") {
      const codes = raw.split("").map((c) => c.charCodeAt(0));
      switch (to) {
        case "dec":
          return codes.join(" ");
        case "bin":
          return codes.map((c) => c.toString(2)).join(" ");
        case "oct":
          return codes.map((c) => c.toString(8)).join(" ");
        case "hex":
          return codes.map((c) => c.toString(16).toUpperCase()).join(" ");
        default:
          return codes.join(" ");
      }
    }
    // Other → Text (interpret as single decimal → char)
    if (to === "text") {
      const dec = toDecimalNum(raw, from);
      if (isNaN(dec)) return "Invalid input";
      return String.fromCharCode(dec);
    }
    // ASCII → other numeric (space-separated codes)
    if (from === "ascii") {
      const codes = raw.trim().split(/\s+/).map(Number);
      if (codes.some(isNaN)) return "Invalid ASCII codes";
      switch (to) {
        case "dec":
          return codes.join(" ");
        case "bin":
          return codes.map((c) => c.toString(2)).join(" ");
        case "oct":
          return codes.map((c) => c.toString(8)).join(" ");
        case "hex":
          return codes.map((c) => c.toString(16).toUpperCase()).join(" ");
        case "roman":
          return codes.length === 1
            ? toRoman(codes[0])
            : codes.map((c) => toRoman(c)).join(" ");
        default:
          return codes.join(" ");
      }
    }
    // Other → ASCII
    if (to === "ascii") {
      const dec = toDecimalNum(raw, from);
      if (isNaN(dec)) return "Invalid input";
      return String(dec);
    }
    // Normal numeric ↔ numeric
    if (from === to) return raw;
    const dec = toDecimalNum(raw, from);
    if (isNaN(dec)) return "Invalid input";
    return fromDecimalNum(dec, to);
  } catch {
    return "Invalid input";
  }
}

function getPlaceholder(base: BaseSystem): string {
  switch (base) {
    case "bin":
      return "1010";
    case "dec":
      return "42";
    case "oct":
      return "52";
    case "hex":
      return "2A";
    case "text":
      return "Hello";
    case "ascii":
      return "72 101 108 108 111";
    case "roman":
      return "XLII";
    case "arabic-east":
      return "٤٢";
    case "hebrew":
      return "42";
    case "russian":
      return "42";
    default:
      return "";
  }
}

function getBaseShort(base: BaseSystem): string {
  return (
    BASE_OPTIONS.find((o) => o.value === base)?.shortLabel ?? base.toUpperCase()
  );
}

// ─── Arithmetic ──────────────────────────────────────────────────────────────

type ArithBase = "binary" | "decimal" | "hex" | "octal";
type ArithOp = "+" | "−" | "×" | "÷";

const ARITH_BASE_OPTIONS: SelectOptionItem[] = [
  { label: "Binary (2)", value: "binary" },
  { label: "Decimal (10)", value: "decimal" },
  { label: "Hex (16)", value: "hex" },
  { label: "Octal (8)", value: "octal" },
];

function getArithValidationPattern(base: ArithBase): RegExp {
  switch (base) {
    case "binary":
      return /^[01]*$/;
    case "decimal":
      return /^[0-9-]*$/;
    case "hex":
      return /^[0-9a-fA-F]*$/;
    case "octal":
      return /^[0-7]*$/;
  }
}

function getArithValidationHint(base: ArithBase): string {
  switch (base) {
    case "binary":
      return "Only 0 and 1";
    case "decimal":
      return "Only 0–9";
    case "hex":
      return "Only 0–9, A–F";
    case "octal":
      return "Only 0–7";
  }
}

function parseBaseNum(val: string, base: ArithBase): number {
  switch (base) {
    case "binary":
      return parseInt(val, 2);
    case "decimal":
      return parseInt(val, 10);
    case "hex":
      return parseInt(val, 16);
    case "octal":
      return parseInt(val, 8);
  }
}

function formatBaseNum(num: number, base: ArithBase): string {
  if (!isFinite(num)) return "Error";
  switch (base) {
    case "binary":
      return Math.round(num).toString(2);
    case "decimal":
      return String(num);
    case "hex":
      return Math.round(num).toString(16).toUpperCase();
    case "octal":
      return Math.round(num).toString(8);
  }
}

function getArithPlaceholder(base: ArithBase): string {
  switch (base) {
    case "binary":
      return "1010";
    case "decimal":
      return "42";
    case "hex":
      return "2A";
    case "octal":
      return "52";
  }
}

// ─── Converter Panel ─────────────────────────────────────────────────────────

const ConverterPanel = () => {
  const [fromBase, setFromBase] = useState<BaseSystem>("dec");
  const [toBase, setToBase] = useState<BaseSystem>("bin");
  const [fromValue, setFromValue] = useState("");
  const [validationError, setValidationError] = useState("");

  const toValue = convertValue(fromValue, fromBase, toBase);

  const handleInputChange = (val: string) => {
    if (!val.trim()) {
      setFromValue(val);
      setValidationError("");
      return;
    }
    if (isInputValid(val, fromBase)) {
      setFromValue(val);
      setValidationError("");
    } else {
      setValidationError(getValidationHint(fromBase));
    }
  };

  const handleFromBaseChange = (v: string) => {
    const newFrom = v as BaseSystem;
    setFromBase(newFrom);
    setFromValue("");
    setValidationError("");
    // Auto-link: if selecting text, set other to ascii & vice versa
    if (LINKED_PAIRS[newFrom] && toBase !== LINKED_PAIRS[newFrom]) {
      setToBase(LINKED_PAIRS[newFrom] as BaseSystem);
    }
  };

  const handleToBaseChange = (v: string) => {
    const newTo = v as BaseSystem;
    setToBase(newTo);
    // Auto-link: if selecting text on right, set left to ascii & vice versa
    if (LINKED_PAIRS[newTo] && fromBase !== LINKED_PAIRS[newTo]) {
      setFromBase(LINKED_PAIRS[newTo] as BaseSystem);
      setFromValue("");
      setValidationError("");
    }
  };

  const handleSwap = () => {
    const currentOutput = toValue;
    const newFromBase = toBase;
    const newToBase = fromBase;

    setFromBase(newFromBase);
    setToBase(newToBase);
    setValidationError("");

    if (
      currentOutput &&
      currentOutput !== "Invalid input" &&
      currentOutput !== "Invalid ASCII codes" &&
      isInputValid(currentOutput, newFromBase)
    ) {
      setFromValue(currentOutput);
    } else {
      setFromValue("");
    }
  };

  const clearAll = () => {
    setFromValue("");
    setValidationError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        {/* FROM */}
        <div className="flex flex-col gap-2 min-w-0">
          <label className="text-[10px] font-bold text-(--color-gray) uppercase tracking-widest">
            From
          </label>
          <SelectOption
            options={BASE_OPTIONS}
            value={fromBase}
            onChange={handleFromBaseChange}
          />
          <div className="relative">
            <textarea
              className={`
                w-full px-3 py-3 rounded-xl text-sm font-mono leading-relaxed resize-none
                bg-(--color-active-bg) text-(--color-text)
                border-2
                placeholder:text-(--color-gray)/40
                focus:outline-none
                transition-all duration-200
                min-h-22
                ${
                  validationError
                    ? "border-red-500/50 focus:border-red-500/70"
                    : "border-transparent focus:border-(--color-active-text)/30"
                }
              `}
              value={fromValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={getPlaceholder(fromBase)}
              rows={3}
            />
            <div className="absolute top-2 right-2 flex items-center gap-0.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-(--color-active-text)/10 text-(--color-active-text) tracking-wider">
                {getBaseShort(fromBase)}
              </span>
              {fromValue && <CopyButton text={fromValue} />}
              {fromValue && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  onClick={clearAll}
                  className="p-0.5 rounded text-(--color-gray) hover:text-(--color-text) transition-colors"
                >
                  <Eraser size={11} />
                </motion.button>
              )}
            </div>
            <AnimatePresence>
              {validationError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1.5 text-[10px] font-medium text-red-500 px-1"
                >
                  {validationError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SWAP */}
        <div className="flex items-center justify-center pb-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.75, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            onClick={handleSwap}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-active-bg) text-(--color-text) border-2 border-(--color-active-border) hover:border-(--color-active-text)/30 hover:shadow-lg transition-all duration-200"
          >
            <ArrowRight size={14} />
          </motion.button>
        </div>

        {/* TO (read-only) */}
        <div className="flex flex-col gap-2 min-w-0">
          <label className="text-[10px] font-bold text-(--color-gray) uppercase tracking-widest">
            To
          </label>
          <SelectOption
            options={BASE_OPTIONS}
            value={toBase}
            onChange={handleToBaseChange}
          />
          <div className="relative">
            <textarea
              readOnly
              className="
                w-full px-3 py-3 rounded-xl text-sm font-mono leading-relaxed resize-none
                bg-(--color-active-bg) text-(--color-text)
                border-2 border-transparent
                placeholder:text-(--color-gray)/40
                cursor-default
                focus:outline-none
                transition-all duration-200
                min-h-22
              "
              value={toValue}
              placeholder={getPlaceholder(toBase)}
              rows={3}
            />
            <div className="absolute top-2 right-2 flex items-center gap-0.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-(--color-active-text)/10 text-(--color-active-text) tracking-wider">
                {getBaseShort(toBase)}
              </span>
              {toValue &&
                toValue !== "Invalid input" &&
                toValue !== "Invalid ASCII codes" && (
                  <CopyButton text={toValue} />
                )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Arithmetic Panel (Multi-line) ───────────────────────────────────────────

interface ArithLine {
  id: string;
  value: string;
  op: ArithOp;
  error: string;
}

let lineIdCounter = 0;
function newLineId(): string {
  return `line-${++lineIdCounter}`;
}

const ArithmeticPanel = () => {
  const [base, setBase] = useState<ArithBase>("decimal");
  const [lines, setLines] = useState<ArithLine[]>([
    { id: newLineId(), value: "", op: "+", error: "" },
    { id: newLineId(), value: "", op: "+", error: "" },
  ]);

  const OPS: ArithOp[] = ["+", "−", "×", "÷"];

  const validateAndSet = (index: number, val: string) => {
    setLines((prev) => {
      const next = [...prev];
      if (!val.trim()) {
        next[index] = { ...next[index], value: val, error: "" };
      } else if (getArithValidationPattern(base).test(val)) {
        next[index] = { ...next[index], value: val, error: "" };
      } else {
        next[index] = { ...next[index], error: getArithValidationHint(base) };
      }
      return next;
    });
  };

  const setOp = (index: number, op: ArithOp) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], op };
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: newLineId(), value: "", op: "+", error: "" },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllLines = () => {
    setLines([
      { id: newLineId(), value: "", op: "+", error: "" },
      { id: newLineId(), value: "", op: "+", error: "" },
    ]);
  };

  // Compute result by chaining operations left-to-right
  const computeResult = (): string => {
    const filledLines = lines.filter((l) => l.value.trim());
    if (filledLines.length < 2) return "";

    let acc = parseBaseNum(filledLines[0].value.trim(), base);
    if (isNaN(acc)) return "Invalid";

    for (let i = 1; i < filledLines.length; i++) {
      const val = parseBaseNum(filledLines[i].value.trim(), base);
      if (isNaN(val)) return "Invalid";

      // Use the operator from the PREVIOUS line (it's the op between line[i-1] and line[i])
      const op = filledLines[i - 1].op;
      switch (op) {
        case "+":
          acc = acc + val;
          break;
        case "−":
          acc = acc - val;
          break;
        case "×":
          acc = acc * val;
          break;
        case "÷":
          if (val === 0) return "÷ by 0";
          acc = acc / val;
          break;
      }
    }

    return formatBaseNum(acc, base);
  };

  const result = computeResult();

  // Build expression string
  const buildExpression = (): string => {
    const filledLines = lines.filter((l) => l.value.trim());
    if (filledLines.length < 2) return "";
    let expr = filledLines[0].value.trim();
    for (let i = 1; i < filledLines.length; i++) {
      expr += ` ${filledLines[i - 1].op} ${filledLines[i].value.trim()}`;
    }
    return expr;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
    >
      {/* Base selector + clear */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SelectOption
            options={ARITH_BASE_OPTIONS}
            value={base}
            onChange={(v) => {
              setBase(v as ArithBase);
              clearAllLines();
            }}
          />
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={clearAllLines}
          className="flex h-10.5 px-3 items-center justify-center rounded-xl bg-(--color-active-bg) text-(--color-gray) hover:text-red-500 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/20 transition-all duration-200"
          title="Clear all"
        >
          <Eraser size={14} />
        </motion.button>
      </div>

      {/* Lines */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {lines.map((line, index) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2">
                {/* Operator selector (not shown for first line) */}
                <div className="w-10 shrink-0 flex items-center justify-center pt-2.5">
                  {index === 0 ? (
                    <span className="text-[10px] font-bold text-(--color-gray) uppercase tracking-widest">
                      {index + 1}
                    </span>
                  ) : (
                    <div className="relative">
                      <select
                        value={lines[index - 1].op}
                        onChange={(e) =>
                          setOp(index - 1, e.target.value as ArithOp)
                        }
                        className="
                          w-10 h-9 rounded-lg text-center text-sm font-bold appearance-none cursor-pointer
                          bg-(--color-active-text) text-(--color-bg)
                          border-0 focus:outline-none
                          transition-all duration-200
                        "
                      >
                        {OPS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex-1 min-w-0">
                  <input
                    className={`
                      w-full px-3 py-2.5 rounded-xl text-sm font-mono
                      bg-(--color-active-bg) text-(--color-text)
                      border-2
                      placeholder:text-(--color-gray)/40
                      focus:outline-none
                      transition-all duration-200
                      ${
                        line.error
                          ? "border-red-500/50 focus:border-red-500/70"
                          : "border-transparent focus:border-(--color-active-text)/30"
                      }
                    `}
                    value={line.value}
                    onChange={(e) => validateAndSet(index, e.target.value)}
                    placeholder={getArithPlaceholder(base)}
                  />
                  <AnimatePresence>
                    {line.error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="mt-1 text-[10px] font-medium text-red-500 px-1"
                      >
                        {line.error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remove button */}
                <div className="shrink-0 pt-1.5">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.8 }}
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 2}
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200
                      ${
                        lines.length <= 2
                          ? "text-(--color-gray)/30 cursor-not-allowed"
                          : "text-(--color-gray) hover:text-red-500 hover:bg-red-500/10"
                      }
                    `}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add line button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={addLine}
        className="
          flex items-center justify-center gap-2 py-2.5 rounded-xl
          border-2 border-dashed border-(--color-active-border)
          text-(--color-gray) text-sm font-medium
          hover:border-(--color-active-text)/30 hover:text-(--color-text) hover:bg-(--color-active-bg)
          transition-all duration-200
        "
      >
        <Plus size={14} />
        Add operand
      </motion.button>

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-(--color-active-bg) border border-(--color-active-border)"
          >
            {/* Expression */}
            {buildExpression() && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-(--color-gray) flex-wrap">
                <span>{buildExpression()}</span>
                <span>=</span>
              </div>
            )}
            {/* Result value */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-(--color-text) break-all flex-1">
                {result}
              </span>
              <CopyButton text={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Modal ───────────────────────────────────────────────────────────────────

type Tab = "convert" | "arithmetic";

interface BaseConverterModalProps {
  onClose: () => void;
}

const BaseConverterModal = ({ onClose }: BaseConverterModalProps) => {
  const [tab, setTab] = useState<Tab>("convert");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "convert", label: "Convert", icon: <ArrowUpDown size={14} /> },
    { key: "arithmetic", label: "Math", icon: <Calculator size={14} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-200000000 bg-black/50 backdrop-blur-md flex items-start justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-dvh flex flex-col bg-(--color-bg) overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-active-text)/15 to-(--color-active-text)/5">
                <Hash size={18} className="text-(--color-active-text)" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-(--color-text) leading-tight tracking-tight">
                  Base Converter
                </h2>
                <p className="text-[11px] text-(--color-gray) tracking-wide">
                  Number systems & arithmetic
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-active-bg) hover:bg-red-500/10 text-(--color-gray) hover:text-red-500 transition-all duration-200"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Tab bar */}
          <div className="flex mt-5 p-1 rounded-2xl bg-(--color-active-bg) gap-1">
            {TABS.map(({ key, label, icon }) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`
                  relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200
                  ${tab === key ? "text-(--color-text)" : "text-(--color-gray) hover:text-(--color-text)"}
                `}
              >
                {tab === key && (
                  <motion.div
                    layoutId="active-tab-bg"
                    className="absolute inset-0 rounded-xl bg-(--color-bg) shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 35,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {icon}
                  {label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-(--color-active-border)" />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5">
          <AnimatePresence mode="wait">
            {tab === "convert" ? (
              <motion.div
                key="convert"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <ConverterPanel />
              </motion.div>
            ) : (
              <motion.div
                key="arithmetic"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <ArithmeticPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BaseConverterModal;
