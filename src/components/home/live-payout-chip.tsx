"use client";

import { formatUsd } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export type LivePayoutChipItem = {
  amount: string;
  artistName: string;
};

export function LivePayoutChip({ items }: { items: LivePayoutChipItem[] }) {
  const reduceMotion = useReducedMotion();
  const slides = items.slice(0, 15);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [slides.length, reduceMotion]);

  if (slides.length === 0) return null;

  const current = slides[index] ?? slides[0]!;

  return (
    <p
      className="mx-auto mb-7 inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs text-accent"
      aria-live="polite"
    >
      <span
        className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent"
        aria-hidden
      />
      <span className="relative inline-grid min-h-[1.25rem] min-w-[12rem] place-items-center overflow-hidden sm:min-w-[14rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${current.artistName}-${current.amount}-${index}`}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 8, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: -8, filter: "blur(4px)" }
            }
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="col-start-1 row-start-1 inline-flex items-center gap-1.5 font-mono font-medium text-fg"
          >
            <span className="tabular-nums text-accent">
              {formatUsd(current.amount)}
            </span>
            <span className="text-[#5a5a5a]" aria-hidden>
              →
            </span>
            <span className="truncate text-white">{current.artistName}</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </p>
  );
}
