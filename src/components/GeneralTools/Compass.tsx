"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const targetH = useRef(0);
  const smoothH = useRef(0);
  const raf = useRef<number>(0);
  const alive = useRef(false);

  const render = useCallback(() => {
    const diff = shortDiff(smoothH.current, targetH.current);
    smoothH.current = norm(smoothH.current + diff * 0.12);

    if (dialRef.current)
      dialRef.current.style.transform = `rotate(${-smoothH.current}deg)`;

    const rounded = Math.round(norm(targetH.current));
    if (degRef.current) degRef.current.textContent = `${rounded}°`;
    if (dirRef.current) dirRef.current.textContent = getDir(rounded);

    // eslint-disable-next-line react-hooks/immutability
    raf.current = requestAnimationFrame(render);
  }, []);

  const onSensor = useCallback((raw: Event) => {
    const e = raw as DeviceOrientationEvent;
    const ios = e as IOSOrientationEvent;

    let h: number | null = null;
    if (typeof ios.webkitCompassHeading === "number")
      h = ios.webkitCompassHeading;
    else if (typeof e.alpha === "number") h = 360 - e.alpha;

    if (h === null || Number.isNaN(h)) return;

    targetH.current = norm(h);

    if (!alive.current) {
      alive.current = true;
      setStatus("active");
    }
  }, []);

  const cleanup = useCallback(() => {
    window.removeEventListener("deviceorientationabsolute", onSensor, true);
    window.removeEventListener("deviceorientation", onSensor, true);
  }, [onSensor]);

  const start = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setStatus("unavailable");
      return;
    }

    try {
      const OE = window.DeviceOrientationEvent as PermissionOE;
      if (typeof OE.requestPermission === "function") {
        const p = await OE.requestPermission();
        if (p !== "granted") {
          setStatus("unavailable");
          return;
        }
      }

      cleanup();
      window.addEventListener("deviceorientationabsolute", onSensor, true);
      window.addEventListener("deviceorientation", onSensor, true);

      setTimeout(() => {
        if (!alive.current) setStatus("unavailable");
      }, 3000);
    } catch {
      setStatus("unavailable");
    }
  }, [onSensor, cleanup]);

  useEffect(() => {
    raf.current = requestAnimationFrame(render);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOF = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      cleanup();
      cancelAnimationFrame(raf.current);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOF;
    };
  }, [render, start, cleanup, onClose]);

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
        {/* Status dot */}
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
          {/* Outer bezel */}
          <div className="absolute inset-0 rounded-full border-4 border-(--color-active-border) bg-(--color-active-bg)" />

          {/* Fixed north marker at top */}
          <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2">
            <div className="h-4 w-4 rotate-45 rounded-sm bg-red-500 shadow-lg shadow-red-500/40" />
          </div>

          {/* Rotating dial */}
          <div
            ref={dialRef}
            className="absolute inset-3 rounded-full will-change-transform"
          >
            <div className="absolute inset-0 rounded-full border border-(--color-active-border)" />

            {/* Tick marks */}
            {TICKS.map(({ angle, major }) => (
              <div
                key={angle}
                className="absolute left-1/2 top-[6%] -translate-x-1/2"
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

            {/* Degree labels around dial */}
            {DEGREE_MARKS.map((deg) => {
              const r = 37;
              const rad = ((deg - 90) * Math.PI) / 180;
              const x = 50 + r * Math.cos(rad);
              const y = 50 + r * Math.sin(rad);

              const isN = deg === 0;
              const isCardinal = [0, 90, 180, 270].includes(deg);
              const label = isN
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${
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

            {/* Inner ring */}
            <div className="absolute inset-[24%] rounded-full border border-(--color-active-border) opacity-50" />
          </div>

          {/* Fixed needle — always points up */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="relative h-[52%] w-1">
              <div className="absolute left-1/2 top-0 h-1/2 w-1 -translate-x-1/2 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
              <div className="absolute bottom-0 left-1/2 h-1/2 w-1 -translate-x-1/2 rounded-full bg-(--color-gray) opacity-50" />
            </div>
          </div>

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 z-30 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-(--color-bg) bg-(--color-text)" />
        </div>

        {/* Heading + Direction */}
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

        {/* Help text for unavailable */}
        {status === "unavailable" && (
          <div className="w-full max-w-72 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:max-w-80">
            <p className="text-sm font-medium text-red-400">
              No compass sensor found
            </p>
            <p className="mt-2 text-xs leading-relaxed text-(--color-gray)">
              Compass needs a magnetometer sensor which is only available on
              mobile phones. To test on desktop, open Chrome DevTools → More
              Tools → Sensors → change Alpha value.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
