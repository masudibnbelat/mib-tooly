import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface SelectOptionItem {
  label: string;
  value: string;
}

interface SelectOptionProps {
  options: SelectOptionItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const SelectOption = ({
  options,
  value,
  onChange,
  placeholder = "বেছে নিন...",
  label,
  className = "",
}: SelectOptionProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs text-(--color-gray) uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) text-sm focus:outline-none focus:border-(--color-active-text) transition-colors"
      >
        <span
          className={selected ? "text-(--color-text)" : "text-(--color-gray)"}
        >
          {selected ? selected.label : placeholder}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 text-(--color-gray)"
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 w-full min-w-40 rounded-lg border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-lg"
            style={{ top: "100%" }}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.03,
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors
                    ${
                      isSelected
                        ? "bg-(--color-active-bg) text-(--color-text)"
                        : "text-(--color-text) hover:bg-(--color-active-bg)"
                    }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="text-(--color-active-text)"
                    >
                      <Check size={14} />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectOption;
