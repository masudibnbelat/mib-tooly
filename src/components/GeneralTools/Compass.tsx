"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Compass as CompassIcon,
  ShieldAlert,
  Smartphone,
  X,
} from "lucide-react";

interface CompassModalProps {
  onClose: () => void;
}

type SensorState = "starting" | "granted" | "denied" | "unsupported" | "error";

type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type PermissionDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
const getDir = (deg: number) => DIRS[Math.round(deg / 45) % 8];

const TICK_COUNT = 72;
const ticks = Array.from({ length: TICK_COUNT }, (_, i) => ({
  angle: i * 5,
  major: i % 6 === 0,
}));

export const CompassModal = ({ onClose }: CompassModalProps) => {
  const [heading] = useState(0);
  const [sensorState, setSensorState] = useState<SensorState>("starting");
  const smoothHeading = useRef(0);
  const targetHeading = useRef(0);
  const rafId = useRef<number | null>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const dirRef = useRef<HTMLSpanElement>(null);

  // rAF lerp loop — updates DOM directly for perf
  const tick = useCallback(() => {
    let diff = targetHeading.current - smoothHeading.current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    smoothHeading.current += diff * 0.14;

    const h = ((smoothHeading.current % 360) + 360) % 360;
    if (needleRef.current)
      needleRef.current.style.transform = `rotate(${-h}deg)`;
    if (headingRef.current)
      headingRef.current.textContent = `${Math.round(targetHeading.current)}°`;
    if (dirRef.current)
      dirRef.current.textContent = getDir(targetHeading.current);

    // eslint-disable-next-line react-hooks/immutability
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const ios = e as IOSOrientationEvent;
    let h: number | null = null;
    if (typeof ios.webkitCompassHeading === "number") {
      h = ios.webkitCompassHeading;
    } else if (typeof e.alpha === "number") {
      h = 360 - e.alpha;
    }
    if (h === null || isNaN(h)) return;
    targetHeading.current = (h + 360) % 360;
    setSensorState("granted");
  }, []);

  const stopListener = useCallback(() => {
    window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [handleOrientation]);

  const startCompass = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setSensorState("unsupported");
      return;
    }
    try {
      const OE =
        window.DeviceOrientationEvent as PermissionDeviceOrientationEvent;
      if (typeof OE.requestPermission === "function") {
        const perm = await OE.requestPermission();
        if (perm !== "granted") {
          setSensorState("denied");
          return;
        }
      }
      stopListener();
      window.addEventListener("deviceorientation", handleOrientation, true);
    } catch {
      setSensorState("error");
    }
  }, [handleOrientation, stopListener]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startCompass();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      stopListener();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, startCompass, stopListener, tick]);

  const direction = useMemo(() => getDir(heading), [heading]);

  const StatusIcon =
    sensorState === "unsupported" ||
    sensorState === "denied" ||
    sensorState === "error"
      ? ShieldAlert
      : Smartphone;

  const statusMsg =
    sensorState === "starting"
      ? "Starting compass sensor…"
      : sensorState === "granted"
        ? "Compass is active."
        : sensorState === "denied"
          ? "Motion permission denied."
          : sensorState === "unsupported"
            ? "Compass not supported on this device."
            : "Could not start compass sensor.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-(--color-bg)"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--color-active-border) px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-active-bg)">
            <CompassIcon className="h-5 w-5 text-(--color-text)" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-(--color-text)">
              Compass
            </h2>
            <p className="hidden text-xs text-(--color-gray) sm:block">
              Real-time device orientation sensor
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-(--color-active-border) bg-red-500 text-(--color-text) transition hover:opacity-90"
          aria-label="Close compass"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-5 sm:px-6">
        {/* Stat cards */}
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
            <p className="text-xs text-(--color-gray)">Heading</p>
            <p className="mt-1 text-2xl font-semibold text-(--color-text)">
              <span ref={headingRef}>0°</span>
            </p>
          </div>
          <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
            <p className="text-xs text-(--color-gray)">Direction</p>
            <p className="mt-1 text-2xl font-semibold text-(--color-text)">
              <span ref={dirRef}>{direction}</span>
            </p>
          </div>
        </div>

        {/* Compass dial */}
        <div className="mt-6 flex w-full max-w-sm flex-1 items-center justify-center">
          <div className="relative aspect-square w-full max-w-75 sm:max-w-85">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-(--color-active-border) bg-(--color-active-bg)" />
            {/* Inner ring */}
            <div className="absolute inset-3.5 rounded-full border border-(--color-active-border)" />

            {/* Ticks — positioned with CSS rotation, no JS layout calc needed */}
            {ticks.map(({ angle, major }) => (
              <div
                key={angle}
                aria-hidden="true"
                className="absolute left-1/2 top-[8%] origin-[50%_100%] -translate-x-1/2"
                style={{
                  height: "42%",
                  width: major ? 2 : 1,
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  transformOrigin: "50% 100%",
                }}
              >
                <div
                  className={`mx-auto rounded-full ${
                    major
                      ? "h-3 bg-(--color-text) opacity-80"
                      : "h-1.25 bg-(--color-gray) opacity-40"
                  }`}
                  style={{ width: major ? 2 : 1 }}
                />
              </div>
            ))}

            {/* Cardinal labels */}
            <span className="absolute left-1/2 top-2.5 -translate-x-1/2 text-sm font-bold text-red-500">
              N
            </span>
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-xs font-medium text-(--color-text)">
              S
            </span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-(--color-text)">
              E
            </span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-(--color-text)">
              W
            </span>

            {/* Needle */}
            <div
              ref={needleRef}
              className="absolute inset-0 rounded-full will-change-transform"
            >
              {/* North — red */}
              <div className="absolute left-1/2 top-[17%] h-[32%] w-0.75 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
              {/* South — muted */}
              <div className="absolute bottom-[17%] left-1/2 h-[32%] w-0.75 -translate-x-1/2 rounded-full bg-(--color-gray)" />
            </div>

            {/* Center pivot */}
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-(--color-bg) bg-(--color-text)" />
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 w-full max-w-sm">
          <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-(--color-text)" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-(--color-text)">{statusMsg}</p>
                <p className="mt-1 text-xs text-(--color-gray)">
                  Best on mobile + HTTPS. Hold phone flat for accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
