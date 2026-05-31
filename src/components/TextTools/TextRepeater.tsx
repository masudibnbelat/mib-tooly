import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SelectOption, { SelectOptionItem } from "../ui/SelectOption";

const SEPARATOR_OPTIONS: SelectOptionItem[] = [
  { label: "New Line", value: "\n" },
  { label: "Space", value: " " },
  { label: "Comma", value: ", " },
  { label: "Custom", value: "custom" },
];

const TextRepeaterModal = ({ onClose }: { onClose: () => void }) => {
  const [text, setText] = useState("");
  const [count, setCount] = useState(3);
  const [separator, setSeparator] = useState("\n");
  const [customSep, setCustomSep] = useState("");
  const isCustom = separator === "custom";

  const activeSep = isCustom ? customSep : separator;

  const output =
    text.trim() === "" || count <= 0
      ? ""
      : Array(count).fill(text).join(activeSep);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success("Copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-(--color-bg)">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-active-border)">
        <h2 className="text-base font-semibold text-(--color-text)">
          Text Repeater
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white text-sm font-medium"
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div className="px-5 py-4 flex flex-col gap-4 border-b border-(--color-active-border)">
        {/* Text input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--color-gray) uppercase tracking-wide">
            Text
          </label>
          <input
            autoFocus
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type text to repeat..."
            className="w-full px-3 py-2 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) placeholder:text-(--color-gray) text-sm focus:outline-none focus:border-(--color-active-text)"
          />
        </div>

        {/* Count + Separator row */}
        <div className="flex gap-3 flex-wrap items-end">
          {/* Count */}
          <div className="flex flex-col gap-1.5 w-28">
            <label className="text-xs text-(--color-gray) uppercase tracking-wide">
              Repeat
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(999, Number(e.target.value))))
              }
              className="w-full px-3 py-2 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) text-sm focus:outline-none focus:border-(--color-active-text)"
            />
          </div>

          {/* Separator select */}
          <SelectOption
            label="Separator"
            options={SEPARATOR_OPTIONS}
            value={separator}
            onChange={setSeparator}
            className="flex-1 min-w-40"
          />

          {/* Custom separator input */}
          {isCustom && (
            <div className="flex flex-col gap-1.5 w-36">
              <label className="text-xs text-(--color-gray) uppercase tracking-wide">
                Custom
              </label>
              <input
                type="text"
                value={customSep}
                onChange={(e) => setCustomSep(e.target.value)}
                placeholder="e.g. | or —"
                className="w-full px-3 py-2 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) placeholder:text-(--color-gray) text-sm focus:outline-none focus:border-(--color-active-text)"
              />
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 px-5 pt-4 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-(--color-gray) uppercase tracking-wide">
            Output{" "}
            {output && (
              <span className="ml-1 text-(--color-active-text)">
                ({count}x)
              </span>
            )}
          </label>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="text-xs px-3 py-1 rounded-md border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) hover:bg-(--color-active-border) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Copy
          </button>
        </div>
        <textarea
          readOnly
          value={output}
          placeholder="Output will appear here..."
          className="flex-1 w-full resize-none text-sm font-mono leading-relaxed p-3 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) placeholder:text-(--color-gray) focus:outline-none"
        />
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex justify-end">
        <button
          onClick={() => {
            setText("");
            setCount(3);
            setSeparator("\n");
            setCustomSep("");
          }}
          className="text-sm text-(--color-gray) hover:text-(--color-text) border border-(--color-active-border) hover:bg-(--color-active-bg) px-3 py-1.5 rounded-md transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

const TextRepeater = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left" />
      {open && <TextRepeaterModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default TextRepeater;
export { TextRepeaterModal };
