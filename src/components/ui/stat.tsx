"use client";

import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

export interface StatProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
  mono?: boolean;
}

function formatNumber(value: number, decimals: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function Stat({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 900,
  className,
  mono = true,
}: StatProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      if (reduceMotion) {
        setDisplay(value);
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-semibold tracking-tight text-fg tabular-nums",
          mono && "font-mono",
        )}
      >
        {prefix}
        {formatNumber(display, decimals)}
        {suffix}
      </p>
    </div>
  );
}
