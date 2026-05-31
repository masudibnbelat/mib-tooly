"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Clock,
  ImageUp,
  Navigation,
  QrCode,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CountDownModal } from "./CountDown";
import { StopWatchModal } from "./StopWatch";
import MorseCodeModal from "./MorseCode";
import { CompassModal, preRequestCompassPermission } from "./Compass";
import QRCodeScanner from "./QRCodeScanner";
import ImageResizer from "./ImageResizer";

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  modal: (onClose: () => void) => React.ReactNode;
}

const TOOLS: Tool[] = [
  {
    id: "countdown",
    label: "Countdown",
    description: "Timer বা date পর্যন্ত count down করুন",
    icon: Timer,
    modal: (onClose) => <CountDownModal onClose={onClose} />,
  },
  {
    id: "stopwatch",
    label: "Stopwatch",
    description: "Lap tracking সহ precise stopwatch",
    icon: Clock,
    modal: (onClose) => <StopWatchModal onClose={onClose} />,
  },
  {
    id: "morse",
    label: "Morse Code",
    description: "Text থেকে Morse, audio playback সহ",
    icon: Zap,
    modal: (onClose) => <MorseCodeModal onClose={onClose} />,
  },
  {
    id: "compass",
    label: "Compass",
    description: "Device sensor দিয়ে live compass",
    icon: Navigation,
    modal: (onClose) => <CompassModal onClose={onClose} />,
  },
  {
    id: "qrscanner",
    label: "QR Scanner",
    description: "QR code scan ও generate করুন",
    icon: QrCode,
    modal: (onClose) => <QRCodeScanner onClose={onClose} />,
  },
  {
    id: "imageresizer",
    label: "Image Resizer",
    description: "Image resize ও export করুন",
    icon: ImageUp,
    modal: (onClose) => <ImageResizer onClose={onClose} />,
  },
];

const GeneralTools = () => {
  const [active, setActive] = useState<string | null>(null);
  const activeTool = TOOLS.find((t) => t.id === active);

  const handleToolClick = async (id: string) => {
    if (id === "compass") {
      await preRequestCompassPermission();
    }
    setActive(id);
  };

  return (
    <main>
      <div>
        <p className="my-5 text-2xl font-medium uppercase tracking-widest text-(--color-gray)">
          General Tools
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {TOOLS.map(({ id, label, description, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => void handleToolClick(id)}
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

      <AnimatePresence>
        {active && activeTool ? activeTool.modal(() => setActive(null)) : null}
      </AnimatePresence>
    </main>
  );
};

export default GeneralTools;
