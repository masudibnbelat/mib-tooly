"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  Download,
  Scissors,
  RotateCcw,
  Check,
  ChevronDown,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoSize {
  label: string;
  widthMM: number;
  heightMM: number;
  dpi?: number;
}

interface CategoryConfig {
  category: string;
  icon: string;
  sizes: PhotoSize[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BG_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Sky Blue", value: "#a8d4f0" },
  { label: "Blue", value: "#4a90d9" },
];

const CATEGORIES: CategoryConfig[] = [
  {
    category: "Passport",
    icon: "🛂",
    sizes: [
      // Bangladesh official: 35×45mm (BRTA/Passport Office standard)
      { label: "BD Passport (35×45mm)", widthMM: 35, heightMM: 45, dpi: 300 },
      { label: "USA Passport (51×51mm)", widthMM: 51, heightMM: 51, dpi: 300 },
      { label: "UK / EU (35×45mm)", widthMM: 35, heightMM: 45, dpi: 300 },
      { label: "Canada (50×70mm)", widthMM: 50, heightMM: 70, dpi: 300 },
      { label: "India (35×35mm)", widthMM: 35, heightMM: 35, dpi: 300 },
      { label: "Saudi / UAE (40×60mm)", widthMM: 40, heightMM: 60, dpi: 300 },
      { label: "China (33×48mm)", widthMM: 33, heightMM: 48, dpi: 300 },
    ],
  },
  {
    category: "Stamp",
    icon: "📮",
    sizes: [
      { label: "Standard (25×35mm)", widthMM: 25, heightMM: 35, dpi: 300 },
      { label: "Small (20×25mm)", widthMM: 20, heightMM: 25, dpi: 300 },
      { label: "Large (40×40mm)", widthMM: 40, heightMM: 40, dpi: 300 },
      { label: "Square (30×30mm)", widthMM: 30, heightMM: 30, dpi: 300 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MM_TO_PX = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);

// Scale mm to preview px: longest side = maxPx
function mmToPreview(
  wMM: number,
  hMM: number,
  maxPx = 260,
): { w: number; h: number } {
  const longest = Math.max(wMM, hMM);
  const scale = maxPx / longest;
  return {
    w: Math.round(wMM * scale),
    h: Math.round(hMM * scale),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PassportPhotoMakerModalProps {
  onClose: () => void;
}

export const PassportPhotoMakerModal = ({
  onClose,
}: PassportPhotoMakerModalProps) => {
  // Image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0].value);

  // Category/size selection
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [catOpen, setCatOpen] = useState(false);

  // Crop/position state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const activeCat = CATEGORIES[selectedCatIdx];
  const activeSize = activeCat.sizes[selectedSizeIdx];

  const preview = mmToPreview(activeSize.widthMM, activeSize.heightMM, 260);

  // Reset size index when category changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSizeIdx(0);
  }, [selectedCatIdx]);

  // Reset position when image or size changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [originalImage, selectedCatIdx, selectedSizeIdx]);

  // ── Upload ──
  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImage(ev.target?.result as string);
      setProcessedImage(null);
      setBgRemoved(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  // ── BG Remove ──
  const handleBgRemove = useCallback(async () => {
    if (!originalImage) return;
    setBgRemoving(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await fetch(originalImage).then((r) => r.blob());
      const result = await removeBackground(blob);
      const url = URL.createObjectURL(result);
      setProcessedImage(url);
      setBgRemoved(true);
    } catch {
      setProcessedImage(originalImage);
    } finally {
      setBgRemoving(false);
    }
  }, [originalImage]);

  // ── Drag to reposition ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    },
    [offset],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setOffset({
        x: dragStart.current.ox + (e.clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.clientY - dragStart.current.y),
      });
    },
    [dragging],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      setDragging(true);
      dragStart.current = {
        x: t.clientX,
        y: t.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    },
    [offset],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      setOffset({
        x: dragStart.current.ox + (t.clientX - dragStart.current.x),
        y: dragStart.current.oy + (t.clientY - dragStart.current.y),
      });
    },
    [dragging],
  );

  // ── Download ──
  const handleDownload = useCallback(() => {
    const imgSrc = processedImage ?? originalImage;
    if (!imgSrc) return;

    const dpi = activeSize.dpi ?? 300;
    const outW = MM_TO_PX(activeSize.widthMM, dpi);
    const outH = MM_TO_PX(activeSize.heightMM, dpi);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;

    if (bgRemoved) {
      ctx.fillStyle = selectedBgColor;
      ctx.fillRect(0, 0, outW, outH);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const aspectImg = img.width / img.height;
      const aspectOut = outW / outH;

      let drawW: number, drawH: number;
      if (aspectImg > aspectOut) {
        drawH = outH * zoom;
        drawW = drawH * aspectImg;
      } else {
        drawW = outW * zoom;
        drawH = drawW / aspectImg;
      }

      const scaleX = outW / preview.w;
      const scaleY = outH / preview.h;
      const ox = (outW - drawW) / 2 + offset.x * scaleX;
      const oy = (outH - drawH) / 2 + offset.y * scaleY;

      ctx.drawImage(img, ox, oy, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `photo_${activeSize.widthMM}x${activeSize.heightMM}mm.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.95,
      );
    };
    img.src = imgSrc;
  }, [
    originalImage,
    processedImage,
    activeSize,
    bgRemoved,
    selectedBgColor,
    zoom,
    offset,
    preview,
  ]);

  const imgSrc = processedImage ?? originalImage;

  return (
    <motion.div
      className="fixed inset-0 z-200000000 flex flex-col bg-(--color-bg)"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-(--color-active-border) px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📷</span>
          <span className="font-semibold text-(--color-text) tracking-tight text-sm sm:text-base">
            Passport Photo Maker
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-(--color-text) transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* ── Left: Upload + Preview ── */}
        <div className="flex flex-col items-center gap-4 p-4 lg:flex-1 lg:overflow-y-auto">
          {/* Upload area */}
          {!imgSrc ? (
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-(--color-active-border) bg-(--color-active-bg) p-8 cursor-pointer hover:border-(--color-gray) transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-bg) border border-(--color-active-border)">
                <Upload className="h-6 w-6 text-(--color-gray)" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-(--color-text)">
                  Click or drag photo here
                </p>
                <p className="mt-1 text-xs text-(--color-gray)">
                  JPG, PNG, WEBP, HEIC — যেকোনো format
                </p>
              </div>
            </label>
          ) : (
            <div className="flex w-full flex-col items-center gap-3">
              {/* Preview Canvas */}
              <p className="text-xs text-(--color-gray)">
                Drag to reposition · Scroll/pinch to zoom
              </p>

              <div
                className="relative overflow-hidden rounded-lg border-2 border-(--color-active-border) select-none touch-none"
                style={{
                  width: preview.w,
                  height: preview.h,
                  background: bgRemoved ? selectedBgColor : "transparent",
                  cursor: dragging ? "grabbing" : "grab",
                  flexShrink: 0,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setDragging(false)}
                onMouseLeave={() => setDragging(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setDragging(false)}
                onWheel={(e) => {
                  e.preventDefault();
                  setZoom((z) =>
                    Math.min(3, Math.max(0.5, z - e.deltaY * 0.001)),
                  );
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt="preview"
                  draggable={false}
                  className="absolute pointer-events-none inset-0 w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                    transformOrigin: "center",
                  }}
                />
              </div>

              <p className="text-xs font-medium text-(--color-gray)">
                {activeSize.label} · {activeSize.widthMM}×{activeSize.heightMM}
                mm
                {activeSize.dpi ? ` @ ${activeSize.dpi}dpi` : ""}
              </p>

              {/* Controls row */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-active-bg) text-(--color-text) hover:bg-(--color-active-border) transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="w-12 text-center text-xs text-(--color-gray)">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-active-bg) text-(--color-text) hover:bg-(--color-active-border) transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-active-bg) text-(--color-text) hover:bg-(--color-active-border) transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => hiddenInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-(--color-active-bg) px-3 py-1.5 text-xs text-(--color-text) hover:bg-(--color-active-border) transition-colors"
                >
                  <Upload size={12} />
                  Change
                </button>
                <input
                  ref={hiddenInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Controls ── */}
        <div className="flex w-full shrink-0 flex-col gap-4 border-t border-(--color-active-border) p-4 lg:w-72 lg:border-t-0 lg:border-l lg:overflow-y-auto">
          {/* Category select */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--color-gray) uppercase tracking-wider">
              Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-3 py-2.5 text-sm text-(--color-text) hover:border-(--color-gray) transition-colors"
              >
                <span>
                  {activeCat.icon} {activeCat.category}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-(--color-gray) transition-transform ${catOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-xl overflow-hidden"
                  >
                    {CATEGORIES.map((c, i) => (
                      <button
                        key={c.category}
                        type="button"
                        onClick={() => {
                          setSelectedCatIdx(i);
                          setCatOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm text-(--color-text) hover:bg-(--color-active-bg) transition-colors ${i === selectedCatIdx ? "bg-(--color-active-bg) font-medium" : ""}`}
                      >
                        <span>{c.icon}</span>
                        <span>{c.category}</span>
                        {i === selectedCatIdx && (
                          <Check
                            size={12}
                            className="ml-auto text-(--color-gray)"
                          />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Size select */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--color-gray) uppercase tracking-wider">
              Size
            </label>
            <div className="flex flex-col gap-1.5">
              {activeCat.sizes.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSelectedSizeIdx(i)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    i === selectedSizeIdx
                      ? "border-(--color-text) bg-(--color-active-bg) text-(--color-text) font-medium"
                      : "border-(--color-active-border) bg-(--color-active-bg) text-(--color-gray) hover:border-(--color-gray)"
                  }`}
                >
                  <span>{s.label}</span>
                  {i === selectedSizeIdx && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* BG Remove */}
          {imgSrc && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--color-gray) uppercase tracking-wider">
                Background
              </label>
              <button
                type="button"
                onClick={handleBgRemove}
                disabled={bgRemoving}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  bgRemoved
                    ? "border-(--color-text) bg-(--color-active-bg) text-(--color-text)"
                    : "border-(--color-active-border) bg-(--color-active-bg) text-(--color-gray) hover:border-(--color-gray) hover:text-(--color-text)"
                }`}
              >
                {bgRemoving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Removing…
                  </>
                ) : bgRemoved ? (
                  <>
                    <Check size={14} />
                    BG Removed
                  </>
                ) : (
                  <>
                    <Scissors size={14} />
                    Remove Background
                  </>
                )}
              </button>

              <AnimatePresence>
                {bgRemoved && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 overflow-hidden"
                  >
                    <p className="mb-2 text-xs text-(--color-gray)">
                      Background color
                    </p>
                    <div className="flex gap-3">
                      {BG_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          onClick={() => setSelectedBgColor(c.value)}
                          className={`flex flex-col items-center gap-1 group`}
                        >
                          <span
                            className={`h-8 w-8 rounded-full border-2 block transition-all ${
                              selectedBgColor === c.value
                                ? "border-(--color-text) scale-110"
                                : "border-(--color-active-border) hover:scale-105"
                            }`}
                            style={{ background: c.value }}
                          />
                          <span className="text-[10px] text-(--color-gray)">
                            {c.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Download */}
          <div className="mt-auto pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!imgSrc}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                imgSrc
                  ? "bg-(--color-text) text-(--color-bg) hover:opacity-90 active:scale-[0.98]"
                  : "bg-(--color-active-bg) text-(--color-gray) cursor-not-allowed"
              }`}
            >
              <Download size={15} />
              Download Photo
            </button>
            {imgSrc && (
              <p className="mt-1.5 text-center text-xs text-(--color-gray)">
                Output: {MM_TO_PX(activeSize.widthMM, activeSize.dpi ?? 300)}×
                {MM_TO_PX(activeSize.heightMM, activeSize.dpi ?? 300)}px
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Grid Card ────────────────────────────────────────────────────────────────

const PassportPhotoMaker = () => {
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
          <span className="text-xl">📷</span>
        </div>
        <h3 className="text-sm leading-tight font-medium text-(--color-text)">
          Passport Photo
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-(--color-gray)">
          Passport & stamp size photo maker
        </p>
      </button>

      <AnimatePresence>
        {open && <PassportPhotoMakerModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default PassportPhotoMaker;
