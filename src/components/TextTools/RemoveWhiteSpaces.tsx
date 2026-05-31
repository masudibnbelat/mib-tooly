"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Eraser, Trash2, X } from "lucide-react";

interface RemoveWhiteSpacesModalProps {
  onClose: () => void;
}

export const RemoveWhiteSpacesModal = ({
  onClose,
}: RemoveWhiteSpacesModalProps) => {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const output = useMemo(() => input.replace(/\s+/g, ""), [input]);
  const removedCount = input.length - output.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [onClose]);

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);

      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleClear = () => {
    setInput("");
    setCopied(false);

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-whitespaces-title"
      className="fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-(--color-bg) text-(--color-text)"
    >
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-(--color-active-border) px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--color-active-bg)">
              <Eraser className="h-5 w-5 text-(--color-text)" />
            </div>

            <div className="min-w-0">
              <h2
                id="remove-whitespaces-title"
                className="truncate text-lg font-semibold text-(--color-text) sm:text-xl"
              >
                Remove White Spaces
              </h2>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500 bg-red-500 text-white transition hover:bg-red-600 hover:border-red-600 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-2">
          {/* Input */}
          <div className="flex min-h-65 min-w-0 flex-col gap-2 lg:min-h-0">
            <label
              htmlFor="remove-whitespace-input"
              className="text-sm font-medium text-(--color-text)"
            >
              Input Text
            </label>

            <textarea
              id="remove-whitespace-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your text here..."
              spellCheck={false}
              className="min-h-55 w-full flex-1 resize-none rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4 text-sm leading-6 text-(--color-text) outline-none placeholder:text-(--color-gray) lg:min-h-0"
            />
          </div>

          {/* Output */}
          <div className="flex min-h-65 min-w-0 flex-col gap-2 lg:min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="remove-whitespace-output"
                className="text-sm font-medium text-(--color-text)"
              >
                Result
              </label>

              <span className="text-xs text-(--color-gray)">
                Removed: {removedCount}
              </span>
            </div>

            <textarea
              id="remove-whitespace-output"
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="min-h-55 w-full flex-1 resize-none rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4 text-sm leading-6 text-(--color-text) outline-none placeholder:text-(--color-gray) lg:min-h-0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-(--color-active-border) px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 sm:px-6 sm:py-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              Input: {input.length}
            </span>
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              Output: {output.length}
            </span>
            <span className="rounded-xl bg-(--color-active-bg) px-3 py-2 text-sm text-(--color-text)">
              Removed: {removedCount}
            </span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleClear}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2.5 text-sm font-medium text-(--color-text) transition hover:opacity-90 cursor-pointer sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </motion.button>

            <motion.button
              whileTap={output ? { scale: 0.98 } : undefined}
              onClick={handleCopy}
              disabled={!output}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-text) px-4 py-2.5 text-sm font-medium text-(--color-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer sm:w-auto"
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
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
