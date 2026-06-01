"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Repeat1,
  Hash,
  Search,
  Eraser,
  type LucideIcon,
  RemoveFormatting,
  ListX,
  FileX2,
  QrCode,
  Dices,
  Lock,
} from "lucide-react";
import { TextCounterModal } from "./TextCounter";
import { TextRepeaterModal } from "./TextRepeater";
import FindAndReplace from "./FindAndReplace";
import { RemoveWhiteSpacesModal } from "./RemoveWhiteSpaces";
import { RemoveEmptyLinesModal } from "./RemoveEmptyLines";
import { RemoveDuplicateLinesModal } from "./RemoveDuplicateLines";
import { RemoveDuplicateWordsModal } from "./RemoveDuplicateWords";
import { TextToQRModal } from "./TextToQrModal";
import { NumberGeneratorModal } from "./NumberGenerator";
import Encryptor from "./Encryptor";

interface Tool {
  id: string;
  label: string;
  icon: LucideIcon;
  modal: (onClose: () => void) => React.ReactNode;
}

const TOOLS: Tool[] = [
  {
    id: "text-to-qr",
    label: "Text to QR",
    icon: QrCode,
    modal: (onClose) => <TextToQRModal onClose={onClose} />,
  },
  {
    id: "counter",
    label: "Text Counter",
    icon: Hash,
    modal: (onClose) => <TextCounterModal onClose={onClose} />,
  },
  {
    id: "repeater",
    label: "Text Repeater",
    icon: Repeat1,
    modal: (onClose) => <TextRepeaterModal onClose={onClose} />,
  },
  {
    id: "find-replace",
    label: "Find & Replace",
    icon: Search,
    modal: (onClose) => <FindAndReplace onClose={onClose} />,
  },
  {
    id: "remove-whitespaces",
    label: "Remove White Spaces",
    icon: Eraser,
    modal: (onClose) => <RemoveWhiteSpacesModal onClose={onClose} />,
  },
  {
    id: "remove-empty-lines",
    label: "Remove Empty Lines",
    icon: RemoveFormatting,
    modal: (onClose) => <RemoveEmptyLinesModal onClose={onClose} />,
  },
  {
    id: "remove-duplicate-lines",
    label: "Remove Duplicate Lines",
    icon: ListX,
    modal: (onClose) => <RemoveDuplicateLinesModal onClose={onClose} />,
  },
  {
    id: "remove-duplicate-words",
    label: "Remove Duplicate Words",
    icon: FileX2,
    modal: (onClose) => <RemoveDuplicateWordsModal onClose={onClose} />,
  },
  {
    id: "number-generator",
    label: "Number Generator",
    icon: Dices,
    modal: (onClose) => <NumberGeneratorModal onClose={onClose} />,
  },
  {
    id: "encryptor",
    label: "Encryptor",
    icon: Lock,
    modal: (onClose) => <Encryptor onClose={onClose} />,
  },
];

const TextTools = () => {
  const [active, setActive] = useState<string | null>(null);
  const activeTool = TOOLS.find((t) => t.id === active);

  return (
    <main>
      <div>
        <p className="my-5 text-2xl font-medium uppercase tracking-widest text-(--color-gray)">
          Text Tools
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActive(id)}
              className="
                group touch-manipulation cursor-pointer rounded-xl
                border border-(--color-active-border)
                bg-(--color-bg)
                p-4 text-left
                transition-all duration-150
                hover:bg-(--color-active-bg) hover:border-(--color-text)/20
                active:scale-[0.98]
              "
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-active-bg) group-hover:bg-(--color-bg)">
                <Icon className="h-5 w-5 text-(--color-text)" />
              </div>
              <h3 className="text-sm font-medium text-(--color-text) leading-tight">
                {label}
              </h3>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && activeTool ? activeTool.modal(() => setActive(null)) : null}
      </AnimatePresence>
    </main>
  );
};

export default TextTools;
