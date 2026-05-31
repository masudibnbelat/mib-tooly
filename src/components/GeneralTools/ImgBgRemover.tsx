// src/components/GeneralTools/ImgBgRemover.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  X,
  Upload,
  Download,
  Loader2,
  ImagePlus,
  RotateCcw,
  Check,
  Pipette,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface ImgBgRemoverProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#1e293b",
  "#f1f5f9",
  "#fef3c7",
  "#d1fae5",
  "#dbeafe",
  "#fce7f3",
  "#e2e8f0",
];

const LIGHT_COLORS = new Set([
  "#ffffff",
  "#f1f5f9",
  "#fef3c7",
  "#d1fae5",
  "#dbeafe",
  "#fce7f3",
  "#e2e8f0",
]);

type ExportFormat = "png" | "jpeg" | "webp";

const PHASE = {
  LOAD: { start: 0, end: 12 },
  FETCH: { start: 12, end: 50 },
  COMPUTE: { start: 50, end: 95 },
  FINALIZE: { start: 95, end: 100 },
} as const;

const ImgBgRemover = ({ onClose }: ImgBgRemoverProps) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const setProgressSafe = useCallback((value: number, text?: string) => {
    const clamped = Math.min(Math.max(Math.round(value), 0), 100);
    if (clamped >= lastProgressRef.current) {
      lastProgressRef.current = clamped;
      setProgress(clamped);
    }
    if (text) setProgressText(text);
  }, []);

  const mapToPhase = useCallback(
    (fraction: number, phase: (typeof PHASE)[keyof typeof PHASE]): number => {
      const f = Math.min(Math.max(fraction, 0), 1);
      return phase.start + f * (phase.end - phase.start);
    },
    [],
  );

  const getPhaseFromKey = useCallback(
    (key: string): (typeof PHASE)[keyof typeof PHASE] | null => {
      const k = key.toLowerCase();
      if (k.includes("fetch") || k.includes("download") || k.includes("cache"))
        return PHASE.FETCH;
      if (
        k.includes("compute") ||
        k.includes("inference") ||
        k.includes("predict") ||
        k.includes("process")
      )
        return PHASE.COMPUTE;
      return null;
    },
    [],
  );

  // ─── File processing ────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Image size must be less than 20MB");
        return;
      }

      setError(null);
      setProcessedImage(null);
      setFinalImage(null);
      setBgColor("transparent");
      setShowOriginal(false);
      lastProgressRef.current = 0;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        const img = new window.Image();
        img.onload = () =>
          setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = result;
      };
      reader.readAsDataURL(file);

      setProcessing(true);
      setProgressSafe(0, "Initializing...");

      try {
        setProgressSafe(mapToPhase(0.3, PHASE.LOAD), "Loading AI engine...");

        const { removeBackground } = await import("@imgly/background-removal");

        setProgressSafe(PHASE.LOAD.end, "AI engine ready");

        const blob = await removeBackground(file, {
          model: "isnet",
          output: { format: "image/png", quality: 1 },
          progress: (key: string, current: number, total: number) => {
            const phase = getPhaseFromKey(key);
            if (!phase || total <= 0) return;

            const fraction = Math.min(current / total, 1);
            const overall = mapToPhase(fraction, phase);
            const pct = Math.round(fraction * 100);

            if (phase === PHASE.FETCH) {
              setProgressSafe(
                overall,
                fraction < 1
                  ? `Downloading AI model... ${pct}%`
                  : "Model ready!",
              );
            } else if (phase === PHASE.COMPUTE) {
              setProgressSafe(
                overall,
                fraction < 1
                  ? `Removing background... ${pct}%`
                  : "Almost done...",
              );
            }
          },
        });

        setProgressSafe(PHASE.FINALIZE.start, "Refining edges...");

        const blobUrl = URL.createObjectURL(blob);

        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d", {
              willReadFrequently: true,
            });

            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(img, 0, 0);

              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha < 20) data[i + 3] = 0;
                else if (alpha > 230) data[i + 3] = 255;
              }
              ctx.putImageData(imageData, 0, 0);

              const refinedUrl = canvas.toDataURL("image/png", 1.0);
              setProcessedImage(refinedUrl);
              setFinalImage(refinedUrl);
            } else {
              setProcessedImage(blobUrl);
              setFinalImage(blobUrl);
            }
            resolve();
          };
          img.onerror = () => {
            setProcessedImage(blobUrl);
            setFinalImage(blobUrl);
            resolve();
          };
          img.src = blobUrl;
        });

        setProgressSafe(100, "Done!");
      } catch (err) {
        console.error("Background removal error:", err);
        setError(
          "Failed to remove background. Try a clearer image with a distinct subject.",
        );
      } finally {
        setProcessing(false);
      }
    },
    [getPhaseFromKey, mapToPhase, setProgressSafe],
  );

  // ─── Drag & drop ────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // ─── Composite bg color ─────────────────────────────────────────
  useEffect(() => {
    if (!processedImage) return;

    if (bgColor === "transparent") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFinalImage(processedImage);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const mime =
        exportFormat === "jpeg"
          ? "image/jpeg"
          : exportFormat === "webp"
            ? "image/webp"
            : "image/png";
      setFinalImage(canvas.toDataURL(mime, 0.95));
    };
    img.src = processedImage;
  }, [bgColor, processedImage, exportFormat]);

  // ─── Download ────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!finalImage) return;
    const format =
      bgColor === "transparent" && exportFormat !== "png"
        ? "png"
        : exportFormat;
    const a = document.createElement("a");
    a.href = finalImage;
    a.download = `bg-removed.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [finalImage, bgColor, exportFormat]);

  // ─── Reset ───────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setFinalImage(null);
    setBgColor("transparent");
    setError(null);
    setProgress(0);
    setProgressText("");
    setShowOriginal(false);
    lastProgressRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (newImageInputRef.current) newImageInputRef.current.value = "";
  }, []);

  const selectBgColor = (color: string) => setBgColor(color);

  const getProgressLabel = () => {
    if (progress <= PHASE.LOAD.end) return "Loading the AI engine...";
    if (progress <= PHASE.FETCH.end)
      return "First run downloads model (~30 MB)";
    return "Analyzing your image...";
  };

  // ─── Background class for color swatches ────────────────────────
  const getBgClass = (color: string) => {
    const map: Record<string, string> = {
      "#ffffff": "bg-white",
      "#000000": "bg-black",
      "#ef4444": "bg-red-500",
      "#f97316": "bg-orange-500",
      "#eab308": "bg-yellow-500",
      "#22c55e": "bg-green-500",
      "#06b6d4": "bg-cyan-500",
      "#3b82f6": "bg-blue-500",
      "#8b5cf6": "bg-violet-500",
      "#ec4899": "bg-pink-500",
      "#6b7280": "bg-gray-500",
      "#1e293b": "bg-slate-800",
      "#f1f5f9": "bg-slate-100",
      "#fef3c7": "bg-amber-100",
      "#d1fae5": "bg-emerald-100",
      "#dbeafe": "bg-blue-100",
      "#fce7f3": "bg-pink-100",
      "#e2e8f0": "bg-slate-200",
    };
    return map[color] || "";
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative flex h-full w-full flex-col overflow-hidden bg-(--color-bg)"
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-(--color-active-border) px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-active-bg)">
              <ImagePlus className="h-4 w-4 text-(--color-text)" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-(--color-text) sm:text-base">
                Background Remover
              </h2>
              {imageSize.width > 0 && !processing && (
                <p className="text-[10px] text-(--color-gray)">
                  {imageSize.width} × {imageSize.height} px
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-(--color-gray) transition-colors hover:bg-(--color-active-bg) hover:text-(--color-text)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {/* ── Upload area ── */}
              {!originalImage && !processing && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15 }}
                  className="flex min-h-[60vh] items-center justify-center"
                >
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-200 sm:p-20 ${
                      dragOver
                        ? "scale-[1.01] border-(--color-text) bg-(--color-active-bg)"
                        : "border-(--color-active-border) hover:border-(--color-gray) hover:bg-(--color-active-bg)"
                    }`}
                  >
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-(--color-active-bg)">
                      <Upload className="h-9 w-9 text-(--color-gray)" />
                    </div>
                    <p className="mb-2 text-center text-base font-semibold text-(--color-text)">
                      Drop image here or click to upload
                    </p>
                    <p className="text-center text-sm text-(--color-gray)">
                      PNG · JPG · WebP — max 20 MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileSelect(file);
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── Error ── */}
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <p className="text-xs font-medium text-red-400">{error}</p>
                    <button
                      onClick={handleReset}
                      className="mt-1 text-[10px] text-red-400/70 underline hover:text-red-400"
                    >
                      Try again
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Processing ── */}
              {processing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[60vh] flex-col items-center justify-center"
                >
                  {originalImage && (
                    <div className="relative mb-8 h-40 w-40 overflow-hidden rounded-2xl border border-(--color-active-border) opacity-30 sm:h-48 sm:w-48">
                      <Image
                        src={originalImage}
                        alt="Processing"
                        fill
                        className="object-cover blur-[3px]"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Loader icon + percentage */}
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                    <Loader2 className="absolute inset-0 h-20 w-20 animate-spin text-(--color-active-border)" />
                    <span className="relative z-10 text-lg font-bold tabular-nums text-(--color-text)">
                      {progress}
                      <span className="text-xs font-medium">%</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3 h-1.5 w-64 max-w-[80vw] overflow-hidden rounded-full bg-(--color-active-border)">
                    <motion.div
                      className="h-full rounded-full bg-(--color-text)"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>

                  <p className="mb-1.5 text-sm font-semibold text-(--color-text)">
                    {progressText}
                  </p>
                  <p className="text-[11px] text-(--color-gray)">
                    {getProgressLabel()}
                  </p>
                </motion.div>
              )}

              {/* ── Result preview ── */}
              {finalImage && !processing && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Image preview */}
                  <div className="group relative overflow-hidden rounded-xl border border-(--color-active-border)">
                    {/* Background layer */}
                    <div
                      className={`absolute inset-0 ${
                        bgColor === "transparent"
                          ? "bg-size-[20px_20px] bg-position-[0_0,0_10px,10px_-10px,-10px_0] bg-gray-50"
                          : getBgClass(bgColor) || "bg-gray-50"
                      }`}
                    >
                      {bgColor === "transparent" && (
                        <div className="absolute inset-0 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-size-[20px_20px] opacity-100" />
                      )}
                    </div>

                    {/* Image */}
                    <div className="relative z-10 flex min-h-50 max-h-[55vh] items-center justify-center sm:max-h-125">
                      <Image
                        src={showOriginal ? (originalImage ?? "") : finalImage}
                        alt={showOriginal ? "Original" : "Background removed"}
                        width={imageSize.width || 800}
                        height={imageSize.height || 600}
                        className="max-h-[55vh] w-auto max-w-full object-contain sm:max-h-125"
                        unoptimized
                      />
                    </div>

                    {/* Badge */}
                    <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      <Sparkles className="h-2.5 w-2.5" />
                      {showOriginal ? "Original" : "Processed"}
                    </div>

                    {/* Compare button */}
                    <button
                      onMouseDown={() => setShowOriginal(true)}
                      onMouseUp={() => setShowOriginal(false)}
                      onMouseLeave={() => setShowOriginal(false)}
                      onTouchStart={() => setShowOriginal(true)}
                      onTouchEnd={() => setShowOriginal(false)}
                      className="absolute bottom-2.5 left-2.5 z-20 flex select-none items-center gap-1.5 rounded-lg bg-black/60 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80 active:scale-95"
                    >
                      {showOriginal ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {showOriginal ? "Showing original" : "Hold to compare"}
                    </button>
                  </div>

                  {/* ── Color picker ── */}
                  <div className="space-y-3 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-(--color-gray)" />
                        <p className="text-xs font-semibold text-(--color-text) sm:text-sm">
                          Background Color
                        </p>
                      </div>
                      <button
                        onClick={() => setShowColorPicker((p) => !p)}
                        className="flex items-center gap-1 text-[11px] text-(--color-gray) transition-colors hover:text-(--color-text)"
                      >
                        {showColorPicker ? "Less" : "More colors"}
                        {showColorPicker ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Transparent */}
                      <button
                        onClick={() => selectBgColor("transparent")}
                        title="Transparent"
                        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-2 bg-[repeating-conic-gradient(#ccc_0%_25%,white_0%_50%)] bg-size-[8px_8px] transition-all duration-150 sm:h-10 sm:w-10 ${
                          bgColor === "transparent"
                            ? "scale-110 border-(--color-text) shadow-md"
                            : "border-(--color-active-border) hover:border-(--color-gray)"
                        }`}
                      >
                        {bgColor === "transparent" && (
                          <Check className="h-3.5 w-3.5 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                        )}
                      </button>

                      {/* Presets */}
                      {(showColorPicker
                        ? PRESET_COLORS
                        : PRESET_COLORS.slice(0, 10)
                      ).map((color) => (
                        <button
                          key={color}
                          onClick={() => selectBgColor(color)}
                          title={color}
                          className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all duration-150 sm:h-10 sm:w-10 ${getBgClass(color)} ${
                            bgColor === color
                              ? "scale-110 border-(--color-text) shadow-md"
                              : "border-(--color-active-border) hover:border-(--color-gray)"
                          }`}
                        >
                          {bgColor === color && (
                            <Check
                              className={`h-3.5 w-3.5 ${
                                LIGHT_COLORS.has(color)
                                  ? "text-gray-800"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      ))}

                      {/* Custom */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            document
                              .getElementById("imgbg-custom-color")
                              ?.click()
                          }
                          title="Custom color"
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all duration-150 sm:h-10 sm:w-10 ${
                            bgColor === customColor &&
                            !PRESET_COLORS.includes(bgColor) &&
                            bgColor !== "transparent"
                              ? "scale-110 border-(--color-text) shadow-md"
                              : "border-(--color-active-border) hover:border-(--color-gray)"
                          } bg-(--custom-swatch-color)`}
                        >
                          <Pipette className="h-3.5 w-3.5 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                        </button>
                        <input
                          id="imgbg-custom-color"
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            selectBgColor(e.target.value);
                          }}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-(--color-gray)">
                      Selected:{" "}
                      <span className="font-medium text-(--color-text)">
                        {bgColor === "transparent"
                          ? "Transparent (PNG)"
                          : bgColor.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  {/* ── Export format ── */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowExportOptions((p) => !p)}
                      className="flex items-center gap-1.5 rounded-lg border border-(--color-active-border) bg-(--color-bg) px-3 py-2 text-xs font-medium text-(--color-text) transition-colors hover:bg-(--color-active-bg)"
                    >
                      Format:{" "}
                      <span className="font-bold">
                        {exportFormat.toUpperCase()}
                      </span>
                      {showExportOptions ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showExportOptions && (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.12 }}
                          className="flex gap-1"
                        >
                          {(["png", "jpeg", "webp"] as ExportFormat[]).map(
                            (fmt) => (
                              <button
                                key={fmt}
                                onClick={() => {
                                  setExportFormat(fmt);
                                  setShowExportOptions(false);
                                }}
                                className={`rounded-md px-3 py-2 text-[11px] font-semibold transition-colors ${
                                  exportFormat === fmt
                                    ? "bg-(--color-text) text-(--color-bg)"
                                    : "bg-(--color-active-bg) text-(--color-gray) hover:text-(--color-text)"
                                }`}
                              >
                                {fmt.toUpperCase()}
                              </button>
                            ),
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {bgColor === "transparent" && exportFormat !== "png" && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] text-amber-500"
                      >
                        ⚠ Only PNG supports transparency
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Footer ── */}
        <AnimatePresence>
          {(originalImage ?? processedImage) && !processing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="flex shrink-0 items-center justify-between border-t border-(--color-active-border) px-4 py-3 sm:px-6"
            >
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  title="Clear"
                  className="flex items-center gap-1.5 rounded-lg bg-(--color-active-bg) px-3 py-2 text-xs font-medium text-(--color-text) transition-colors hover:bg-(--color-active-border)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  onClick={() => newImageInputRef.current?.click()}
                  title="New image"
                  className="flex items-center gap-1.5 rounded-lg bg-(--color-active-bg) px-3 py-2 text-xs font-medium text-(--color-text) transition-colors hover:bg-(--color-active-border)"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New image</span>
                </button>
                <input
                  ref={newImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleReset();
                      setTimeout(() => void handleFileSelect(file), 50);
                    }
                  }}
                />
              </div>

              {finalImage && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-lg bg-(--color-text) px-5 py-2.5 text-xs font-semibold text-(--color-bg) transition-opacity hover:opacity-80 active:scale-[0.97]"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </motion.div>
  );
};

export default ImgBgRemover;
