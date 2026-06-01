"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileUp,
  Download,
  Shield,
  ShieldCheck,
  Trash2,
  ArrowRightLeft,
  KeyRound,
  FileText,
  AlertTriangle,
} from "lucide-react";

// ─── Crypto Utilities ───────────────────────────────────────────────

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toFixedBuffer(u8: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(
    u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength),
  ) as Uint8Array<ArrayBuffer>;
}

async function encryptText(
  plaintext: string,
  password: string,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(
    new Uint8Array(16),
  ) as Uint8Array<ArrayBuffer>;
  const iv = crypto.getRandomValues(
    new Uint8Array(12),
  ) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(password, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  const cipher = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(salt.length + iv.length + cipher.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipher, salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(encoded: string, password: string): Promise<string> {
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = toFixedBuffer(raw.slice(0, 16));
  const iv = toFixedBuffer(raw.slice(16, 28));
  const cipher = toFixedBuffer(raw.slice(28));
  const key = await deriveKey(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher,
  );
  return new TextDecoder().decode(plainBuffer);
}

async function encryptFile(
  file: File,
  password: string,
): Promise<{ encrypted: Uint8Array<ArrayBuffer>; fileName: string }> {
  const salt = crypto.getRandomValues(
    new Uint8Array(16),
  ) as Uint8Array<ArrayBuffer>;
  const iv = crypto.getRandomValues(
    new Uint8Array(12),
  ) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(password, salt);
  const fileBuffer = await file.arrayBuffer();
  const enc = new TextEncoder();
  const nameBytes = enc.encode(file.name);
  const nameLen = new Uint8Array(4);
  new DataView(nameLen.buffer).setUint32(0, nameBytes.length);
  const payload = new Uint8Array(
    nameLen.length + nameBytes.length + fileBuffer.byteLength,
  );
  payload.set(nameLen, 0);
  payload.set(nameBytes, 4);
  payload.set(new Uint8Array(fileBuffer), 4 + nameBytes.length);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    toFixedBuffer(payload),
  );
  const cipher = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(salt.length + iv.length + cipher.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipher, salt.length + iv.length);
  return { encrypted: combined, fileName: file.name + ".enc" };
}

async function decryptFile(
  file: File,
  password: string,
): Promise<{ decrypted: Uint8Array<ArrayBuffer>; fileName: string }> {
  const raw = new Uint8Array(await file.arrayBuffer());
  const salt = toFixedBuffer(raw.slice(0, 16));
  const iv = toFixedBuffer(raw.slice(16, 28));
  const cipher = toFixedBuffer(raw.slice(28));
  const key = await deriveKey(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher,
  );
  const plain = new Uint8Array(plainBuffer);
  const nameLen = new DataView(plain.buffer).getUint32(0);
  const nameBytes = plain.slice(4, 4 + nameLen);
  const fileName = new TextDecoder().decode(nameBytes);
  const fileData = plain.slice(4 + nameLen);
  return { decrypted: fileData, fileName };
}

function downloadBlob(data: Uint8Array<ArrayBuffer>, fileName: string) {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── Types ──────────────────────────────────────────────────────────

type TabId = "text" | "file";

interface EncryptorProps {
  onClose: () => void;
}

// ─── Main Component ─────────────────────────────────────────────────

const Encryptor = ({ onClose }: EncryptorProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("text");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const tabs: { id: TabId; label: string; icon: typeof Lock }[] = [
    { id: "text", label: "Text", icon: KeyRound },
    { id: "file", label: "File", icon: FileText },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-(--color-bg)"
      initial={{ opacity: 0, y: 50, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      {/* ── Header ── */}
      <motion.div
        className="flex shrink-0 items-center justify-between border-b border-(--color-active-border) px-4 py-3 sm:px-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--color-active-bg)"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 14,
              delay: 0.12,
            }}
          >
            <Shield className="h-5 w-5 text-(--color-text)" />
          </motion.div>
          <h2 className="text-lg font-semibold text-(--color-text)">
            Encryptor / Decryptor
          </h2>
        </div>

        <motion.button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-5 w-5" />
        </motion.button>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        className="flex shrink-0 gap-1 border-b border-(--color-active-border) px-4 pt-2 sm:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16 }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-(--color-text)"
                  : "text-(--color-gray) hover:text-(--color-text)"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-(--color-text)"
                  layoutId="encryptor-tab-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <AnimatePresence mode="wait">
          {activeTab === "text" ? (
            <motion.div
              key="text-panel"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
            >
              <TextEncryptPanel />
            </motion.div>
          ) : (
            <motion.div
              key="file-panel"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
            >
              <FileEncryptPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Text Encrypt Panel ─────────────────────────────────────────────

function TextEncryptPanel() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = useCallback(async () => {
    if (!input.trim()) {
      setError("Please enter text.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "encrypt"
          ? await encryptText(input, password)
          : await decryptText(input.trim(), password);
      setOutput(result);
    } catch {
      setError(
        mode === "decrypt"
          ? "Decryption failed. Wrong password or corrupted data."
          : "Encryption failed.",
      );
      setOutput("");
    } finally {
      setLoading(false);
    }
  }, [input, password, mode]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleSwap = useCallback(() => {
    setMode((m) => (m === "encrypt" ? "decrypt" : "encrypt"));
    setInput(output);
    setOutput("");
    setError("");
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setPassword("");
    setError("");
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-1">
          {(["encrypt", "decrypt"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setOutput("");
                setError("");
              }}
              className={`relative z-10 flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? "text-(--color-text)"
                  : "text-(--color-gray) hover:text-(--color-text)"
              }`}
            >
              {m === "encrypt" ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {m === "encrypt" ? "Encrypt" : "Decrypt"}
              {mode === m && (
                <motion.div
                  className="absolute inset-0 rounded-lg border border-(--color-active-border) bg-(--color-bg)"
                  layoutId="text-mode-pill"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={handleSwap}
          disabled={!output}
          title="Swap output → input & toggle mode"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-active-border) text-(--color-gray) transition-colors hover:bg-(--color-active-bg) hover:text-(--color-text) disabled:cursor-not-allowed disabled:opacity-30"
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </motion.button>

        <motion.button
          type="button"
          onClick={handleClear}
          title="Clear all"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-active-border) text-(--color-gray) transition-colors hover:bg-red-500/10 hover:text-red-500"
          whileTap={{ scale: 0.85 }}
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-(--color-gray)">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password…"
            className="w-full rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 pr-12 text-sm text-(--color-text) outline-none transition-colors placeholder:text-(--color-gray) focus:border-(--color-text)/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-(--color-gray) transition-colors hover:text-(--color-text)"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-(--color-gray)">
          {mode === "encrypt" ? "Plain Text" : "Encrypted Text"}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "encrypt"
              ? "Type or paste your text here…"
              : "Paste your encrypted text here…"
          }
          rows={6}
          className="w-full resize-none rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 text-sm text-(--color-text) outline-none transition-colors placeholder:text-(--color-gray) focus:border-(--color-text)/30"
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action */}
      <motion.button
        type="button"
        onClick={handleProcess}
        disabled={loading}
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          mode === "encrypt"
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <motion.div
            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
          />
        ) : mode === "encrypt" ? (
          <>
            <ShieldCheck className="h-4 w-4" /> Encrypt
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4" /> Decrypt
          </>
        )}
      </motion.button>

      {/* Output */}
      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-(--color-gray)">
                {mode === "encrypt" ? "Encrypted Output" : "Decrypted Output"}
              </label>
              <motion.button
                type="button"
                onClick={handleCopy}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-(--color-gray) transition-colors hover:bg-(--color-active-bg) hover:text-(--color-text)"
                whileTap={{ scale: 0.9 }}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </motion.button>
            </div>
            <div className="max-h-60 w-full overflow-y-auto break-all rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 text-sm text-(--color-text)">
              {output}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── File Encrypt Panel ─────────────────────────────────────────────

function FileEncryptPanel() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setDone(false);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  const handleProcess = useCallback(async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    setError("");
    setLoading(true);
    setDone(false);
    try {
      if (mode === "encrypt") {
        const { encrypted, fileName } = await encryptFile(file, password);
        downloadBlob(encrypted, fileName);
      } else {
        const { decrypted, fileName } = await decryptFile(file, password);
        downloadBlob(decrypted, fileName);
      }
      setDone(true);
    } catch {
      setError(
        mode === "decrypt"
          ? "Decryption failed. Wrong password or corrupted file."
          : "Encryption failed.",
      );
    } finally {
      setLoading(false);
    }
  }, [file, password, mode]);

  const handleClear = useCallback(() => {
    setFile(null);
    setPassword("");
    setError("");
    setDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex rounded-xl border border-(--color-active-border) bg-(--color-active-bg) p-1">
          {(["encrypt", "decrypt"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setDone(false);
                setError("");
              }}
              className={`relative z-10 flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? "text-(--color-text)"
                  : "text-(--color-gray) hover:text-(--color-text)"
              }`}
            >
              {m === "encrypt" ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {m === "encrypt" ? "Encrypt" : "Decrypt"}
              {mode === m && (
                <motion.div
                  className="absolute inset-0 rounded-lg border border-(--color-active-border) bg-(--color-bg)"
                  layoutId="file-mode-pill"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={handleClear}
          title="Clear all"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-active-border) text-(--color-gray) transition-colors hover:bg-red-500/10 hover:text-red-500"
          whileTap={{ scale: 0.85 }}
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-colors ${
          dragActive
            ? "border-(--color-text)/40 bg-(--color-active-bg)"
            : "border-(--color-active-border) hover:border-(--color-text)/30 hover:bg-(--color-active-bg)"
        }`}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <motion.div
          animate={dragActive ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <FileUp className="h-10 w-10 text-(--color-gray)" />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-medium text-(--color-text)">
            {file ? file.name : "Drop a file here or click to browse"}
          </p>
          {file ? (
            <p className="mt-1 text-xs text-(--color-gray)">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          ) : (
            <p className="mt-1 text-xs text-(--color-gray)">
              {mode === "encrypt"
                ? "Any file type supported"
                : "Select an .enc file"}
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </motion.div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-(--color-gray)">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password…"
            className="w-full rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 pr-12 text-sm text-(--color-text) outline-none transition-colors placeholder:text-(--color-gray) focus:border-(--color-text)/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-(--color-gray) transition-colors hover:text-(--color-text)"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action */}
      <motion.button
        type="button"
        onClick={handleProcess}
        disabled={loading}
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          mode === "encrypt"
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <motion.div
            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
          />
        ) : mode === "encrypt" ? (
          <>
            <ShieldCheck className="h-4 w-4" /> Encrypt & Download
          </>
        ) : (
          <>
            <Download className="h-4 w-4" /> Decrypt & Download
          </>
        )}
      </motion.button>

      {/* Success */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600"
          >
            <Check className="h-4 w-4 shrink-0" />
            File {mode === "encrypt" ? "encrypted" : "decrypted"} and downloaded
            successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Encryptor;
