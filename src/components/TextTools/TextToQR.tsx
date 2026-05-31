"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { QrCode } from "lucide-react";
import { TextToQRModal } from "./TextToQrModal";

const TextToQR = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
          <QrCode className="h-5 w-5 text-(--color-text)" />
        </div>
        <h3 className="text-sm font-medium text-(--color-text) leading-tight">
          Text to QR
        </h3>
      </button>

      <AnimatePresence>
        {open && <TextToQRModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default TextToQR;
