"use client";

import Link from "next/link";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-bg) px-6">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-active-bg) blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-xl flex-col items-center text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-(--color-active-border) bg-(--color-active-bg)"
        >
          <SearchX size={48} className="text-(--color-text)" />
        </motion.div>

        {/* 404 */}
        <h1 className="text-7xl font-black tracking-tight text-(--color-text) sm:text-8xl">
          404
        </h1>

        <h2 className="mt-3 text-2xl font-bold text-(--color-text) sm:text-4xl">
          Page Not Found
        </h2>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-(--color-gray) sm:text-base">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-text) px-6 py-3 font-medium text-(--color-bg) transition-all hover:scale-[1.02]"
          >
            <Home size={18} />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--color-active-border) px-6 py-3 font-medium text-(--color-text) transition hover:bg-(--color-active-bg)"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </motion.div>
    </main>
  );
}
