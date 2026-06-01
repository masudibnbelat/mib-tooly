"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ImageUp,
  Download,
  RefreshCw,
  FileImage,
  CheckCircle2,
  Loader2,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SelectOption, { SelectOptionItem } from "../ui/SelectOption";

/* ─── Constants ─────────────────────────────────────────────────── */

const FORMAT_OPTIONS: SelectOptionItem[] = [
  { label: "JPEG / JPG", value: "jpeg" },
  { label: "PNG", value: "png" },
  { label: "WEBP", value: "webp" },
  { label: "BMP", value: "bmp" },
  { label: "ICO (32×32)", value: "ico" },
  { label: "TIFF", value: "tiff" },
  { label: "AVIF", value: "avif" },
  { label: "GIF", value: "gif" },
];

const QUALITY_OPTIONS: SelectOptionItem[] = [
  { label: "Maximum (100%)", value: "1" },
  { label: "High (90%)", value: "0.9" },
  { label: "Good (80%)", value: "0.8" },
  { label: "Medium (70%)", value: "0.7" },
  { label: "Low (50%)", value: "0.5" },
];

const MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/png",
  tiff: "image/tiff",
  avif: "image/avif",
  gif: "image/gif",
};

const EXT: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  bmp: "bmp",
  ico: "ico",
  tiff: "tiff",
  avif: "avif",
  gif: "gif",
};

/* ─── Types ──────────────────────────────────────────────────────── */

interface FileEntry {
  id: string;
  file: File;
  previewUrl: string;
  status: "idle" | "converting" | "done" | "error";
  outputUrl?: string;
  outputName?: string;
  errorMsg?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

const getDateTag = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

const convertFile = (
  file: File,
  format: string,
  quality: number,
): Promise<{ url: string; name: string }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const w = format === "ico" ? 32 : img.width;
      const h = format === "ico" ? 32 : img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const mime = MIME[format] ?? "image/png";
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Conversion failed"));
          const url = URL.createObjectURL(blob);
          const ext = EXT[format] ?? format;
          resolve({ url, name: `mib-toooly${getDateTag()}.${ext}` });
        },
        mime,
        quality,
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = objectUrl;
  });

/* ─── Modal (inner content) ──────────────────────────────────────── */

interface ModalProps {
  onClose: () => void;
}

