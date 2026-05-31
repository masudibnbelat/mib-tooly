"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScanLine,
  X,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Flashlight,
  FlashlightOff,
} from "lucide-react";
import jsQR from "jsqr";

type ScanState = "idle" | "scanning" | "success" | "error";
interface ScanResult {
  data: string;
}

const isURL = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ScanFrame = ({ state }: { state: ScanState }) => (
  <div className="absolute inset-0 pointer-events-none">
    {(["tl", "tr", "bl", "br"] as const).map((corner) => (
      <motion.div
        key={corner}
        className="absolute w-10 h-10"
        style={{
          top: corner.startsWith("t") ? "10%" : "auto",
          bottom: corner.startsWith("b") ? "10%" : "auto",
          left: corner.endsWith("l") ? "10%" : "auto",
          right: corner.endsWith("r") ? "10%" : "auto",
          borderTop: corner.startsWith("t")
            ? "3px solid var(--scan-accent)"
            : "none",
          borderBottom: corner.startsWith("b")
            ? "3px solid var(--scan-accent)"
            : "none",
          borderLeft: corner.endsWith("l")
            ? "3px solid var(--scan-accent)"
            : "none",
          borderRight: corner.endsWith("r")
            ? "3px solid var(--scan-accent)"
            : "none",
        }}
        animate={state === "success" ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.4 }}
      />
    ))}
    <AnimatePresence>
      {state === "scanning" && (
        <motion.div
          className="absolute left-[10%] right-[10%] h-0.5 rounded-full"
          style={{
            background: "var(--scan-accent)",
            boxShadow: "0 0 12px var(--scan-accent)",
          }}
          initial={{ top: "10%", opacity: 0 }}
          animate={{ top: ["10%", "90%", "10%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  </div>
);

const ResultCard = ({
  result,
  onReset,
}: {
  result: ScanResult;
  onReset: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-5 space-y-4"
    >
      <div>
        <p className="text-xs font-medium text-(--color-gray) uppercase tracking-widest mb-1.5">
          Data Detected
        </p>
        <p className="text-sm text-(--color-text) break-all leading-relaxed font-mono">
          {result.data}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-(--color-active-border) bg-(--color-bg) text-(--color-text)"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy"}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-(--color-active-border) bg-(--color-bg) text-(--color-text)"
        >
          <RefreshCw className="w-4 h-4" /> Scan Again
        </motion.button>
      </div>
    </motion.div>
  );
};

export const QRScannerModal = ({ onClose }: { onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);
  const scanFrameRef = useRef<() => void>(() => {});

  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [torch, setTorch] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    torchTrackRef.current = null;
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrameRef.current);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      const data = code.data;
      stopCamera();
      if (isURL(data)) {
        // Link হলে সাথে সাথে open করে modal বন্ধ
        window.open(data, "_blank", "noopener,noreferrer");
        onClose();
      } else {
        // Text হলে result card দেখাও
        setResult({ data });
        setState("success");
      }
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrameRef.current);
  }, [stopCamera, onClose]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    setError("");
    setResult(null);
    setState("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      torchTrackRef.current = track;
      const caps = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      setTorchSupported(!!caps.torch);
      rafRef.current = requestAnimationFrame(scanFrameRef.current);
    } catch {
      setState("error");
      setError("Camera access denied. Please allow camera permission.");
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = torchTrackRef.current;
    if (!track) return;
    const next = !torch;
    await (
      track.applyConstraints as (
        c: MediaTrackConstraints & { advanced?: { torch?: boolean }[] },
      ) => Promise<void>
    )({ advanced: [{ torch: next }] });
    setTorch(next);
  }, [torch]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col h-full bg-(--color-bg)">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-active-border) shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(34,211,238,0.15)" }}
          >
            <QrCode
              className="w-4 h-4"
              style={{ color: "var(--scan-accent)" }}
            />
          </div>
          <div>
            <h2 className="text-base font-semibold text-(--color-text)">
              QR Scanner
            </h2>
            <p className="text-xs text-(--color-gray)">
              Link → auto open • Text → show result
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text)"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Viewfinder */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-(--color-active-border)">
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: state === "scanning" ? "block" : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          <AnimatePresence>
            {state === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: "var(--color-active-bg)" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ScanLine className="w-16 h-16 text-(--color-gray)" />
                </motion.div>
                <p className="text-sm text-(--color-gray) text-center px-8">
                  Tap the button below to start scanning
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {state === "success" && (
              <motion.div
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: "var(--scan-accent)" }}
              />
            )}
          </AnimatePresence>

          {(state === "scanning" || state === "success") && (
            <ScanFrame state={state} />
          )}

          <AnimatePresence>
            {state === "scanning" && torchSupported && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTorch}
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm text-white"
              >
                {torch ? (
                  <FlashlightOff className="w-4 h-4" />
                ) : (
                  <Flashlight className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {state === "scanning" && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  stopCamera();
                  setState("idle");
                }}
                className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm text-white"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        <AnimatePresence>
          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result — only for non-URL text */}
        <AnimatePresence>
          {result && state === "success" && (
            <ResultCard result={result} onReset={startCamera} />
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence mode="wait">
          {state !== "scanning" && (
            <motion.button
              key="start"
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              whileTap={{ scale: 0.97 }}
              onClick={startCamera}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-semibold text-(--color-bg)"
              style={{ background: "var(--scan-accent)" }}
            >
              <ScanLine className="w-5 h-5" />
              {state === "success" ? "Scan Another" : "Start Scanning"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

const QRCodeScanner = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <style>{`:root { --scan-accent: #22d3ee; } [data-theme="dark"] { --scan-accent: #22d3ee; }`}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="absolute inset-0 overflow-hidden shadow-2xl"
        >
          <QRScannerModal onClose={onClose} />
        </motion.div>
      </motion.div>
    </>
  );
};

export default QRCodeScanner;
