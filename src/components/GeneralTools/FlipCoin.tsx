"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins, X } from "lucide-react";

interface FlipCoinProps {
  onClose: () => void;
}

type CoinFace = "heads" | "tails" | null;

type HistoryItem = {
  id: number;
  value: "heads" | "tails";
};

let sharedAudioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContext();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

const playFlipSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    noise.buffer = buf;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    noise.connect(bandpass).connect(noiseGain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.3);

    [0.05, 0.12, 0.2, 0.28, 0.38, 0.5, 0.65, 0.85].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 2200 + Math.random() * 600;
      const vol = 0.06 * Math.pow(0.82, i);
      g.gain.setValueAtTime(vol, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.04);
      osc.connect(g).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.04);
    });
  } catch {
    /* silent */
  }
};

const playLandSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);

    [0.08, 0.14].forEach((t) => {
      const o = ctx.createOscillator();
      const gg = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 350;
      gg.gain.setValueAtTime(0.06, ctx.currentTime + t);
      gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.06);
      o.connect(gg).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.06);
    });
  } catch {
    /* silent */
  }
};

const FlipCoinModal = ({ onClose }: FlipCoinProps) => {
  const [result, setResult] = useState<CoinFace>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [spinAngle, setSpinAngle] = useState(0);
  const [landed, setLanded] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const landedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlippingRef = useRef(false);
  const nextIdRef = useRef(1);

  const headsCount = history.filter((h) => h.value === "heads").length;
  const tailsCount = history.length - headsCount;

  const flip = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    const outcome: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
    const extraTurns = 5 + Math.floor(Math.random() * 4);

    setIsFlipping(true);
    setResult(null);
    setLanded(false);

    playFlipSound();

    setSpinAngle((prev) => {
      const normalized = ((prev % 360) + 360) % 360;
      const target = outcome === "heads" ? 0 : 180;
      let delta = target - normalized;
      if (delta < 0) delta += 360;
      return prev + extraTurns * 360 + delta;
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (landedTimeoutRef.current) clearTimeout(landedTimeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      playLandSound();
      setResult(outcome);
      setIsFlipping(false);
      isFlippingRef.current = false;
      setLanded(true);
      setFlipCount((c) => c + 1);

      const id = nextIdRef.current++;
      setHistory((h) => [{ id, value: outcome }, ...h].slice(0, 30));

      landedTimeoutRef.current = setTimeout(() => {
        setLanded(false);
      }, 500);
    }, 1500);
  }, []);

  // Lock body scroll completely
  useEffect(() => {
    const scrollY = window.scrollY;
    const prevBodyStyle = document.body.style.cssText;
    const prevHtmlStyle = document.documentElement.style.cssText;

    // Lock everything
    document.body.style.cssText = `
      overflow: hidden !important;
      position: fixed !important;
      top: -${scrollY}px;
      left: 0;
      right: 0;
      width: 100%;
      touch-action: none;
    `;
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      }
    };

    // Block touch scroll on background
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const modalContent = document.getElementById("flip-coin-modal-content");
      if (modalContent && !modalContent.contains(target)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.body.style.cssText = prevBodyStyle;
      document.documentElement.style.cssText = prevHtmlStyle;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", preventScroll);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (landedTimeoutRef.current) clearTimeout(landedTimeoutRef.current);
      isFlippingRef.current = false;
    };
  }, [onClose, flip]);

  return (
    <motion.div
      className="fixed inset-0 z-[200000000] h-[100dvh] w-[100vw] bg-black/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        id="flip-coin-modal-content"
        className="flex h-[100dvh] w-[100vw] flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-[var(--color-bg)]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* Close */}
        <div className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-active-bg)]">
              <Coins className="h-5 w-5 text-[var(--color-text)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Flip a Coin
              </h2>
              <p className="text-xs text-[var(--color-gray)]">
                Tap the coin or press Space
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--color-active-bg)] text-[var(--color-gray)] transition-colors hover:bg-[var(--color-active-border)] hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Coin area */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-8">
          {/* Ambient glow */}
          <motion.div
            className="pointer-events-none absolute h-64 w-64 rounded-full blur-[100px]"
            animate={{
              background: result
                ? result === "heads"
                  ? "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(128,128,128,0.08) 0%, transparent 70%)",
            }}
            transition={{ duration: 0.6 }}
          />

          {/* 3D Coin */}
          <div style={{ perspective: 1200 }}>
            <motion.div
              animate={
                isFlipping
                  ? {
                      y: [0, -30, -120, -180, -160, -100, -40, 0, -8, 0],
                      scale: [
                        1, 1.02, 1.06, 1.08, 1.06, 1.04, 1.02, 1, 1.01, 1,
                      ],
                    }
                  : landed
                    ? { y: [0, -5, 0, -2, 0], scale: [1, 1.02, 1, 1.005, 1] }
                    : { y: 0, scale: 1 }
              }
              transition={
                isFlipping
                  ? { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
                  : landed
                    ? { duration: 0.4, ease: "easeOut" }
                    : { duration: 0.3 }
              }
            >
              <motion.button
                type="button"
                onClick={flip}
                disabled={isFlipping}
                aria-label="Flip coin"
                className="relative h-40 w-40 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/30 disabled:cursor-not-allowed sm:h-52 sm:w-52"
                style={{ transformStyle: "preserve-3d" }}
                animate={{
                  rotateX: spinAngle,
                  rotateZ: isFlipping ? [0, 4, -3, 2, -1, 0] : 0,
                }}
                transition={{
                  rotateX: { duration: 1.5, ease: [0.08, 0.82, 0.17, 1] },
                  rotateZ: { duration: 1.5, ease: "easeOut" },
                }}
                whileHover={
                  !isFlipping ? { scale: 1.05, rotateZ: 2 } : undefined
                }
                whileTap={!isFlipping ? { scale: 0.95 } : undefined}
              >
                {/* Edge layers */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`edge-${i}`}
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      transform: `translateZ(${-1 - i * 0.6}px)`,
                      opacity: 0.25 - i * 0.03,
                      background:
                        "linear-gradient(135deg, var(--color-active-bg) 0%, var(--color-bg) 100%)",
                      border: "1px solid var(--color-active-border)",
                    }}
                  />
                ))}

                {/* Heads face */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "translateZ(2px)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: "2px solid var(--color-active-border)",
                      background:
                        "linear-gradient(145deg, var(--color-bg) 0%, var(--color-active-bg) 50%, var(--color-bg) 100%)",
                      boxShadow:
                        "inset 0 6px 24px rgba(255,255,255,0.25), inset 0 -8px 20px rgba(0,0,0,0.1), 0 20px 50px rgba(0,0,0,0.2)",
                    }}
                  />
                  <div
                    className="absolute inset-2 rounded-full opacity-50"
                    style={{ border: "1px solid var(--color-active-border)" }}
                  />
                  <div
                    className="absolute inset-4 rounded-full opacity-25"
                    style={{ border: "1px solid var(--color-active-border)" }}
                  />
                  <div className="absolute left-[15%] top-[10%] h-[35%] w-[35%] rounded-full bg-white/20 blur-2xl dark:bg-white/10" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span className="text-5xl font-black text-[var(--color-text)] sm:text-7xl">
                      H
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-[var(--color-gray)] sm:text-[10px]">
                      Heads
                    </span>
                  </div>
                </div>

                {/* Tails face */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateX(180deg) translateZ(2px)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: "2px solid var(--color-active-border)",
                      background:
                        "linear-gradient(145deg, var(--color-active-bg) 0%, var(--color-bg) 50%, var(--color-active-bg) 100%)",
                      boxShadow:
                        "inset 0 6px 24px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.12), 0 20px 50px rgba(0,0,0,0.2)",
                    }}
                  />
                  <div
                    className="absolute inset-2 rounded-full opacity-50"
                    style={{ border: "1px solid var(--color-active-border)" }}
                  />
                  <div
                    className="absolute inset-4 rounded-full opacity-25"
                    style={{ border: "1px solid var(--color-active-border)" }}
                  />
                  <div className="absolute right-[15%] top-[10%] h-[30%] w-[30%] rounded-full bg-white/15 blur-2xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span className="text-5xl font-black text-[var(--color-text)] sm:text-7xl">
                      T
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-[var(--color-gray)] sm:text-[10px]">
                      Tails
                    </span>
                  </div>
                </div>
              </motion.button>
            </motion.div>

            {/* Shadow */}
            <motion.div
              className="pointer-events-none mx-auto mt-3 h-5 w-28 rounded-full blur-xl sm:w-36"
              style={{ backgroundColor: "var(--color-text)" }}
              animate={
                isFlipping
                  ? {
                      scaleX: [1, 1.4, 0.5, 0.3, 0.4, 0.7, 1, 1.1, 1],
                      opacity: [
                        0.1, 0.06, 0.02, 0.01, 0.02, 0.05, 0.1, 0.12, 0.1,
                      ],
                    }
                  : landed
                    ? { scaleX: [1.15, 1], opacity: [0.14, 0.1] }
                    : { scaleX: 1, opacity: 0.1 }
              }
              transition={
                isFlipping
                  ? { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
                  : { duration: 0.4, ease: "easeOut" }
              }
            />
          </div>

          {/* Result text */}
          <div className="mt-6 flex flex-col items-center gap-3 sm:mt-10">
            <AnimatePresence mode="wait">
              {isFlipping ? (
                <motion.p
                  key="flipping"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm font-medium text-[var(--color-gray)]"
                >
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Coin is in the air…
                  </motion.span>
                </motion.p>
              ) : result ? (
                <motion.div
                  key={`result-${flipCount}`}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex flex-col items-center gap-1"
                >
                  <motion.p
                    className="text-3xl font-bold text-[var(--color-text)] sm:text-4xl"
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 14 }}
                  >
                    {result === "heads" ? "Heads!" : "Tails!"}
                  </motion.p>
                  <p className="text-xs text-[var(--color-gray)]">
                    Flip #{flipCount}
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm text-[var(--color-gray)]"
                >
                  Tap the coin to flip
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={flip}
              disabled={isFlipping}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="mt-1 inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl px-8 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                border: "1px solid var(--color-active-border)",
                backgroundColor: "var(--color-active-bg)",
                color: "var(--color-text)",
              }}
            >
              {isFlipping
                ? "Flipping…"
                : flipCount === 0
                  ? "Flip Coin"
                  : "Flip Again"}
            </motion.button>
          </div>
        </div>

        {/* Bottom: history & stats */}
        <div
          className="w-full shrink-0 px-5 py-4"
          style={{ borderTop: "1px solid var(--color-active-border)" }}
        >
          {history.length === 0 ? (
            <p className="text-center text-xs text-[var(--color-gray)]">
              Your flip history will appear here
            </p>
          ) : (
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex items-center justify-center gap-6 text-xs">
                <span className="text-[var(--color-gray)]">
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {headsCount}
                  </span>{" "}
                  Heads
                </span>
                <span style={{ color: "var(--color-active-border)" }}>•</span>
                <span className="text-[var(--color-gray)]">
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {tailsCount}
                  </span>{" "}
                  Tails
                </span>
                <span style={{ color: "var(--color-active-border)" }}>•</span>
                <span className="text-[var(--color-gray)]">
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {flipCount}
                  </span>{" "}
                  Total
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlipCoinModal;
