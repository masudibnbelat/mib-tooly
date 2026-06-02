"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Compass as CompassIcon, X } from "lucide-react";

interface CompassModalProps {
  onClose: () => void;
}

type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type PermissionOE = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

const TICKS = Array.from({ length: 72 }, (_, i) => ({
  angle: i * 5,
  major: i % 6 === 0,
}));

const DEGREE_MARKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const norm = (d: number) => ((d % 360) + 360) % 360;
const getDir = (d: number) => DIRS[Math.round(norm(d) / 45) % 8];

const shortDiff = (from: number, to: number) => {
  let d = norm(to) - norm(from);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};

class MedianFilter {
  private buf: number[] = [];
  private readonly size: number;
  constructor(size = 9) {
    this.size = size;
  }
  push(val: number): number {
    this.buf.push(val);
    if (this.buf.length > this.size) this.buf.shift();
    const ref = this.buf[0];
    const unwrapped = this.buf.map((v) => ref + shortDiff(ref, v));
    const sorted = [...unwrapped].sort((a, b) => a - b);
    return norm(sorted[Math.floor(sorted.length / 2)]);
  }
  get ready() {
    return this.buf.length >= 3;
  }
}

export const preRequestCompassPermission = async () => {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window))
    return "unsupported" as const;
  try {
    const OE = window.DeviceOrientationEvent as PermissionOE;
    if (typeof OE.requestPermission === "function")
      return await OE.requestPermission();
    return "granted" as const;
  } catch {
    return "denied" as const;
  }
};

