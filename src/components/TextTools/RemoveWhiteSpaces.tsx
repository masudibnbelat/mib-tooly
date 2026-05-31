"use client";

import { useEffect, useMemo, useState } from "react";
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

  const output = useMemo(() => {
    return input.replace(/\s+/g, "");
  }, [input]);

  const removedCount = input.length - output.length;

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

      setTimeout(() => {
        setCopied(false);
      }, 1500);
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
              <Eraser className="h-5 w-5 text-(--color-text)" />
            </div>

            <div>
              <h2 className="text-lg font-semibold sm:text-xl text-(--color-text)">
                Remove White Spaces
              </h2>
              <p className="text-sm text-(--color-gray)">
                Remove all spaces, tabs, and line breaks instantly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) transition hover:opacity-90 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2">
          {/* Input */}
          <div className="flex min-h-0 flex-col gap-2">
            <label className="text-sm font-medium text-(--color-text)">
              Input Text
            </label>

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
                Removed: {removedCount}
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2.5 text-sm font-medium text-(--color-text) transition hover:opacity-90 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>

            <button
              onClick={handleCopy}
              disabled={!output}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-text) px-4 py-2.5 text-sm font-medium text-(--color-bg) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
