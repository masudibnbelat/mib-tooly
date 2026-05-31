"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type DragEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  ArrowUpDown,
  Download,
  ImageUp,
  Lock,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Trash2,
  Unlock,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";

type MimeType = "image/jpeg" | "image/png" | "image/webp";
type FitMode = "contain" | "cover" | "stretch";

interface ImageResizerProps {
  onClose: () => void;
}

const MIME_OPTIONS: { label: string; value: MimeType }[] = [
  { label: "JPG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WEBP", value: "image/webp" },
];

const SIZE_PRESETS = [
  { label: "Square", width: 1080, height: 1080 },
  { label: "Story", width: 1080, height: 1920 },
  { label: "Post", width: 1080, height: 1350 },
  { label: "HD", width: 1280, height: 720 },
  { label: "Full HD", width: 1920, height: 1080 },
  { label: "Thumb", width: 512, height: 512 },
];

const SCALE_PRESETS = [25, 50, 75, 100];

function getBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "image";
}

function getExtension(type: MimeType) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function getRatioLabel(width: number, height: number) {
  if (!width || !height) return "—";
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}

function getMegaPixels(width: number, height: number) {
  if (!width || !height) return "—";
  return `${((width * height) / 1_000_000).toFixed(2)} MP`;
}

const Panel = ({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) => {
  return (
    <div className="rounded-3xl border border-(--color-active-border) bg-(--color-bg) p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--color-active-bg)">
          <Icon className="h-5 w-5 text-(--color-text)" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-(--color-text)">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  active,
  full,
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  icon?: LucideIcon;
  active?: boolean;
  full?: boolean;
}) => {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-150",
        full ? "w-full" : "",
        active
          ? "border-(--color-text) bg-(--color-active-bg) text-(--color-active-text)"
          : "border-(--color-active-border) bg-(--color-bg) text-(--color-text) hover:bg-(--color-active-bg)",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children ? <span>{children}</span> : null}
    </motion.button>
  );
};

const StatBox = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-2xl border border-(--color-active-border) bg-(--color-bg) p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-(--color-gray)">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-(--color-text)">{value}</p>
    </div>
  );
};