export const CompassModal = ({ onClose }: CompassModalProps) => {
  const [status, setStatus] = useState<"connecting" | "active" | "unavailable">(
    "connecting",
  );

  const dialRef = useRef<HTMLDivElement>(null);
  const degRef = useRef<HTMLSpanElement>(null);
  const dirRef = useRef<HTMLSpanElement>(null);
  const debugRawRef = useRef<HTMLSpanElement>(null);
  const debugSrcRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const targetH = useRef(0);
  const displayH = useRef(0);
  const rafId = useRef<number>(0);
  const hasData = useRef(false);
  const sourceRef = useRef<string>("waiting…");

  useEffect(() => {
    let destroyed = false;
    const median = new MedianFilter(9);

    // ── Tick ───────────────────────────────────────────────────
    const tick = () => {
      if (destroyed) return;
      const diff = shortDiff(displayH.current, targetH.current);
      displayH.current =
        Math.abs(diff) > 0.05
          ? norm(displayH.current + diff * 0.08)
          : targetH.current;

      // Dial rotates OPPOSITE to heading
      // If facing North (0°) → dial doesn't rotate
      // If facing East (90°) → dial rotates -90° so N stays at top
      if (dialRef.current) {
        dialRef.current.style.transform = `rotate(${-displayH.current}deg)`;
      }

      const rounded = Math.round(norm(targetH.current));
      if (degRef.current) degRef.current.textContent = `${rounded}°`;
      if (dirRef.current) dirRef.current.textContent = getDir(rounded);

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    // ── Process heading ─────────────────────────────────────────
    const processHeading = (heading: number, src: string) => {
      const n = norm(heading);
      const filtered = median.push(n);
      if (!median.ready) return;

      // Update debug display directly via ref
      sourceRef.current = src;
      if (debugSrcRef.current) debugSrcRef.current.textContent = src;
      if (debugRawRef.current)
        debugRawRef.current.textContent = `${n.toFixed(1)}° → filtered: ${filtered.toFixed(1)}°`;

      if (!hasData.current) {
        targetH.current = filtered;
        displayH.current = filtered;
        hasData.current = true;
        if (!destroyed) setStatus("active");
      } else {
        const diff = shortDiff(targetH.current, filtered);
        targetH.current = norm(targetH.current + diff * 0.15);
      }
    };

    // ── iOS handler ─────────────────────────────────────────────
    // webkitCompassHeading: clockwise from magnetic north, 0-360
    // This is already the correct compass heading — use directly
    const onRelative = (raw: Event) => {
      if (destroyed) return;
      const e = raw as IOSOrientationEvent;

      if (
        typeof e.webkitCompassHeading === "number" &&
        !isNaN(e.webkitCompassHeading)
      ) {
        processHeading(e.webkitCompassHeading, "iOS");
        return;
      }
    };

    // ── Android absolute handler ────────────────────────────────
    // alpha: rotation around Z axis, counter-clockwise from north
    // So compass heading = alpha (NOT 360 - alpha)
    // When phone points North → alpha = 0 ✓
    // When phone points East  → alpha = 90... wait
    //
    // Actually per spec:
    // alpha = angle between device's y-axis and north, going counter-clockwise
    // = if phone points North, alpha=0
    // = if phone points East,  alpha=270 (rotated 90° clockwise = 270° CCW)
    //
    // So heading (clockwise from north) = (360 - alpha) % 360
    // BUT many Android devices report it differently.
    //
    // We'll show raw alpha in debug so you can verify.
    const onAbsolute = (raw: Event) => {
      if (destroyed) return;
      const e = raw as DeviceOrientationEvent & { absolute?: boolean };

      if (typeof e.alpha !== "number" || isNaN(e.alpha)) return;

      // Standard formula: heading = (360 - alpha) % 360
      // alpha=0 → heading=0 (North) ✓
      // alpha=270 → heading=90 (East) ✓
      // alpha=180 → heading=180 (South) ✓
      // alpha=90  → heading=270 (West) ✓
      const heading = norm(360 - e.alpha);

      processHeading(
        heading,
        `android α=${e.alpha.toFixed(1)}° → hdg=${heading.toFixed(1)}°`,
      );
    };

    // ── Setup ───────────────────────────────────────────────────
    const setup = async () => {
      if (
        typeof window === "undefined" ||
        !("DeviceOrientationEvent" in window)
      ) {
        if (!destroyed) setStatus("unavailable");
        return;
      }

      try {
        const OE = window.DeviceOrientationEvent as PermissionOE;
        if (typeof OE.requestPermission === "function") {
          const result = await OE.requestPermission();
          if (result !== "granted") {
            if (!destroyed) setStatus("unavailable");
            return;
          }
        }
      } catch {
        if (!destroyed) setStatus("unavailable");
        return;
      }

      if (destroyed) return;

      // Prefer absolute, fall back to relative (iOS uses relative)
      window.addEventListener("deviceorientationabsolute", onAbsolute, true);
      window.addEventListener("deviceorientation", onRelative, true);

      timeoutRef.current = setTimeout(() => {
        if (!hasData.current && !destroyed) setStatus("unavailable");
      }, 5000);
    };

    setup();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId.current);
      clearTimeout(timeoutRef.current);
      window.removeEventListener("deviceorientationabsolute", onAbsolute, true);
      window.removeEventListener("deviceorientation", onRelative, true);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-(--color-bg)"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--color-active-border) px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-active-bg)">
            <CompassIcon className="h-5 w-5 text-(--color-text)" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-(--color-text)">
              Compass
            </h2>
            <p className="text-xs text-(--color-gray)">
              {status === "active"
                ? "Live sensor active"
                : status === "connecting"
                  ? "Connecting to sensor…"
                  : "Sensor unavailable"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white transition hover:opacity-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              status === "active"
                ? "bg-green-500 shadow-lg shadow-green-500/40"
                : status === "connecting"
                  ? "animate-pulse bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm text-(--color-gray)">
            {status === "active"
              ? "Receiving heading data"
              : status === "connecting"
                ? "Waiting for sensor…"
                : "No compass sensor detected"}
          </span>
        </div>

        {/* Compass */}
        <div className="relative aspect-square w-full max-w-72 sm:max-w-80">
          {/* Bezel */}
          <div className="absolute inset-0 rounded-full border-4 border-(--color-active-border) bg-(--color-active-bg)" />

          {/* Fixed north triangle at top — this is where N must point */}
          <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2">
            <div className="h-4 w-4 rotate-45 rounded-sm bg-red-500 shadow-lg shadow-red-500/40" />
          </div>

          {/* Rotating dial */}
          <div
            ref={dialRef}
            className="absolute inset-3 rounded-full will-change-transform"
          >
            <div className="absolute inset-0 rounded-full border border-(--color-active-border)" />

            {TICKS.map(({ angle, major }) => (
              <div
                key={angle}
                className="absolute left-1/2 top-[6%]"
                style={{
                  height: "44%",
                  width: major ? 2 : 1,
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  transformOrigin: "50% 100%",
                }}
              >
                <div
                  className={`mx-auto rounded-full ${
                    major
                      ? "h-3.5 bg-(--color-text) opacity-70"
                      : "h-1.5 bg-(--color-gray) opacity-30"
                  }`}
                  style={{ width: major ? 2 : 1 }}
                />
              </div>
            ))}

            {DEGREE_MARKS.map((deg) => {
              const r = 37;
              const rad = ((deg - 90) * Math.PI) / 180;
              const x = 50 + r * Math.cos(rad);
              const y = 50 + r * Math.sin(rad);
              const isN = deg === 0;
              const isCardinal = [0, 90, 180, 270].includes(deg);
              const label =
                deg === 0
                  ? "N"
                  : deg === 90
                    ? "E"
                    : deg === 180
                      ? "S"
                      : deg === 270
                        ? "W"
                        : `${deg}`;

              return (
                <span
                  key={deg}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 select-none ${
                    isN
                      ? "text-sm font-bold text-red-500"
                      : isCardinal
                        ? "text-xs font-semibold text-(--color-text)"
                        : "text-[10px] text-(--color-gray)"
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {label}
                </span>
              );
            })}

            <div className="absolute inset-[24%] rounded-full border border-(--color-active-border) opacity-50" />
          </div>

          {/* 
            Fixed needle — does NOT rotate with dial
            RED half = top = points to where North IS (fixed up)
            The dial rotates under it showing which direction that is
          */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="relative h-[52%] w-1.5">
              {/* RED = top = north pointer */}
              <div className="absolute left-1/2 top-0 h-1/2 w-1.5 -translate-x-1/2 rounded-full bg-red-500 shadow-lg shadow-red-500/40" />
              {/* GRAY = bottom = south pointer */}
              <div className="absolute bottom-0 left-1/2 h-1/2 w-1.5 -translate-x-1/2 rounded-full bg-(--color-gray) opacity-60" />
            </div>
          </div>

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 z-30 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-(--color-bg) bg-(--color-text)" />
        </div>

        {/* Readout */}
        <div className="grid w-full max-w-72 grid-cols-2 gap-3 sm:max-w-80">
          <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4 text-center">
            <p className="text-xs text-(--color-gray)">Heading</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-(--color-text)">
              <span ref={degRef}>0°</span>
            </p>
          </div>
          <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4 text-center">
            <p className="text-xs text-(--color-gray)">Direction</p>
            <p className="mt-1 text-3xl font-bold text-(--color-text)">
              <span ref={dirRef}>N</span>
            </p>
          </div>
        </div>

        {/* Debug panel — keep until direction confirmed correct */}
        <div className="w-full max-w-72 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-3 sm:max-w-80">
          <p className="mb-1 text-xs font-medium text-(--color-text)">Debug</p>
          <p className="text-xs text-(--color-gray)">
            Src:{" "}
            <span ref={debugSrcRef} className="font-mono text-(--color-text)">
              waiting…
            </span>
          </p>
          <p className="mt-1 text-xs text-(--color-gray)">
            Val:{" "}
            <span ref={debugRawRef} className="font-mono text-(--color-text)">
              …
            </span>
          </p>
        </div>

        {status === "unavailable" && (
          <div className="w-full max-w-72 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:max-w-80">
            <p className="text-sm font-medium text-red-400">
              No compass sensor found
            </p>
            <p className="mt-2 text-xs leading-relaxed text-(--color-gray)">
              Requires a magnetometer. Try calibrating by moving phone in a
              figure-8 pattern.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
