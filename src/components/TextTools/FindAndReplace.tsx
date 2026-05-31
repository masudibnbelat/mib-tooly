"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Search,
  Replace,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

interface MatchRange {
  start: number;
  end: number;
}

interface Options {
  matchCase: boolean;
  wholeWord: boolean;
  regex: boolean;
}

interface Props {
  onClose: () => void;
}

const FindAndReplace = ({ onClose }: Props) => {
  const [inputText, setInputText] = useState("");
  const [findTerm, setFindTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [opts, setOpts] = useState<Options>({
    matchCase: false,
    wholeWord: false,
    regex: false,
  });
  const [currentMatch, setCurrentMatch] = useState(0);

  const toggleOpt = (key: keyof Options) =>
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));

  const getPattern = useCallback(
    (term: string): RegExp | null => {
      if (!term) return null;
      try {
        let pat = opts.regex
          ? term
          : term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (opts.wholeWord) pat = `\\b${pat}\\b`;
        return new RegExp(pat, opts.matchCase ? "g" : "gi");
      } catch {
        return null;
      }
    },
    [opts],
  );

  const matches = useMemo((): MatchRange[] => {
    if (!findTerm || !inputText) return [];
    const pat = getPattern(findTerm);
    if (!pat) return [];
    const result: MatchRange[] = [];
    const tmp = new RegExp(pat.source, pat.flags);
    let m: RegExpExecArray | null;
    while ((m = tmp.exec(inputText)) !== null) {
      result.push({ start: m.index, end: m.index + m[0].length });
      if (m[0].length === 0) tmp.lastIndex++;
    }
    return result;
  }, [inputText, findTerm, getPattern]);

  const navigate = (dir: 1 | -1) => {
    if (!matches.length) return;
    setCurrentMatch((prev) => (prev + dir + matches.length) % matches.length);
  };

  const replaceOne = () => {
    if (!matches.length) return;
    const m = matches[currentMatch];
    setInputText(
      inputText.slice(0, m.start) + replaceTerm + inputText.slice(m.end),
    );
    toast.success("১টি match replace হয়েছে");
  };

  const replaceAll = () => {
    const pat = getPattern(findTerm);
    if (!inputText) return;
    if (!pat || !matches.length) {
      toast("কোনো match পাওয়া যায়নি");
      return;
    }
    const count = matches.length;
    setInputText(inputText.replace(pat, replaceTerm));
    setCurrentMatch(0);
    toast.success(`${count}টি match replace হয়েছে`);
  };

  const copyResult = async () => {
    const pat = getPattern(findTerm);
    const result = pat ? inputText.replace(pat, replaceTerm) : inputText;

    await navigator.clipboard.writeText(result);

    toast.success("Clipboard-এ কপি হয়েছে");

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const segments = useMemo(() => {
    if (!findTerm || !matches.length) return null;
    const parts: { text: string; isMatch: boolean; idx?: number }[] = [];
    let last = 0;
    matches.forEach((m, i) => {
      if (last < m.start)
        parts.push({ text: inputText.slice(last, m.start), isMatch: false });
      parts.push({
        text: inputText.slice(m.start, m.end),
        isMatch: true,
        idx: i,
      });
      last = m.end;
    });
    if (last < inputText.length)
      parts.push({ text: inputText.slice(last), isMatch: false });
    return parts;
  }, [inputText, findTerm, matches]);

  const TOGGLE_BTNS = [
    { key: "matchCase" as const, label: "Aa", title: "Match case" },
    { key: "wholeWord" as const, label: "[W]", title: "Whole word" },
    { key: "regex" as const, label: ".*", title: "Regex" },
  ];

  return (
    <div onClick={onClose} className="fixed inset-0 z-999999 bg-black/40">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-screen h-screen bg-(--color-bg) flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-active-border) shrink-0">
          <h2 className="text-lg font-semibold text-(--color-text) flex items-center gap-2">
            <Search className="w-5 h-5 text-(--color-gray)" />
            Find &amp; Replace
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Input */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-widest text-(--color-gray)">
              Input text
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="এখানে text paste করুন…"
              spellCheck={false}
              rows={7}
              className="w-full resize-y p-4 text-sm font-mono leading-relaxed rounded-xl border border-(--color-active-border) bg-(--color-bg) text-(--color-text) outline-none focus:border-(--color-active-text) transition-colors"
            />
          </div>

          {/* Find / Replace inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-(--color-gray) flex items-center gap-1.5">
                <Search className="w-3 h-3" /> Find
              </label>
              <input
                type="text"
                value={findTerm}
                onChange={(e) => {
                  setFindTerm(e.target.value);
                  setCurrentMatch(0);
                }}
                placeholder="খুঁজুন…"
                spellCheck={false}
                className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-(--color-active-border) bg-(--color-bg) text-(--color-text) outline-none focus:border-(--color-active-text) transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-(--color-gray) flex items-center gap-1.5">
                <Replace className="w-3 h-3" /> Replace with
              </label>
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="প্রতিস্থাপন করুন…"
                spellCheck={false}
                className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-(--color-active-border) bg-(--color-bg) text-(--color-text) outline-none focus:border-(--color-active-text) transition-colors"
              />
            </div>
          </div>

          {/* Options + actions */}
          <div className="flex flex-wrap items-center gap-2">
            {TOGGLE_BTNS.map(({ key, label, title }) => (
              <motion.button
                key={key}
                title={title}
                onClick={() => toggleOpt(key)}
                whileTap={{ scale: 0.93 }}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer select-none ${
                  opts[key]
                    ? "bg-(--color-active-bg) border-(--color-active-border) text-(--color-active-text) font-semibold"
                    : "border-(--color-active-border) text-(--color-gray) hover:bg-(--color-active-bg)"
                }`}
              >
                {label}
              </motion.button>
            ))}

            {/* Navigation */}
            <div className="flex items-center gap-1 ml-auto">
              <AnimatePresence>
                {matches.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    className="text-xs text-(--color-gray) min-w-14 text-center tabular-nums"
                  >
                    {currentMatch + 1} / {matches.length}
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={() => navigate(-1)}
                disabled={matches.length < 2}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-(--color-active-border) text-(--color-gray) hover:bg-(--color-active-bg) disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate(1)}
                disabled={matches.length < 2}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-(--color-active-border) text-(--color-gray) hover:bg-(--color-active-bg) disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={replaceOne}
              className="px-4 py-2 text-sm rounded-lg border border-(--color-active-border) text-(--color-text) hover:bg-(--color-active-bg) transition-colors cursor-pointer"
            >
              Replace
            </button>
            <motion.button
              onClick={replaceAll}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 text-sm rounded-lg bg-(--color-active-text) text-(--color-bg) hover:opacity-85 transition-opacity cursor-pointer"
            >
              Replace all
            </motion.button>
          </div>

          {/* Match chip */}
          <AnimatePresence>
            {findTerm && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-(--color-active-bg) border border-(--color-active-border) text-(--color-gray)">
                  <strong className="text-(--color-text) font-medium">
                    {matches.length}
                  </strong>{" "}
                  match{matches.length !== 1 ? "es" : ""}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <hr className="border-(--color-active-border)" />

          {/* Preview */}
          <div className="space-y-1.5 pb-2">
            <p className="text-xs font-medium uppercase tracking-widest text-(--color-gray)">
              Preview
            </p>
            <div className="relative group">
              <div className="w-full min-h-28 p-4 text-sm font-mono leading-relaxed rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) whitespace-pre-wrap wrap-break-word">
                {!inputText ? (
                  <span className="text-(--color-gray) italic">
                    উপরে text এবং search term দিন…
                  </span>
                ) : segments ? (
                  segments.map((seg, i) =>
                    seg.isMatch ? (
                      <mark
                        key={i}
                        className={`rounded px-0.5 ${
                          seg.idx === currentMatch
                            ? "bg-amber-300 text-amber-900 outline-2 outline-amber-500"
                            : "bg-amber-200 text-amber-800"
                        }`}
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )
                ) : (
                  inputText
                )}
              </div>

              <motion.button
                onClick={copyResult}
                className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-(--color-active-border) bg-(--color-bg) text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-all cursor-pointer  group-hover:opacity-100"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      Copied
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindAndReplace;