const ImageResizer = ({ onClose }: ImageResizerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewHostRef = useRef<HTMLDivElement>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const [dragging, setDragging] = useState(false);

  const [fileName, setFileName] = useState("image");
  const [fileSize, setFileSize] = useState(0);

  const [original, setOriginal] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");

  const [sourceFormat, setSourceFormat] = useState<MimeType>("image/jpeg");
  const [format, setFormat] = useState<MimeType>("image/jpeg");
  const [quality, setQuality] = useState(0.92);

  const [keepAspect, setKeepAspect] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>("contain");

  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const hasImage = original.width > 0 && original.height > 0;

  const normalizedRotation = useMemo(
    () => ((rotation % 360) + 360) % 360,
    [rotation],
  );

  const effectiveAspect = useMemo(() => {
    if (!original.width || !original.height) return 1;
    return normalizedRotation % 180 === 0
      ? original.width / original.height
      : original.height / original.width;
  }, [normalizedRotation, original.height, original.width]);

  const setDimensions = useCallback((nextWidth: number, nextHeight: number) => {
    const safeWidth = Math.max(1, Math.floor(nextWidth));
    const safeHeight = Math.max(1, Math.floor(nextHeight));

    setWidth(safeWidth);
    setHeight(safeHeight);
    setWidthInput(String(safeWidth));
    setHeightInput(String(safeHeight));
  }, []);

  const revokeSourceUrl = useCallback(() => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
  }, []);

  const clearPreviewCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    canvas.style.width = "0px";
    canvas.style.height = "0px";
  }, []);

  const clearAll = useCallback(() => {
    revokeSourceUrl();
    imageRef.current = null;

    setDragging(false);
    setFileName("image");
    setFileSize(0);
    setOriginal({ width: 0, height: 0 });
    setWidth(0);
    setHeight(0);
    setWidthInput("");
    setHeightInput("");
    setSourceFormat("image/jpeg");
    setFormat("image/jpeg");
    setQuality(0.92);
    setKeepAspect(true);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setFitMode("contain");

    if (inputRef.current) inputRef.current.value = "";
    clearPreviewCanvas();
  }, [clearPreviewCanvas, revokeSourceUrl]);

  const measurePreviewHost = useCallback(() => {
    const node = previewHostRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    setPreviewSize({
      width: Math.max(1, Math.floor(rect.width - 24)),
      height: Math.max(1, Math.floor(rect.height - 24)),
    });
  }, []);

  const getThemeBackground = useCallback(() => {
    const color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-bg")
        .trim() || "#ffffff";
    return color;
  }, []);

  const renderFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      frameWidth: number,
      frameHeight: number,
    ) => {
      const img = imageRef.current;
      if (!img || !frameWidth || !frameHeight) return;

      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (format === "image/jpeg") {
        ctx.fillStyle = getThemeBackground();
        ctx.fillRect(0, 0, frameWidth, frameHeight);
      }

      const quarterTurn = normalizedRotation % 180 !== 0;
      let drawWidth = 0;
      let drawHeight = 0;

      if (fitMode === "stretch") {
        if (quarterTurn) {
          drawWidth = frameHeight;
          drawHeight = frameWidth;
        } else {
          drawWidth = frameWidth;
          drawHeight = frameHeight;
        }
      } else {
        const rotatedBoxWidth = quarterTurn
          ? img.naturalHeight
          : img.naturalWidth;
        const rotatedBoxHeight = quarterTurn
          ? img.naturalWidth
          : img.naturalHeight;

        const scale =
          fitMode === "cover"
            ? Math.max(
                frameWidth / rotatedBoxWidth,
                frameHeight / rotatedBoxHeight,
              )
            : Math.min(
                frameWidth / rotatedBoxWidth,
                frameHeight / rotatedBoxHeight,
              );

        drawWidth = img.naturalWidth * scale;
        drawHeight = img.naturalHeight * scale;
      }

      ctx.save();
      ctx.translate(frameWidth / 2, frameHeight / 2);
      ctx.rotate((normalizedRotation * Math.PI) / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
      );
      ctx.restore();
    },
    [fitMode, flipX, flipY, format, getThemeBackground, normalizedRotation],
  );

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (
      !canvas ||
      !hasImage ||
      !width ||
      !height ||
      !previewSize.width ||
      !previewSize.height
    ) {
      return;
    }

    const ratio = width / height;
    let cssWidth = previewSize.width;
    let cssHeight = cssWidth / ratio;

    if (cssHeight > previewSize.height) {
      cssHeight = previewSize.height;
      cssWidth = cssHeight * ratio;
    }

    cssWidth = Math.max(1, Math.floor(cssWidth));
    cssHeight = Math.max(1, Math.floor(cssHeight));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderFrame(ctx, cssWidth, cssHeight);
  }, [
    hasImage,
    height,
    previewSize.height,
    previewSize.width,
    renderFrame,
    width,
  ]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      revokeSourceUrl();

      const objectUrl = URL.createObjectURL(file);
      sourceUrlRef.current = objectUrl;

      const img = new window.Image();
      img.decoding = "async";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = objectUrl;
      }).catch(() => undefined);

      if (!img.naturalWidth || !img.naturalHeight) return;

      const nextFormat: MimeType =
        file.type === "image/png"
          ? "image/png"
          : file.type === "image/webp"
            ? "image/webp"
            : "image/jpeg";

      imageRef.current = img;
      setFileName(getBaseName(file.name));
      setFileSize(file.size);
      setOriginal({ width: img.naturalWidth, height: img.naturalHeight });
      setDimensions(img.naturalWidth, img.naturalHeight);
      setSourceFormat(nextFormat);
      setFormat(nextFormat);
      setQuality(0.92);
      setKeepAspect(true);
      setRotation(0);
      setFlipX(false);
      setFlipY(false);
      setFitMode("contain");
    },
    [revokeSourceUrl, setDimensions],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

  const handleWidthChange = (value: string) => {
    setWidthInput(value);
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    const nextWidth = Math.max(1, Math.floor(parsed));
    setWidth(nextWidth);

    if (keepAspect && effectiveAspect) {
      const nextHeight = Math.max(1, Math.round(nextWidth / effectiveAspect));
      setHeight(nextHeight);
      setHeightInput(String(nextHeight));
    }
  };

  const handleHeightChange = (value: string) => {
    setHeightInput(value);
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    const nextHeight = Math.max(1, Math.floor(parsed));
    setHeight(nextHeight);

    if (keepAspect && effectiveAspect) {
      const nextWidth = Math.max(1, Math.round(nextHeight * effectiveAspect));
      setWidth(nextWidth);
      setWidthInput(String(nextWidth));
    }
  };

  const normalizeWidth = () => {
    const safeWidth = Math.max(1, Math.floor(Number(widthInput) || width || 1));

    if (keepAspect && effectiveAspect) {
      setDimensions(
        safeWidth,
        Math.max(1, Math.round(safeWidth / effectiveAspect)),
      );
      return;
    }

    setWidth(safeWidth);
    setWidthInput(String(safeWidth));
  };

  const normalizeHeight = () => {
    const safeHeight = Math.max(
      1,
      Math.floor(Number(heightInput) || height || 1),
    );

    if (keepAspect && effectiveAspect) {
      setDimensions(
        Math.max(1, Math.round(safeHeight * effectiveAspect)),
        safeHeight,
      );
      return;
    }

    setHeight(safeHeight);
    setHeightInput(String(safeHeight));
  };

  const applyScale = (percent: number) => {
    if (!hasImage) return;
    const ratio = percent / 100;

    const baseWidth =
      normalizedRotation % 180 === 0 ? original.width : original.height;
    const baseHeight =
      normalizedRotation % 180 === 0 ? original.height : original.width;

    setDimensions(
      Math.max(1, Math.round(baseWidth * ratio)),
      Math.max(1, Math.round(baseHeight * ratio)),
    );
  };

  const applyPreset = (nextWidth: number, nextHeight: number) => {
    if (!hasImage) return;
    setDimensions(nextWidth, nextHeight);
  };

  const swapDimensions = () => {
    if (!hasImage) return;
    setDimensions(height || 1, width || 1);
  };

  const rotateLeft = () => {
    if (!hasImage) return;
    setRotation((prev) => (prev + 270) % 360);
    setDimensions(height || 1, width || 1);
  };

  const rotateRight = () => {
    if (!hasImage) return;
    setRotation((prev) => (prev + 90) % 360);
    setDimensions(height || 1, width || 1);
  };

  const handleReset = () => {
    if (!hasImage) return;
    setDimensions(original.width, original.height);
    setFormat(sourceFormat);
    setQuality(0.92);
    setKeepAspect(true);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setFitMode("contain");
  };

  const handleDownload = useCallback(() => {
    if (!hasImage || !width || !height || !imageRef.current) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    renderFrame(ctx, width, height);

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}-${width}x${height}.${getExtension(format)}`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        requestAnimationFrame(() => URL.revokeObjectURL(url));
      },
      format,
      format === "image/png" ? undefined : quality,
    );
  }, [fileName, format, hasImage, height, quality, renderFrame, width]);

  useEffect(() => {
    measurePreviewHost();

    const node = previewHostRef.current;
    if (!node) return;

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => measurePreviewHost());
      observer.observe(node);
    }

    window.addEventListener("resize", measurePreviewHost);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measurePreviewHost);
    };
  }, [measurePreviewHost]);

  useEffect(() => {
    if (!hasImage) {
      clearPreviewCanvas();
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      drawPreview();
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clearPreviewCanvas, drawPreview, hasImage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "o") {
        event.preventDefault();
        inputRef.current?.click();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        handleDownload();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDownload, onClose]);

  useEffect(() => {
    return () => {
      revokeSourceUrl();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [revokeSourceUrl]);

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close Image Resizer"
        onClick={onClose}
        className="absolute inset-0 bg-(--color-active-bg) backdrop-blur-sm"
      />

      <motion.section
        initial={{ opacity: 0, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.995 }}
        transition={{ duration: 0.18 }}
        className="relative flex h-dvh w-screen flex-col overflow-hidden bg-(--color-bg)"
      >
        <div className="shrink-0 border-b border-(--color-active-border) bg-(--color-bg) px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-(--color-text) sm:text-2xl">
                Image Resizer
              </h2>
              <p className="mt-1 text-sm text-(--color-gray)">
                Resize, rotate, flip, convert, preview and download instantly
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-(--color-gray) bg-red-500 shrink-0 rounded-full p-2 opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              <X className="h-5 w-5 " />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_420px]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
              className="min-w-0"
            >
              <Panel icon={ImageUp} title="Preview">
                <div
                  ref={previewHostRef}
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  className={[
                    "flex h-[40dvh] min-h-70 w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed p-3 transition-all duration-150 sm:h-[48dvh] lg:h-[58dvh]",
                    dragging
                      ? "border-(--color-text) bg-(--color-active-bg)"
                      : "border-(--color-active-border) bg-(--color-bg) hover:bg-(--color-active-bg)",
                  ].join(" ")}
                >
                  <AnimatePresence mode="wait">
                    {!hasImage ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="max-w-md text-center"
                      >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-active-bg)">
                          <Upload className="h-8 w-8 text-(--color-text)" />
                        </div>

                        <h3 className="text-lg font-semibold text-(--color-text)">
                          Upload an image
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-(--color-gray)">
                          Drag & drop or tap here to select an image
                        </p>
                        <p className="mt-2 text-xs text-(--color-gray)">
                          Zero loading • client-side preview • responsive canvas
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.985 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <canvas
                          ref={previewCanvasRef}
                          className="rounded-2xl border border-(--color-active-border) bg-(--color-bg)"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <StatBox
                    label="Original"
                    value={
                      hasImage ? `${original.width} × ${original.height}` : "—"
                    }
                  />
                  <StatBox
                    label="Output"
                    value={hasImage ? `${width} × ${height}` : "—"}
                  />
                  <StatBox
                    label="Aspect"
                    value={hasImage ? getRatioLabel(width, height) : "—"}
                  />
                  <StatBox
                    label="Pixels"
                    value={hasImage ? getMegaPixels(width, height) : "—"}
                  />
                  <StatBox
                    label="Source Size"
                    value={hasImage ? formatBytes(fileSize) : "—"}
                  />
                </div>

                {hasImage ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--color-gray)">
                    <span className="rounded-xl border border-(--color-active-border) bg-(--color-bg) px-3 py-1.5">
                      {fileName}
                    </span>
                    <span className="rounded-xl border border-(--color-active-border) bg-(--color-bg) px-3 py-1.5">
                      {format.replace("image/", "").toUpperCase()}
                    </span>
                    <span className="rounded-xl border border-(--color-active-border) bg-(--color-bg) px-3 py-1.5">
                      {fitMode.toUpperCase()}
                    </span>
                    <span className="rounded-xl border border-(--color-active-border) bg-(--color-bg) px-3 py-1.5">
                      Rotation {normalizedRotation}°
                    </span>
                  </div>
                ) : null}
              </Panel>
            </motion.div>

            <div className="space-y-4 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
              >
                <Panel icon={SlidersHorizontal} title="Resize">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                        Width
                      </span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={widthInput}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        onBlur={normalizeWidth}
                        disabled={!hasImage}
                        className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-3 py-3 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                        Height
                      </span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={heightInput}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        onBlur={normalizeHeight}
                        disabled={!hasImage}
                        className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-3 py-3 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ActionButton
                      icon={keepAspect ? Lock : Unlock}
                      onClick={() => {
                        if (!hasImage) return;
                        const next = !keepAspect;
                        setKeepAspect(next);

                        if (next && effectiveAspect && width) {
                          const nextHeight = Math.max(
                            1,
                            Math.round(width / effectiveAspect),
                          );
                          setHeight(nextHeight);
                          setHeightInput(String(nextHeight));
                        }
                      }}
                      disabled={!hasImage}
                      active={keepAspect}
                      full
                      className="py-3"
                    >
                      {keepAspect ? "Aspect Locked" : "Aspect Unlocked"}
                    </ActionButton>

                    <ActionButton
                      icon={ArrowLeftRight}
                      onClick={swapDimensions}
                      disabled={!hasImage}
                      full
                      className="py-3"
                    >
                      Swap W/H
                    </ActionButton>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                      Scale
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {SCALE_PRESETS.map((percent) => (
                        <ActionButton
                          key={percent}
                          onClick={() => applyScale(percent)}
                          disabled={!hasImage}
                          full
                        >
                          {percent}%
                        </ActionButton>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                      Presets
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SIZE_PRESETS.map((preset) => (
                        <ActionButton
                          key={preset.label}
                          onClick={() =>
                            applyPreset(preset.width, preset.height)
                          }
                          disabled={!hasImage}
                          full
                        >
                          {preset.label}
                        </ActionButton>
                      ))}
                    </div>
                  </div>
                </Panel>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.09 }}
              >
                <Panel icon={RotateCw} title="Transform">
                  <div className="grid grid-cols-2 gap-2">
                    <ActionButton
                      icon={RotateCcw}
                      onClick={rotateLeft}
                      disabled={!hasImage}
                      full
                    >
                      Rotate Left
                    </ActionButton>

                    <ActionButton
                      icon={RotateCw}
                      onClick={rotateRight}
                      disabled={!hasImage}
                      full
                    >
                      Rotate Right
                    </ActionButton>

                    <ActionButton
                      icon={ArrowLeftRight}
                      onClick={() => setFlipX((prev) => !prev)}
                      disabled={!hasImage}
                      active={flipX}
                      full
                    >
                      Flip Horizontal
                    </ActionButton>

                    <ActionButton
                      icon={ArrowUpDown}
                      onClick={() => setFlipY((prev) => !prev)}
                      disabled={!hasImage}
                      active={flipY}
                      full
                    >
                      Flip Vertical
                    </ActionButton>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                      Fit Mode
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <ActionButton
                        onClick={() => setFitMode("contain")}
                        disabled={!hasImage}
                        active={fitMode === "contain"}
                        full
                      >
                        Contain
                      </ActionButton>
                      <ActionButton
                        onClick={() => setFitMode("cover")}
                        disabled={!hasImage}
                        active={fitMode === "cover"}
                        full
                      >
                        Cover
                      </ActionButton>
                      <ActionButton
                        onClick={() => setFitMode("stretch")}
                        disabled={!hasImage}
                        active={fitMode === "stretch"}
                        full
                      >
                        Stretch
                      </ActionButton>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-(--color-gray)">Rotation</span>
                      <span className="font-medium text-(--color-text)">
                        {normalizedRotation}°
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-(--color-gray)">
                        Horizontal flip
                      </span>
                      <span className="font-medium text-(--color-text)">
                        {flipX ? "On" : "Off"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-(--color-gray)">Vertical flip</span>
                      <span className="font-medium text-(--color-text)">
                        {flipY ? "On" : "Off"}
                      </span>
                    </div>
                  </div>
                </Panel>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <Panel icon={Download} title="Export">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                      Format
                    </span>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as MimeType)}
                      disabled={!hasImage}
                      className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-3 py-3 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {MIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                        Quality
                      </span>
                      <span className="text-sm font-medium text-(--color-text)">
                        {Math.round(quality * 100)}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.01}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      disabled={!hasImage || format === "image/png"}
                      className="w-full accent-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-2 text-xs text-(--color-gray)">
                      PNG ignores quality. JPG and WEBP use this slider.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <StatBox
                      label="Output Format"
                      value={format.replace("image/", "").toUpperCase()}
                    />
                    <StatBox
                      label="File Name"
                      value={hasImage ? fileName : "—"}
                    />
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-(--color-gray)">
                    Shortcuts: Esc = close, Ctrl/Cmd + O = upload, Ctrl/Cmd + S
                    = download
                  </p>
                </Panel>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-(--color-active-border) bg-(--color-bg) px-3 py-3 sm:px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:justify-end">
            <ActionButton
              icon={Upload}
              onClick={() => inputRef.current?.click()}
              full
              className="lg:w-auto"
            >
              {hasImage ? "Replace" : "Upload"}
            </ActionButton>

            <ActionButton
              icon={RefreshCcw}
              onClick={handleReset}
              disabled={!hasImage}
              full
              className="lg:w-auto"
            >
              Reset
            </ActionButton>

            <ActionButton
              icon={Trash2}
              onClick={clearAll}
              disabled={!hasImage}
              full
              className="lg:w-auto"
            >
              Clear
            </ActionButton>

            <ActionButton
              icon={Download}
              onClick={handleDownload}
              disabled={!hasImage}
              active={hasImage}
              full
              className="lg:w-auto"
            >
              Download
            </ActionButton>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default ImageResizer;
