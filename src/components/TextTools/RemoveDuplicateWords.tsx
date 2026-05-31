"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, FileX2, Trash2, X } from "lucide-react";

interface RemoveDuplicateWordsModalProps {
  onClose: () => void;
}

type Mode = "exact" | "case-insensitive" | "per-line";

const MODES: { id: Mode; label: string; description: string }[] = [
  {
    id: "exact",
    label: "Exact Match",
    description: "Remove duplicate words that are exactly the same",
  },
  {
    id: "case-insensitive",
    label: "Case Insensitive",
    description: "Remove duplicates ignoring upper/lowercase",
  },
  {
    id: "per-line",
    label: "Per Line",
    description: "Remove duplicate words within each line separately",
  },
];

export const RemoveDuplicateWordsModal = ({
  onClose,
}: RemoveDuplicateWordsModalProps) => {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<Mode>("exact");

  const output = useMemo(() => {
    if (!input) return "";

    switch (mode) {
      case "exact": {
        const seen = new Set<string>();
        return input
          .split(/(\s+)/)
          .filter((token) => {
            if (/^\s+$/.test(token)) return true;
            if (seen.has(token)) return false;
            seen.add(token);
            return true;
          })
          .join("");
      }

      case "case-insensitive": {
        const seen = new Set<string>();
        return input
          .split(/(\s+)/)
          .filter((token) => {
            if (/^\s+$/.test(token)) return true;
            const key = token.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .join("");
      }

      case "per-line": {
        return input
          .split("\n")
          .map((line) => {
            const seen = new Set<string>();
            return line
              .split(/(\s+)/)
              .filter((token) => {
                if (/^\s+$/.test(token)) return true;
                const key = token.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              .join("");
          })
          .join("\n");
      }

      default:
        return input;
    }
  }, [input, mode]);

  const inputWordCount =
    input.trim() === "" ? 0 : input.trim().split(/\s+/).length;
  const outputWordCount =
    output.trim() === "" ? 0 : output.trim().split(/\s+/).length;
  const removedWords = inputWordCount - outputWordCount;

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
    };
  }, [onClose]);

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleClear = () => {
    setInput("");
    setCopied(false);
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
              <FileX2 className="h-5 w-5 text-(--color-text)" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-(--color-text) sm:text-xl">
                Remove Duplicate Words
              </h2>
              <p className="text-sm text-(--color-gray)">
                Remove repeated words and keep only unique ones
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
          {MODES.map(({ id, label, description }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              title={description}
              className={`cursor-pointer shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                mode === id
                  ? "bg-(--color-text) text-(--color-bg)"
                  : "bg-(--color-active-bg) text-(--color-text) hover:opacity-80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2">
          {/* Input */}
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-(--color-text)">
                Input Text
              </label>
              <span className="text-xs text-(--color-gray)">
                {inputWordCount} word{inputWordCount !== 1 && "s"}
              </span>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your text here..."
              spellCheck={false}
              className="min-h-65 flex-1 resize-none rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4 text-sm text-(--color-text) outline-none placeholder:text-(--color-gray)"
            />
          </div>

          {/* Output */}
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-(--color-text)">
                Result
              </label>
              <span className="text-xs text-(--color-gray)">
                {outputWordCount} word{outputWordCount !== 1 && "s"}
              </span>
            </div>

            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="min-h-65 flex-1 resize-none rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4 text-sm text-(--color-text) outline-none placeholder:text-(--color-gray)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-(--color-active-border) px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              Input: {inputWordCount} word{inputWordCount !== 1 && "s"}
            </span>
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              Output: {outputWordCount} word{outputWordCount !== 1 && "s"}
            </span>
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              Removed: {removedWords < 0 ? 0 : removedWords} word
              {removedWords !== 1 && "s"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleClear}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2.5 text-sm font-medium text-(--color-text) transition hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>

            <button
              onClick={handleCopy}
              disabled={!output}
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
                  Copy Result
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
