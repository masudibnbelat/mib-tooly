"use client";

import { type ReactNode, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Calculator as CalculatorIcon, type LucideIcon } from "lucide-react";
import CalculatorModal from "./Calculator";

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  modal: (onClose: () => void) => ReactNode;
}

const TOOLS: Tool[] = [
  {
    id: "calculator",
    label: "Calculator",
    description: "Simple calculator for basic arithmetic operations",
    icon: CalculatorIcon,
    modal: (onClose) => <CalculatorModal onClose={onClose} />,
  },
];

const CalculatorTools = () => {
  const [active, setActive] = useState<string | null>(null);
  const activeTool = TOOLS.find((tool) => tool.id === active);

  return (
    <main className="w-full">
      <div>
        <p className="my-5 text-2xl font-medium uppercase tracking-widest text-(--color-gray)">
          General Tools
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {TOOLS.map(({ id, label, description, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActive(id)}
              className="
                group touch-manipulation cursor-pointer rounded-xl
                border border-(--color-active-border)
                bg-(--color-bg)
                p-4 text-left
                transition-all duration-200
                hover:bg-(--color-active-bg)
                active:scale-[0.98]
              "
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-active-bg) transition-colors duration-200 group-hover:bg-(--color-bg)">
                <Icon className="h-5 w-5 text-(--color-text)" />
              </div>

              <h3 className="text-sm leading-tight font-medium text-(--color-text)">
                {label}
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-(--color-gray)">
                {description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {active && activeTool ? activeTool.modal(() => setActive(null)) : null}
      </AnimatePresence>
    </main>
  );
};

export default CalculatorTools;
