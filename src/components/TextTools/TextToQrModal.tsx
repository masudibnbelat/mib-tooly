"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, QrCode, Type, Globe, User, Download, Check } from "lucide-react";
import QRCode from "qrcode";
import Image from "next/image";

/* ── Types ── */
type TabId = "text" | "url" | "contact";

interface ContactForm {
  name: string;
  email: string;
  number: string;
  address: string;
  website: string;
  title: string;
}

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

/* ── Helpers ── */
const buildVCard = (c: ContactForm): string => {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (c.name) lines.push(`FN:${c.name}`);
  if (c.title) lines.push(`TITLE:${c.title}`);
  if (c.email) lines.push(`EMAIL:${c.email}`);
  if (c.number) lines.push(`TEL:${c.number}`);
  if (c.address) lines.push(`ADR:;;${c.address};;;;`);
  if (c.website) lines.push(`URL:${c.website}`);
  lines.push("END:VCARD");
  return lines.join("\n");
};

/* ── Sub-components ── */
const TabBtn = ({
  tab,
  active,
  onClick,
}: {
  tab: Tab;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
      transition-all duration-200 cursor-pointer
      ${
        active
          ? "bg-(--color-active-bg) text-(--color-text) border border-(--color-active-border)"
          : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)/50"
      }
    `}
  >
    {tab.icon}
    <span className="hidden sm:inline">{tab.label}</span>
  </button>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  optional?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-(--color-gray) uppercase tracking-wider flex items-center gap-1.5">
      {label}
      {optional && (
        <span className="text-[10px] normal-case tracking-normal opacity-50">
          optional
        </span>
      )}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full rounded-lg px-3.5 py-2.5 text-sm
        bg-(--color-active-bg) border border-(--color-active-border)
        text-(--color-text) placeholder:text-(--color-gray)/50
        focus:outline-none focus:ring-2 focus:ring-(--color-text)/20
        transition-all duration-150
      "
    />
  </div>
);

/* ── Main Modal ── */
export const TextToQRModal = ({ onClose }: { onClose: () => void }) => {
  const [tab, setTab] = useState<TabId>("text");
  const [textVal, setTextVal] = useState("");
  const [urlVal, setUrlVal] = useState("");
  const [contact, setContact] = useState<ContactForm>({
    name: "",
    email: "",
    number: "",
    address: "",
    website: "",
    title: "",
  });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const getQRContent = useCallback((): string => {
    if (tab === "text") return textVal.trim();
    if (tab === "url") {
      const v = urlVal.trim();
      if (!v) return "";
      return v.startsWith("http://") || v.startsWith("https://")
        ? v
        : `https://${v}`;
    }
    if (tab === "contact") {
      const hasAny = Object.values(contact).some((v) => v.trim());
      return hasAny ? buildVCard(contact) : "";
    }
    return "";
  }, [tab, textVal, urlVal, contact]);

  const generate = useCallback(async () => {
    const content = getQRContent();
    if (!content) return;
    setGenerating(true);
    try {
      const url = await QRCode.toDataURL(content, {
        width: 512,
        margin: 2,
        color: {
          dark: "#1f2125",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [getQRContent]);

  /* reset QR when inputs change */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQrDataUrl(null);
  }, [tab, textVal, urlVal, contact]);

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const TABS: Tab[] = [
    { id: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
    { id: "url", label: "Website URL", icon: <Globe className="w-4 h-4" /> },
    { id: "contact", label: "Contact", icon: <User className="w-4 h-4" /> },
  ];

  const canGenerate = !!getQRContent();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-stretch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* full-screen sheet */}
      <motion.div
        className="
          relative z-10 w-full h-full
          bg-(--color-bg)
          overflow-hidden
          flex flex-col
        "
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-(--color-active-border) shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-active-bg)">
              <QrCode className="w-4 h-4 text-(--color-text)" />
            </div>
            <h2 className="text-base font-semibold text-(--color-text)">
              QR Code Generator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-(--color-text) transition-all duration-150 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row h-full lg:divide-x lg:divide-(--color-active-border)">
            {/* LEFT — inputs */}
            <div className="flex-1 p-5 sm:p-8 flex flex-col gap-5">
              {/* tabs */}
              <div className="flex items-center gap-1.5">
                {TABS.map((t) => (
                  <TabBtn
                    key={t.id}
                    tab={t}
                    active={tab === t.id}
                    onClick={() => setTab(t.id)}
                  />
                ))}
              </div>

              {/* tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4 flex-1"
                >
                  {tab === "text" && (
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-medium text-(--color-gray) uppercase tracking-wider">
                        Your Text
                      </label>
                      <textarea
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        placeholder="Enter any text to generate QR..."
                        rows={5}
                        className="
                          w-full flex-1 min-h-30 rounded-lg px-3.5 py-2.5 text-sm resize-none
                          bg-(--color-active-bg) border border-(--color-active-border)
                          text-(--color-text) placeholder:text-(--color-gray)/50
                          focus:outline-none focus:ring-2 focus:ring-(--color-text)/20
                          transition-all duration-150
                        "
                      />
                    </div>
                  )}

                  {tab === "url" && (
                    <Field
                      label="Website URL"
                      value={urlVal}
                      onChange={setUrlVal}
                      placeholder="example.com or https://example.com"
                      type="url"
                    />
                  )}

                  {tab === "contact" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="Name"
                        value={contact.name}
                        onChange={(v) => setContact((c) => ({ ...c, name: v }))}
                        placeholder="John Doe"
                        optional
                      />
                      <Field
                        label="Title / Position"
                        value={contact.title}
                        onChange={(v) =>
                          setContact((c) => ({ ...c, title: v }))
                        }
                        placeholder="Software Engineer"
                        optional
                      />
                      <Field
                        label="Email"
                        value={contact.email}
                        onChange={(v) =>
                          setContact((c) => ({ ...c, email: v }))
                        }
                        placeholder="john@example.com"
                        type="email"
                        optional
                      />
                      <Field
                        label="Phone Number"
                        value={contact.number}
                        onChange={(v) =>
                          setContact((c) => ({ ...c, number: v }))
                        }
                        placeholder="+880 1700 000000"
                        type="tel"
                        optional
                      />
                      <Field
                        label="Website"
                        value={contact.website}
                        onChange={(v) =>
                          setContact((c) => ({ ...c, website: v }))
                        }
                        placeholder="https://example.com"
                        type="url"
                        optional
                      />
                      <Field
                        label="Address"
                        value={contact.address}
                        onChange={(v) =>
                          setContact((c) => ({ ...c, address: v }))
                        }
                        placeholder="123 Main St, City"
                        optional
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* generate btn */}
              <button
                type="button"
                onClick={generate}
                disabled={!canGenerate || generating}
                className="
                  flex items-center justify-center gap-2
                  w-full py-3 rounded-xl text-sm font-semibold
                  bg-(--color-text) text-(--color-bg)
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:opacity-90 active:scale-[0.98]
                  transition-all duration-150 cursor-pointer shrink-0
                "
              >
                {generating ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-(--color-bg)/30 border-t-(--color-bg) rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: "linear",
                      }}
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </>
                )}
              </button>
            </div>

            {/* RIGHT — preview */}
            <div className="lg:w-80 xl:w-96 p-5 sm:p-8 flex flex-col items-center gap-4 shrink-0">
              <p className="text-xs font-medium text-(--color-gray) uppercase tracking-wider self-start">
                Preview
              </p>

              <AnimatePresence mode="wait">
                {qrDataUrl ? (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", damping: 20, stiffness: 280 }}
                    className="flex flex-col items-center gap-4 w-full"
                  >
                    <div className="p-4 rounded-xl border border-(--color-active-border) bg-white">
                      <Image
                        src={qrDataUrl}
                        width={512}
                        height={512}
                        alt="Generated QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 lg:w-full lg:h-auto block"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={download}
                      className="
                        flex items-center justify-center gap-2
                        w-full py-2.5 rounded-xl text-sm font-semibold
                        border border-(--color-active-border)
                        hover:bg-(--color-active-bg) text-(--color-text)
                        active:scale-[0.98] transition-all duration-150 cursor-pointer
                      "
                    >
                      <AnimatePresence mode="wait">
                        {downloaded ? (
                          <motion.span
                            key="done"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-2 text-green-500"
                          >
                            <Check className="w-4 h-4" />
                            Downloaded!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="dl"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download PNG
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="
                      flex flex-col items-center justify-center gap-3
                      w-full aspect-square max-w-56 lg:max-w-full
                      rounded-xl border-2 border-dashed border-(--color-active-border)
                      text-(--color-gray)
                    "
                  >
                    <QrCode className="w-10 h-10 opacity-30" />
                    <p className="text-xs text-center opacity-60 px-4">
                      Fill in the details and click Generate
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