const ImageFormatConverterModal = ({ onClose }: ModalProps) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [targetFormat, setTargetFormat] = useState("webp");
  const [quality, setQuality] = useState("0.9");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setFiles((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "idle" as const,
      })),
    ]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) {
        URL.revokeObjectURL(entry.previewUrl);
        if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl);
      }
      return prev.filter((e) => e.id !== id);
    });
  };

  const convertAll = async () => {
    const q = parseFloat(quality);
    setFiles((prev) =>
      prev.map((e) =>
        e.status !== "done" ? { ...e, status: "converting" as const } : e,
      ),
    );
    for (const entry of files.filter((e) => e.status !== "done")) {
      try {
        const { url, name } = await convertFile(entry.file, targetFormat, q);
        setFiles((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: "done" as const,
                  outputUrl: url,
                  outputName: name,
                }
              : e,
          ),
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: "error" as const,
                  errorMsg: err instanceof Error ? err.message : "Error",
                }
              : e,
          ),
        );
      }
    }
  };

  const downloadAll = () => {
    files.forEach((e) => {
      if (e.outputUrl && e.outputName) {
        const a = document.createElement("a");
        a.href = e.outputUrl;
        a.download = e.outputName;
        a.click();
      }
    });
  };

  const resetFiles = () => {
    files.forEach((e) => {
      URL.revokeObjectURL(e.previewUrl);
      if (e.outputUrl) URL.revokeObjectURL(e.outputUrl);
    });
    setFiles([]);
  };

  const doneCount = files.filter((e) => e.status === "done").length;
  const converting = files.some((e) => e.status === "converting");

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    /* Fullscreen backdrop */
    <div
      className="fixed inset-0 z-200000000 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-200000000 flex flex-col bg-(--color-bg) overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-active-border) shrink-0">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="h-4 w-4 text-(--color-gray)" />
            <span className="text-sm font-medium text-(--color-text)">
              Image Format Converter
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 w-full max-w-2xl mx-auto">
          {/* Drop Zone — shown when no files */}
          <AnimatePresence>
            {files.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-3 rounded-xl
                  border-2 border-dashed py-12 cursor-pointer transition-all duration-200
                  ${
                    dragging
                      ? "border-(--color-active-text) bg-(--color-active-bg)"
                      : "border-(--color-active-border) hover:border-(--color-active-text) hover:bg-(--color-active-bg)"
                  }
                `}
              >
                <motion.div
                  animate={dragging ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <ImageUp className="h-9 w-9 text-(--color-gray)" />
                </motion.div>
                <p className="text-sm font-medium text-(--color-text)">
                  Image drag & drop করুন অথবা click করুন
                </p>
                <p className="text-xs text-(--color-gray) text-center px-4">
                  PNG · JPG · WEBP · BMP · GIF · AVIF · TIFF — সব format
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* File list + controls */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {/* Format + Quality */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <SelectOption
                    options={FORMAT_OPTIONS}
                    value={targetFormat}
                    onChange={setTargetFormat}
                    label="Convert to"
                    className="flex-1"
                  />
                  <SelectOption
                    options={QUALITY_OPTIONS}
                    value={quality}
                    onChange={setQuality}
                    label="Quality"
                    className="flex-1"
                  />
                </div>

                {/* File cards */}
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {files.map((entry) => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-3 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-2.5"
                      >
                        {/* Thumbnail */}
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-(--color-active-border)">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={entry.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-(--color-text)">
                            {entry.file.name}
                          </p>
                          <p className="text-xs text-(--color-gray)">
                            {(entry.file.size / 1024).toFixed(1)} KB ·{" "}
                            {entry.file.type.split("/")[1]?.toUpperCase() ??
                              "IMG"}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="shrink-0">
                          {entry.status === "idle" && (
                            <FileImage className="h-4 w-4 text-(--color-gray)" />
                          )}
                          {entry.status === "converting" && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1,
                                ease: "linear",
                              }}
                            >
                              <Loader2 className="h-4 w-4 text-(--color-active-text)" />
                            </motion.div>
                          )}
                          {entry.status === "done" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {entry.status === "error" && (
                            <span
                              className="text-xs text-red-400"
                              title={entry.errorMsg}
                            >
                              ✕
                            </span>
                          )}
                        </div>

                        {/* Download single */}
                        {entry.status === "done" && entry.outputUrl && (
                          <a
                            href={entry.outputUrl}
                            download={entry.outputName}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          >
                            <Download className="h-4 w-4 text-(--color-active-text) hover:opacity-70 transition-opacity" />
                          </a>
                        )}

                        {/* Remove per file — red X */}
                        {entry.status !== "converting" && (
                          <button
                            type="button"
                            onClick={() => removeFile(entry.id)}
                            className="shrink-0 flex items-center justify-center h-5 w-5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add more */}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-(--color-active-border) px-3 py-2 text-xs text-(--color-gray) hover:border-(--color-active-text) hover:text-(--color-text) transition-all"
                >
                  <ImageUp className="h-3.5 w-3.5" />
                  আরো image add করুন
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions — always visible */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2 px-5 py-4 border-t border-(--color-active-border) shrink-0 w-full max-w-2xl mx-auto"
            >
              {/* Convert */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => void convertAll()}
                disabled={converting || files.length === 0}
                className="
                  flex flex-1 items-center justify-center gap-2
                  rounded-xl border border-(--color-active-border)
                  bg-(--color-active-bg) px-4 py-2.5
                  text-sm font-medium text-(--color-text)
                  transition-all hover:border-(--color-active-text)
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {converting ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="inline-block"
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {converting ? "Converting..." : "Convert করুন"}
              </motion.button>

              {/* Download All */}
              <AnimatePresence>
                {doneCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={downloadAll}
                    className="
                      flex flex-1 items-center justify-center gap-2
                      rounded-xl border border-(--color-active-border)
                      bg-(--color-active-bg) px-4 py-2.5
                      text-sm font-medium text-(--color-text)
                      transition-all hover:border-(--color-active-text)
                    "
                  >
                    <Download className="h-4 w-4" />
                    Download All ({doneCount})
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Clear all — red X */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={resetFiles}
                disabled={converting}
                className="
                  flex items-center justify-center
                  h-10 w-10 shrink-0 rounded-xl
                  bg-red-500/10 hover:bg-red-500/20
                  transition-colors disabled:opacity-40
                "
              >
                <X className="h-4 w-4 text-red-500" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export { ImageFormatConverterModal };
export default ImageFormatConverterModal;
