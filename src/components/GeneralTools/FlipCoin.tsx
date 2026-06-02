"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins, X, Edit2, Check } from "lucide-react";

interface FlipCoinProps {
  onClose: () => void;
}

type HistoryItem = {
  id: number;
  value: string;
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

const truncateLabel = (label: string, max = 8) =>
  label.length > max ? label.slice(0, max - 1) + "…" : label;

const DEFAULT_SIDES = ["Heads", "Tails"];

const FlipCoinModal = ({ onClose }: FlipCoinProps) => {
  const [sides, setSides] = useState<string[]>(DEFAULT_SIDES);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const [result, setResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [spinAngle, setSpinAngle] = useState(0);
  const [landed, setLanded] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const landedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlippingRef = useRef(false);
  const nextIdRef = useRef(1);
  const editInputRef = useRef<HTMLInputElement>(null);

  const sideCounts = sides.map(
    (s) => history.filter((h) => h.value === s).length,
  );

  const flip = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    const outcomeIndex = Math.floor(Math.random() * 2);
    const outcome = sides[outcomeIndex];
    const extraTurns = 5 + Math.floor(Math.random() * 4);

    setIsFlipping(true);
    setResult(null);
    setLanded(false);

    playFlipSound();

    setSpinAngle((prev) => {
      const normalized = ((prev % 360) + 360) % 360;
      const target = outcomeIndex * 180;
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
      landedTimeoutRef.current = setTimeout(() => setLanded(false), 500);
    }, 1500);
  }, [sides]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpinAngle(0);
    setResult(null);
    setLanded(false);
  }, [sides]);

  useEffect(() => {
    const scrollY = window.scrollY;
    const prevBodyStyle = document.body.style.cssText;
    const prevHtmlStyle = document.documentElement.style.cssText;
    document.body.style.cssText = `
      overflow: hidden !important;
      position: fixed !important;
      top: -${scrollY}px;
      left: 0; right: 0; width: 100%;
      touch-action: none;
    `;
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEditor) setShowEditor(false);
        else onClose();
      }
      if (
        (e.key === " " || e.key === "Enter") &&
        document.activeElement === document.body
      ) {
        e.preventDefault();
        flip();
      }
    };

    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const modal = document.getElementById("flip-coin-modal-content");
      if (modal && !modal.contains(target)) e.preventDefault();
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
  }, [onClose, flip, showEditor]);

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditValue(sides[i]);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const commitEdit = (i: number) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== sides[i]) {
      setSides((prev) => prev.map((s, idx) => (idx === i ? trimmed : s)));
      setHistory((h) =>
        h.map((item) =>
          item.value === sides[i] ? { ...item, value: trimmed } : item,
        ),
      );
    }
    setEditingIndex(null);
  };

  const resetToDefault = () => {
    setSides(DEFAULT_SIDES);
    setHistory([]);
    setFlipCount(0);
    setResult(null);
    setSpinAngle(0);
    setLanded(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-200000000 h-dvh w-screen bg-black/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        id="flip-coin-modal-content"
        className="flex h-dvh w-screen flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-(--color-bg)"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-between px-5 pt-5 pb-3 bg-(--color-bg)/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--color-active-bg)">
              <Coins className="h-5 w-5 text-(--color-text)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--color-text)">
                Flip a Coin
              </h2>
              <p className="text-xs text-(--color-gray)">Touch coin to flip</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit sides toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowEditor((v) => !v)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-all"
              style={{
                border: "1.5px solid var(--color-active-border)",
                backgroundColor: showEditor
                  ? "var(--color-text)"
                  : "var(--color-active-bg)",
                color: showEditor ? "var(--color-bg)" : "var(--color-text)",
              }}
            >
              {showEditor ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Done
                </>
              ) : (
                <>
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Sides
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105 active:scale-95"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Side editor panel - Only 2 sides */}
        <AnimatePresence mode="wait">
          {showEditor && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full px-5 pb-4"
            >
              <div
                className="w-full rounded-2xl p-4 shadow-lg"
                style={{
                  border: "1.5px solid var(--color-active-border)",
                  backgroundColor: "var(--color-active-bg)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-(--color-text)">
                      Customize Coin Sides
                    </span>
                    <p className="text-xs text-(--color-gray) mt-0.5">
                      Edit the labels for both sides
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetToDefault}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-(--color-gray) transition-all hover:bg-(--color-bg)"
                  >
                    Reset
                  </button>
                </div>

                {/* Side list - Fixed 2 sides */}
                <div className="space-y-2">
                  {sides.map((side, i) => (
                    <motion.div
                      key={`side-${i}`}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-(--color-text)"
                        style={{
                          border: "1.5px solid var(--color-active-border)",
                          backgroundColor: "var(--color-bg)",
                        }}
                      >
                        {i + 1}
                      </div>
                      {editingIndex === i ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(i)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(i);
                              if (e.key === "Escape") setEditingIndex(null);
                            }}
                            maxLength={20}
                            className="h-9 flex-1 rounded-lg bg-(--color-bg) px-3 text-sm font-medium text-(--color-text) outline-none ring-2 ring-(--color-text)"
                            style={{
                              border: "1.5px solid var(--color-text)",
                            }}
                            autoFocus
                          />
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => commitEdit(i)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--color-text) text-(--color-bg)"
                          >
                            <Check className="h-4 w-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(i)}
                          className="h-9 flex-1 cursor-text rounded-lg px-3 text-left text-sm font-medium text-(--color-text) transition-all hover:bg-(--color-bg)"
                          style={{
                            border: "1.5px solid var(--color-active-border)",
                          }}
                        >
                          {side}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coin area */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-8">
          {/* Ambient glow */}
          <motion.div
            className="pointer-events-none absolute h-64 w-64 rounded-full blur-[100px]"
            animate={{
              background: result
                ? "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)"
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
                className="relative h-40 w-40 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-(--color-text)/30 disabled:cursor-not-allowed sm:h-52 sm:w-52"
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

                {/* Face 0 — front */}
                <CoinFaceLayer
                  label={sides[0] ?? ""}
                  rotateX={0}
                  gradient="linear-gradient(145deg, var(--color-bg) 0%, var(--color-active-bg) 50%, var(--color-bg) 100%)"
                  highlightPos="left"
                />

                {/* Face 1 — back */}
                <CoinFaceLayer
                  label={sides[1] ?? ""}
                  rotateX={180}
                  gradient="linear-gradient(145deg, var(--color-active-bg) 0%, var(--color-bg) 50%, var(--color-active-bg) 100%)"
                  highlightPos="right"
                />
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
                  className="text-sm font-medium text-(--color-gray)"
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
                    className="text-3xl font-bold text-(--color-text) sm:text-4xl"
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 14 }}
                  >
                    {result}!
                  </motion.p>
                  <p className="text-xs text-(--color-gray)">
                    Flip #{flipCount}
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm text-(--color-gray)"
                >
                  Touch the coin to flip
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom: history & stats - Only show if history exists */}
        {history.length > 0 && (
          <div
            className="w-full shrink-0 px-5 py-4"
            style={{ borderTop: "1px solid var(--color-active-border)" }}
          >
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
                {sides.map((side, i) => (
                  <span key={side} className="text-(--color-gray)">
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {sideCounts[i]}
                    </span>{" "}
                    {side}
                  </span>
                ))}
                <span
                  className="text-(--color-gray)"
                  style={{
                    borderLeft: "1px solid var(--color-active-border)",
                    paddingLeft: "1.25rem",
                  }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {flipCount}
                  </span>{" "}
                  Total
                </span>
              </div>

              {/* Recent flips */}
              <div className="flex flex-wrap gap-1.5">
                {history.slice(0, 20).map((item) => (
                  <motion.span
                    key={item.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-(--color-text)"
                    style={{
                      border: "1px solid var(--color-active-border)",
                      backgroundColor: "var(--color-active-bg)",
                    }}
                  >
                    {item.value}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Coin face sub-component ───────────────────────────────────────────────
interface CoinFaceLayerProps {
  label: string;
  rotateX: number;
  gradient: string;
  highlightPos: "left" | "right";
}

const CoinFaceLayer = ({
  label,
  rotateX,
  gradient,
  highlightPos,
}: CoinFaceLayerProps) => {
  const short = truncateLabel(label, 9);
  const fontSize =
    short.length <= 2
      ? "text-5xl sm:text-7xl"
      : short.length <= 5
        ? "text-3xl sm:text-4xl"
        : "text-xl sm:text-2xl";

  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: `rotateX(${rotateX}deg) translateZ(2px)`,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "2px solid var(--color-active-border)",
          background: gradient,
          boxShadow:
            "inset 0 6px 24px rgba(255,255,255,0.22), inset 0 -8px 20px rgba(0,0,0,0.1), 0 20px 50px rgba(0,0,0,0.2)",
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
      {/* Highlight */}
      <div
        className={`absolute top-[10%] h-[32%] w-[32%] rounded-full bg-white/20 blur-2xl dark:bg-white/10 ${highlightPos === "left" ? "left-[14%]" : "right-[14%]"}`}
      />
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3">
        <span
          className={`${fontSize} font-black text-(--color-text) leading-none text-center`}
        >
          {short}
        </span>
      </div>
    </div>
  );
};

export default FlipCoinModal;
