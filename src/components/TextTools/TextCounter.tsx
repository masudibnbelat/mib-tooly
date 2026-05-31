import { useEffect, useState } from "react";

interface CountStats {
  characters: number;
  words: number;
  lines: number;
  sentences: number;
}

const getStats = (text: string): CountStats => ({
  characters: text.length,
  words: text.trim() === "" ? 0 : text.trim().split(/\s+/).length,
  lines: text === "" ? 0 : text.split("\n").length,
  sentences:
    text.trim() === "" ? 0 : (text.match(/[^.!?]*[.!?]+/g) || []).length,
});

const STAT_LABELS: { key: keyof CountStats; label: string }[] = [
  { key: "characters", label: "অক্ষর" },
  { key: "words", label: "শব্দ" },
  { key: "lines", label: "লাইন" },
  { key: "sentences", label: "বাক্য" },
];

const TextCounterModal = ({ onClose }: { onClose: () => void }) => {
  const [text, setText] = useState("");
  const stats = getStats(text);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-(--color-bg)">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-active-border)">
        <h2 className="text-base font-semibold text-(--color-text)">
          Text Counter
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white text-sm font-medium"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 px-5 py-4">
        {STAT_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="bg-(--color-active-bg) rounded-lg p-3 text-center"
          >
            <p className="text-[11px] text-(--color-gray) uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-2xl font-semibold text-(--color-text)">
              {stats[key]}
            </p>
          </div>
        ))}
      </div>

      {/* Textarea — flex-1 so it fills remaining height */}
      <div className="flex-1 px-5 pb-3 flex flex-col">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="এখানে লিখুন..."
          className="flex-1 w-full resize-none text-sm font-mono leading-relaxed p-3 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) placeholder:text-(--color-gray) focus:outline-none focus:border-(--color-active-text)"
        />
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex justify-end">
        <button
          onClick={() => setText("")}
          className="text-sm text-(--color-gray) hover:text-(--color-text) border border-(--color-active-border) hover:bg-(--color-active-bg) px-3 py-1.5 rounded-md transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const TextCounter = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left" />
      {open && <TextCounterModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default TextCounter;
export { TextCounterModal };
