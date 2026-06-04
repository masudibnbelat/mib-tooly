"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
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
  Move,
  ZoomIn,
  ZoomOut,
  Layers,
  Maximize2,
  ChevronDown,
  Check,
  type LucideIcon,
} from "lucide-react";
import { type HTMLMotionProps } from "motion/react";

type MimeType = "image/jpeg" | "image/png" | "image/webp";
type FitMode = "contain" | "cover" | "stretch";
type BgMode = "white" | "blur" | "black" | "transparent";

interface ImageResizerProps {
  onClose: () => void;
}

interface SelectOptionItem {
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
  disabled?: boolean;
}

const SelectOption = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className = "",
  disabled = false,
}: SelectOptionProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-xs text-(--color-gray) uppercase tracking-[0.16em]">
          {label}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className="relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border border-(--color-active-border) bg-(--color-bg) text-(--color-text) text-sm focus:outline-none focus:border-(--color-text) transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-60 mt-1 w-full min-w-40 rounded-2xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-xl"
            style={{ top: "100%" }}
          >
            <div className="max-h-56 overflow-y-auto">
              {options.map((opt, i) => {
                const isSel = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: i * 0.025,
                      duration: 0.12,
                      ease: "easeOut",
                    }}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      isSel
                        ? "bg-(--color-active-bg) text-(--color-text)"
                        : "text-(--color-text) hover:bg-(--color-active-bg)"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSel && (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const MIME_OPTIONS: SelectOptionItem[] = [
  { label: "JPG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WEBP", value: "image/webp" },
];

const BG_OPTIONS: SelectOptionItem[] = [
  { label: "White", value: "white" },
  { label: "Black", value: "black" },
  { label: "Blur", value: "blur" },
  { label: "Transparent", value: "transparent" },
];

const AUTO_POSITION_OPTIONS: SelectOptionItem[] = [
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Top Left", value: "top-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Right", value: "bottom-right" },
];

type SocialCategory = "custom" | "facebook" | "youtube" | "x";

interface SocialPreset {
  label: string;
  width: number;
  height: number;
  category: SocialCategory;
  isBanner?: boolean;
}

const SOCIAL_PRESETS: SocialPreset[] = [
  {
    label: "FB Banner",
    width: 820,
    height: 312,
    category: "facebook",
    isBanner: true,
  },
  {
    label: "FB Cover",
    width: 851,
    height: 315,
    category: "facebook",
    isBanner: true,
  },
  { label: "FB Profile", width: 170, height: 170, category: "facebook" },
  { label: "FB Post", width: 1200, height: 630, category: "facebook" },
  {
    label: "YT Thumbnail",
    width: 1280,
    height: 720,
    category: "youtube",
    isBanner: true,
  },
  { label: "YT Profile", width: 800, height: 800, category: "youtube" },
  {
    label: "YT Banner",
    width: 2560,
    height: 1440,
    category: "youtube",
    isBanner: true,
  },
  {
    label: "X Thumbnail",
    width: 1200,
    height: 675,
    category: "x",
    isBanner: true,
  },
  { label: "X Profile", width: 400, height: 400, category: "x" },
  {
    label: "X Banner",
    width: 1500,
    height: 500,
    category: "x",
    isBanner: true,
  },
];

const SCALE_PRESETS = [25, 50, 75, 100];

const CATEGORY_OPTIONS: SelectOptionItem[] = [
  { label: "Custom", value: "custom" },
  { label: "Facebook", value: "facebook" },
  { label: "YouTube", value: "youtube" },
  { label: "X (Twitter)", value: "x" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  let v = bytes,
    i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function getRatioLabel(w: number, h: number) {
  if (!w || !h) return "—";
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}
function getMegaPixels(w: number, h: number) {
  if (!w || !h) return "—";
  return `${((w * h) / 1_000_000).toFixed(2)} MP`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const Panel = ({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) => (
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

const ActionButton = ({
  icon: Icon,
  active,
  full,
  className,
  children,
  ...props
}: Omit<HTMLMotionProps<"button">, "ref" | "children"> & {
  icon?: LucideIcon;
  active?: boolean;
  full?: boolean;
  children?: ReactNode;
}) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    whileHover={{ y: -1 }}
    className={[
      "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none",
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

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-(--color-active-border) bg-(--color-bg) p-3">
    <p className="text-[11px] uppercase tracking-[0.16em] text-(--color-gray)">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-(--color-text) truncate">
      {value}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ImageResizer = ({ onClose }: ImageResizerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewHostRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);

  const [dragging, setDragging] = useState(false);
  const [isDraggingImg, setIsDraggingImg] = useState(false);

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

  const [bgMode, setBgMode] = useState<BgMode>("white");
  const [imgOffsetX, setImgOffsetX] = useState(0);
  const [imgOffsetY, setImgOffsetY] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);
  const [autoPosition, setAutoPosition] = useState("center");
  const [selectedCategory, setSelectedCategory] =
    useState<SocialCategory>("custom");

  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const hasImage = original.width > 0 && original.height > 0;

  const isBannerPreset = useMemo(() => {
    const match = SOCIAL_PRESETS.find(
      (p) => p.width === width && p.height === height,
    );
    return match?.isBanner ?? false;
  }, [width, height]);

  const normalizedRotation = useMemo(
    () => ((rotation % 360) + 360) % 360,
    [rotation],
  );

  const effectiveAspect = useMemo(() => {
    if (!original.width || !original.height) return 1;
    return normalizedRotation % 180 === 0
      ? original.width / original.height
      : original.height / original.width;
  }, [normalizedRotation, original]);

  const setDimensions = useCallback((nw: number, nh: number) => {
    const sw = Math.max(1, Math.floor(nw));
    const sh = Math.max(1, Math.floor(nh));
    setWidth(sw);
    setHeight(sh);
    setWidthInput(String(sw));
    setHeightInput(String(sh));
  }, []);

  const revokeSourceUrl = useCallback(() => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
  }, []);

  const clearPreviewCanvas = useCallback(() => {
    const c = previewCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    c.width = 0;
    c.height = 0;
    c.style.width = "0px";
    c.style.height = "0px";
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
    setBgMode("white");
    setImgOffsetX(0);
    setImgOffsetY(0);
    setImgZoom(1);
    setAutoPosition("center");
    setSelectedCategory("custom");
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

  const applyAutoPosition = useCallback((pos: string) => {
    setAutoPosition(pos);
    const map: Record<string, [number, number]> = {
      center: [0, 0],
      top: [0, -1],
      bottom: [0, 1],
      left: [-1, 0],
      right: [1, 0],
      "top-left": [-1, -1],
      "top-right": [1, -1],
      "bottom-left": [-1, 1],
      "bottom-right": [1, 1],
    };
    const [ox, oy] = map[pos] ?? [0, 0];
    setImgOffsetX(ox);
    setImgOffsetY(oy);
  }, []);

  // ─── Core render function ──────────────────────────────────────────────────
  const renderFrame = useCallback(
    (ctx: CanvasRenderingContext2D, fw: number, fh: number) => {
      const img = imageRef.current;
      if (!img || !fw || !fh) return;

      ctx.save();
      ctx.clearRect(0, 0, fw, fh);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const quarterTurn = normalizedRotation % 180 !== 0;
      const rotW = quarterTurn ? img.naturalHeight : img.naturalWidth;
      const rotH = quarterTurn ? img.naturalWidth : img.naturalHeight;

      const coverScale = Math.max(fw / rotW, fh / rotH);
      const containScale = Math.min(fw / rotW, fh / rotH);
      const stretchScaleX = fw / rotW;
      const stretchScaleY = fh / rotH;

      // Background fill
      if (bgMode === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, fw, fh);
      } else if (bgMode === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, fw, fh);
      } else if (bgMode === "blur") {
        // Blurred background: cover the entire canvas, centered, no offset
        const bgScale = coverScale * 1.2;
        const bgW = img.naturalWidth * bgScale;
        const bgH = img.naturalHeight * bgScale;
        ctx.save();
        ctx.filter = "blur(28px)";
        ctx.translate(fw / 2, fh / 2);
        ctx.rotate((normalizedRotation * Math.PI) / 180);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.drawImage(img, -bgW / 2, -bgH / 2, bgW, bgH);
        ctx.restore();
        ctx.filter = "none";
      }
      // transparent → nothing drawn

      // Main image
      let drawW: number, drawH: number;

      if (fitMode === "stretch") {
        // Stretch to fill completely, ignore aspect ratio
        drawW = img.naturalWidth * stretchScaleX;
        drawH = img.naturalHeight * stretchScaleY;
      } else {
        const baseScale = fitMode === "cover" ? coverScale : containScale;
        const totalScale = baseScale * imgZoom;
        drawW = img.naturalWidth * totalScale;
        drawH = img.naturalHeight * totalScale;
      }

      // Calculate how much the image overflows the canvas (for clamped panning)
      const overflowX = Math.max(0, drawW - fw) / 2;
      const overflowY = Math.max(0, drawH - fh) / 2;
      const ox = imgOffsetX * overflowX;
      const oy = imgOffsetY * overflowY;

      ctx.save();
      ctx.translate(fw / 2 + ox, fh / 2 + oy);
      ctx.rotate((normalizedRotation * Math.PI) / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      ctx.restore();
    },
    [
      fitMode,
      flipX,
      flipY,
      normalizedRotation,
      bgMode,
      imgOffsetX,
      imgOffsetY,
      imgZoom,
    ],
  );

  // ─── Preview draw ──────────────────────────────────────────────────────────
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (
      !canvas ||
      !hasImage ||
      !width ||
      !height ||
      !previewSize.width ||
      !previewSize.height
    )
      return;

    const ratio = width / height;
    let cssW = previewSize.width;
    let cssH = cssW / ratio;
    if (cssH > previewSize.height) {
      cssH = previewSize.height;
      cssW = cssH * ratio;
    }
    cssW = Math.max(1, Math.floor(cssW));
    cssH = Math.max(1, Math.floor(cssH));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelW = Math.floor(cssW * dpr);
    const pixelH = Math.floor(cssH * dpr);

    // Only resize canvas if dimensions changed to avoid flicker
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderFrame(ctx, cssW, cssH);
  }, [hasImage, height, previewSize, renderFrame, width]);

  // ─── File loading ──────────────────────────────────────────────────────────
  const loadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      revokeSourceUrl();
      const url = URL.createObjectURL(file);
      sourceUrlRef.current = url;
      const img = new window.Image();
      img.decoding = "async";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load image"));
        img.src = url;
      }).catch(() => undefined);
      if (!img.naturalWidth || !img.naturalHeight) return;

      const fmt: MimeType =
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
      setSourceFormat(fmt);
      setFormat(fmt);
      setQuality(0.92);
      setKeepAspect(true);
      setRotation(0);
      setFlipX(false);
      setFlipY(false);
      setFitMode("contain");
      setBgMode("white");
      setImgOffsetX(0);
      setImgOffsetY(0);
      setImgZoom(1);
      setAutoPosition("center");
      setSelectedCategory("custom");
    },
    [revokeSourceUrl, setDimensions],
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void loadFile(f);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void loadFile(f);
  };

  // ─── Dimension handlers ────────────────────────────────────────────────────
  const handleWidthChange = (val: string) => {
    setWidthInput(val);
    const p = Number(val);
    if (!Number.isFinite(p) || p <= 0) return;
    const nw = Math.max(1, Math.floor(p));
    setWidth(nw);
    if (keepAspect && effectiveAspect) {
      const nh = Math.max(1, Math.round(nw / effectiveAspect));
      setHeight(nh);
      setHeightInput(String(nh));
    }
  };

  const handleHeightChange = (val: string) => {
    setHeightInput(val);
    const p = Number(val);
    if (!Number.isFinite(p) || p <= 0) return;
    const nh = Math.max(1, Math.floor(p));
    setHeight(nh);
    if (keepAspect && effectiveAspect) {
      const nw = Math.max(1, Math.round(nh * effectiveAspect));
      setWidth(nw);
      setWidthInput(String(nw));
    }
  };

  const normalizeWidth = () => {
    const sw = Math.max(1, Math.floor(Number(widthInput) || width || 1));
    if (keepAspect && effectiveAspect) {
      setDimensions(sw, Math.max(1, Math.round(sw / effectiveAspect)));
      return;
    }
    setWidth(sw);
    setWidthInput(String(sw));
  };

  const normalizeHeight = () => {
    const sh = Math.max(1, Math.floor(Number(heightInput) || height || 1));
    if (keepAspect && effectiveAspect) {
      setDimensions(Math.max(1, Math.round(sh * effectiveAspect)), sh);
      return;
    }
    setHeight(sh);
    setHeightInput(String(sh));
  };

  // ─── Preset / transform handlers ──────────────────────────────────────────
  const applyScale = (pct: number) => {
    if (!hasImage) return;
    const r = pct / 100;
    const bw =
      normalizedRotation % 180 === 0 ? original.width : original.height;
    const bh =
      normalizedRotation % 180 === 0 ? original.height : original.width;
    setDimensions(
      Math.max(1, Math.round(bw * r)),
      Math.max(1, Math.round(bh * r)),
    );
  };

  const applyPreset = (p: SocialPreset) => {
    if (!hasImage) return;
    setDimensions(p.width, p.height);
    setFitMode("cover");
    setBgMode(p.isBanner ? "blur" : "white");
    setImgOffsetX(0);
    setImgOffsetY(0);
    setImgZoom(1);
    setAutoPosition("center");
  };

  const swapDimensions = () => {
    if (!hasImage) return;
    setDimensions(height || 1, width || 1);
  };

  const rotateLeft = () => {
    if (!hasImage) return;
    setRotation((p) => (p + 270) % 360);
    setDimensions(height || 1, width || 1);
  };

  const rotateRight = () => {
    if (!hasImage) return;
    setRotation((p) => (p + 90) % 360);
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
    setBgMode("white");
    setImgOffsetX(0);
    setImgOffsetY(0);
    setImgZoom(1);
    setAutoPosition("center");
    setSelectedCategory("custom");
  };

  // ─── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!hasImage || !width || !height || !imageRef.current) return;

    const ec = document.createElement("canvas");
    ec.width = width;
    ec.height = height;
    const ctx = ec.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    renderFrame(ctx, width, height);

    ec.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}-${width}x${height}.${getExtension(format)}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        requestAnimationFrame(() => URL.revokeObjectURL(url));
      },
      format,
      format === "image/png" ? undefined : quality,
    );
  }, [fileName, format, hasImage, height, quality, renderFrame, width]);

  // ─── Canvas drag to reposition ─────────────────────────────────────────────
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!hasImage) return;
      e.preventDefault();
      setIsDraggingImg(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: imgOffsetX,
        oy: imgOffsetY,
      };
    },
    [hasImage, imgOffsetX, imgOffsetY],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingImg || !dragStartRef.current) return;
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      const dx = (e.clientX - dragStartRef.current.x) / (cw / 2);
      const dy = (e.clientY - dragStartRef.current.y) / (ch / 2);
      setImgOffsetX(Math.max(-1, Math.min(1, dragStartRef.current.ox + dx)));
      setImgOffsetY(Math.max(-1, Math.min(1, dragStartRef.current.oy + dy)));
    },
    [isDraggingImg],
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingImg(false);
    dragStartRef.current = null;
  }, []);

  const handleCanvasTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!hasImage || !e.touches[0]) return;
      e.preventDefault();
      setIsDraggingImg(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: imgOffsetX,
        oy: imgOffsetY,
      };
    },
    [hasImage, imgOffsetX, imgOffsetY],
  );

  const handleCanvasTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingImg || !dragStartRef.current || !e.touches[0]) return;
      e.preventDefault();
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      const dx = (e.touches[0].clientX - dragStartRef.current.x) / (cw / 2);
      const dy = (e.touches[0].clientY - dragStartRef.current.y) / (ch / 2);
      setImgOffsetX(Math.max(-1, Math.min(1, dragStartRef.current.ox + dx)));
      setImgOffsetY(Math.max(-1, Math.min(1, dragStartRef.current.oy + dy)));
    },
    [isDraggingImg],
  );

  const filteredPresets = useMemo(
    () =>
      selectedCategory === "custom"
        ? []
        : SOCIAL_PRESETS.filter((p) => p.category === selectedCategory),
    [selectedCategory],
  );

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    measurePreviewHost();
    const node = previewHostRef.current;
    if (!node) return;
    let obs: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      obs = new ResizeObserver(() => measurePreviewHost());
      obs.observe(node);
    }
    window.addEventListener("resize", measurePreviewHost);
    return () => {
      obs?.disconnect();
      window.removeEventListener("resize", measurePreviewHost);
    };
  }, [measurePreviewHost]);

  useEffect(() => {
    if (!hasImage) {
      clearPreviewCanvas();
      return;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawPreview());
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clearPreviewCanvas, drawPreview, hasImage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        inputRef.current?.click();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
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
        {/* ── Header ── */}
        <header className="shrink-0 border-b border-(--color-active-border) bg-(--color-bg) px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-(--color-text) sm:text-2xl">
                Image Resizer
              </h2>
              <p className="mt-1 text-sm text-(--color-gray)">
                Resize, crop, position, social presets &amp; download
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full bg-red-500 p-2 text-white opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_440px]">
            {/* Preview Panel */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
              className="min-w-0"
            >
              <Panel icon={ImageUp} title="Preview">
                {/* Drop zone */}
                <div
                  ref={previewHostRef}
                  className={[
                    "relative flex h-[40dvh] min-h-64 w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed p-3 transition-all duration-150 sm:h-[46dvh] lg:h-[55dvh]",
                    dragging
                      ? "border-(--color-text) bg-(--color-active-bg)"
                      : "border-(--color-active-border) bg-(--color-active-bg)",
                  ].join(" ")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <AnimatePresence mode="wait">
                    {!hasImage ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="max-w-md cursor-pointer text-center"
                        onClick={() => inputRef.current?.click()}
                      >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-active-bg)">
                          <Upload className="h-8 w-8 text-(--color-text)" />
                        </div>
                        <h3 className="text-lg font-semibold text-(--color-text)">
                          Upload an image
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-(--color-gray)">
                          Drag &amp; drop or tap here to select
                        </p>
                        <p className="mt-2 text-xs text-(--color-gray)">
                          Zero loading · client-side · drag to position
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative flex h-full w-full items-center justify-center"
                      >
                        <div
                          className={`relative select-none ${isDraggingImg ? "cursor-grabbing" : "cursor-grab"}`}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={handleCanvasMouseUp}
                          onTouchStart={handleCanvasTouchStart}
                          onTouchMove={handleCanvasTouchMove}
                          onTouchEnd={handleCanvasMouseUp}
                        >
                          <canvas
                            ref={previewCanvasRef}
                            className="rounded-2xl border border-(--color-active-border) block"
                          />
                          {isDraggingImg && (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-(--color-text)" />
                          )}
                        </div>

                        {/* Drag hint */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
                          <span className="flex items-center gap-1 rounded-full border border-(--color-active-border) bg-(--color-bg) px-3 py-1 text-[11px] text-(--color-gray)">
                            <Move className="h-3 w-3" /> Drag to reposition
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hidden file input */}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <StatBox
                    label="Original"
                    value={
                      hasImage ? `${original.width}×${original.height}` : "—"
                    }
                  />
                  <StatBox
                    label="Output"
                    value={hasImage ? `${width}×${height}` : "—"}
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
                    label="Size"
                    value={hasImage ? formatBytes(fileSize) : "—"}
                  />
                </div>

                {/* Tags */}
                {hasImage && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--color-gray)">
                    {[
                      fileName,
                      format.replace("image/", "").toUpperCase(),
                      fitMode.toUpperCase(),
                      `${normalizedRotation}°`,
                      bgMode.toUpperCase(),
                      `Zoom ${(imgZoom * 100).toFixed(0)}%`,
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-xl border border-(--color-active-border) bg-(--color-bg) px-3 py-1.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
            </motion.div>

            {/* ── Controls ── */}
            <div className="space-y-4 min-w-0">
              {/* Social Presets */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Panel icon={Layers} title="Social Presets">
                  <SelectOption
                    options={CATEGORY_OPTIONS}
                    value={selectedCategory}
                    onChange={(v) => setSelectedCategory(v as SocialCategory)}
                    label="Platform"
                    disabled={!hasImage}
                  />
                  <AnimatePresence>
                    {selectedCategory !== "custom" &&
                      filteredPresets.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {filteredPresets.map((preset) => (
                              <ActionButton
                                key={preset.label}
                                onClick={() => applyPreset(preset)}
                                disabled={!hasImage}
                                full
                                active={
                                  width === preset.width &&
                                  height === preset.height
                                }
                              >
                                <span className="text-left">
                                  <span className="block text-xs font-semibold">
                                    {preset.label}
                                  </span>
                                  <span className="block text-[10px] opacity-70">
                                    {preset.width}×{preset.height}
                                  </span>
                                </span>
                              </ActionButton>
                            ))}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                  {selectedCategory === "custom" && (
                    <p className="mt-2 text-xs text-(--color-gray)">
                      Pick a platform to see preset sizes for banners,
                      thumbnails &amp; profiles.
                    </p>
                  )}
                </Panel>
              </motion.div>

              {/* Resize */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
              >
                <Panel icon={SlidersHorizontal} title="Resize">
                  <div className="grid grid-cols-2 gap-3">
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
                      active={keepAspect}
                      full
                      className="py-3"
                      disabled={!hasImage}
                      onClick={() => {
                        if (!hasImage) return;
                        const next = !keepAspect;
                        setKeepAspect(next);
                        if (next && effectiveAspect && width) {
                          const nh = Math.max(
                            1,
                            Math.round(width / effectiveAspect),
                          );
                          setHeight(nh);
                          setHeightInput(String(nh));
                        }
                      }}
                    >
                      {keepAspect ? "Aspect Locked" : "Unlocked"}
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
                      {SCALE_PRESETS.map((pct) => (
                        <ActionButton
                          key={pct}
                          onClick={() => applyScale(pct)}
                          disabled={!hasImage}
                          full
                        >
                          {pct}%
                        </ActionButton>
                      ))}
                    </div>
                  </div>
                </Panel>
              </motion.div>

              {/* Position & Zoom */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.09 }}
              >
                <Panel icon={Move} title="Position & Zoom">
                  <div className="space-y-4">
                    {/* Zoom */}
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                          Zoom
                        </span>
                        <span className="text-sm font-medium text-(--color-text)">
                          {(imgZoom * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionButton
                          icon={ZoomOut}
                          disabled={!hasImage}
                          onClick={() =>
                            setImgZoom((z) =>
                              Math.max(0.1, +(z - 0.1).toFixed(2)),
                            )
                          }
                        />
                        <input
                          type="range"
                          min={0.1}
                          max={4}
                          step={0.05}
                          value={imgZoom}
                          onChange={(e) => setImgZoom(Number(e.target.value))}
                          disabled={!hasImage}
                          className="flex-1 accent-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <ActionButton
                          icon={ZoomIn}
                          disabled={!hasImage}
                          onClick={() =>
                            setImgZoom((z) =>
                              Math.min(4, +(z + 0.1).toFixed(2)),
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Offset sliders */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-(--color-gray)">
                          <span className="uppercase tracking-[0.16em]">
                            Horizontal
                          </span>
                          <span className="font-medium text-(--color-text)">
                            {(imgOffsetX * 100).toFixed(0)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-1}
                          max={1}
                          step={0.01}
                          value={imgOffsetX}
                          onChange={(e) =>
                            setImgOffsetX(Number(e.target.value))
                          }
                          disabled={!hasImage}
                          className="w-full accent-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-(--color-gray)">
                          <span className="uppercase tracking-[0.16em]">
                            Vertical
                          </span>
                          <span className="font-medium text-(--color-text)">
                            {(imgOffsetY * 100).toFixed(0)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-1}
                          max={1}
                          step={0.01}
                          value={imgOffsetY}
                          onChange={(e) =>
                            setImgOffsetY(Number(e.target.value))
                          }
                          disabled={!hasImage}
                          className="w-full accent-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Auto position */}
                    <SelectOption
                      options={AUTO_POSITION_OPTIONS}
                      value={autoPosition}
                      onChange={applyAutoPosition}
                      label="Auto Position"
                      disabled={!hasImage}
                    />

                    {/* Reset position */}
                    <ActionButton
                      icon={Maximize2}
                      onClick={() => {
                        setImgOffsetX(0);
                        setImgOffsetY(0);
                        setImgZoom(1);
                        setAutoPosition("center");
                      }}
                      disabled={!hasImage}
                      full
                    >
                      Reset Position &amp; Zoom
                    </ActionButton>
                  </div>
                </Panel>
              </motion.div>

              {/* Background */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Panel icon={Layers} title="Background">
                  <SelectOption
                    options={BG_OPTIONS}
                    value={bgMode}
                    onChange={(v) => setBgMode(v as BgMode)}
                    label="Background Fill"
                    disabled={!hasImage}
                  />
                  <p className="mt-3 text-xs leading-relaxed text-(--color-gray)">
                    <span className="font-medium text-(--color-text)">
                      White / Black
                    </span>{" "}
                    — solid fill behind image.
                    <br />
                    <span className="font-medium text-(--color-text)">
                      Blur
                    </span>{" "}
                    — blurred image as background (great for banners).
                    <br />
                    <span className="font-medium text-(--color-text)">
                      Transparent
                    </span>{" "}
                    — PNG only; exports with no background.
                  </p>
                  <AnimatePresence>
                    {isBannerPreset && bgMode === "white" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      >
                        💡 Tip: Banner/thumbnail presets look better with{" "}
                        <strong>Blur</strong> background.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Panel>
              </motion.div>

              {/* Transform */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.11 }}
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
                      onClick={() => setFlipX((p) => !p)}
                      disabled={!hasImage}
                      active={flipX}
                      full
                    >
                      Flip H
                    </ActionButton>
                    <ActionButton
                      icon={ArrowUpDown}
                      onClick={() => setFlipY((p) => !p)}
                      disabled={!hasImage}
                      active={flipY}
                      full
                    >
                      Flip V
                    </ActionButton>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--color-gray)">
                      Fit Mode
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["contain", "cover", "stretch"] as FitMode[]).map(
                        (m) => (
                          <ActionButton
                            key={m}
                            onClick={() => setFitMode(m)}
                            disabled={!hasImage}
                            active={fitMode === m}
                            full
                          >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </ActionButton>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-3">
                    {(
                      [
                        ["Rotation", `${normalizedRotation}°`],
                        ["Flip H", flipX ? "On" : "Off"],
                        ["Flip V", flipY ? "On" : "Off"],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-(--color-gray)">{k}</span>
                        <span className="font-medium text-(--color-text)">
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </motion.div>

              {/* Export */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }}
              >
                <Panel icon={Download} title="Export">
                  <SelectOption
                    options={MIME_OPTIONS}
                    value={format}
                    onChange={(v) => setFormat(v as MimeType)}
                    label="Format"
                    disabled={!hasImage}
                  />

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
                      label="Format"
                      value={format.replace("image/", "").toUpperCase()}
                    />
                    <StatBox
                      label="File Name"
                      value={hasImage ? fileName : "—"}
                    />
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-(--color-gray)">
                    Esc = close · Ctrl+O = upload · Ctrl+S = download
                  </p>
                </Panel>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="shrink-0 border-t border-(--color-active-border) bg-(--color-bg) px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionButton
              icon={Upload}
              onClick={() => inputRef.current?.click()}
              className="flex-1 sm:flex-none"
            >
              {hasImage ? "Replace" : "Upload"}
            </ActionButton>
            <ActionButton
              icon={RefreshCcw}
              onClick={handleReset}
              disabled={!hasImage}
              className="flex-1 sm:flex-none"
            >
              Reset
            </ActionButton>
            <ActionButton
              icon={Trash2}
              onClick={clearAll}
              disabled={!hasImage}
              className="flex-1 sm:flex-none"
            >
              Clear
            </ActionButton>
            <ActionButton
              icon={Download}
              onClick={handleDownload}
              disabled={!hasImage}
              active={hasImage}
              className="flex-1 sm:flex-none"
            >
              Download
            </ActionButton>
          </div>
        </footer>
      </motion.section>
    </motion.div>
  );
};

export default ImageResizer;
