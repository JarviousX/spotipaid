"use client";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const CA_STORAGE_KEY = "spotipaid.public.ca";

type PublicProtocol = {
  contractAddress: string | null;
};

function readStoredCa(): string | null {
  try {
    const v = sessionStorage.getItem(CA_STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeStoredCa(value: string) {
  try {
    sessionStorage.setItem(CA_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function PublicCaChip({
  className,
  compact = false,
  size = "sm",
}: {
  className?: string;
  compact?: boolean;
  /** `lg` = hero CA under home CTAs */
  size?: "sm" | "lg";
}) {
  const [ca, setCa] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pendingRef = useRef<string | null>(null);
  const pendingHitsRef = useRef(0);

  const applyCa = useCallback((next: string | null | undefined) => {
    if (!next) return;

    setCa((prev) => {
      if (prev === next) {
        pendingRef.current = null;
        pendingHitsRef.current = 0;
        writeStoredCa(next);
        return prev;
      }

      if (pendingRef.current === next) {
        pendingHitsRef.current += 1;
      } else {
        pendingRef.current = next;
        pendingHitsRef.current = 1;
      }

      if (!prev || pendingHitsRef.current >= 2) {
        pendingRef.current = null;
        pendingHitsRef.current = 0;
        writeStoredCa(next);
        return next;
      }

      return prev;
    });
  }, []);

  const refresh = useCallback(() => {
    void fetch("/api/protocol/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: PublicProtocol) => {
        applyCa(data.contractAddress);
      })
      .catch(() => {
        /* ignore — keep sticky CA */
      });
  }, [applyCa]);

  useEffect(() => {
    const stored = readStoredCa();
    if (stored) setCa(stored);
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  if (!ca) return null;

  async function copy() {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  const isLg = size === "lg";

  return (
    <button
      type="button"
      onClick={copy}
      title={ca}
      aria-label={`Copy contract address ${ca}`}
      className={cn(
        "inline-flex items-center border font-mono transition-colors hover:border-accent/40 hover:text-accent",
        isLg
          ? "gap-3 rounded-2xl border-accent/25 bg-accent/10 px-5 py-3.5 text-sm text-accent sm:gap-4 sm:px-7 sm:py-4 sm:text-base"
          : "gap-1.5 rounded-full border-[#2a2a2a] bg-[#111] px-2.5 py-1 text-[10px] text-[#9a9a9a]",
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold uppercase tracking-[0.14em]",
          isLg ? "text-accent/70" : "text-[#5a5a5a]",
        )}
      >
        CA
      </span>
      <span
        className={cn(
          "text-white",
          isLg && "font-semibold tracking-tight sm:text-lg",
        )}
      >
        {isLg
          ? truncateAddress(ca, 6)
          : compact
            ? truncateAddress(ca, 3)
            : truncateAddress(ca, 4)}
      </span>
      {copied ? (
        <Check
          className={cn(isLg ? "size-5 text-accent" : "size-3 text-accent")}
          aria-hidden
        />
      ) : (
        <Copy
          className={cn(isLg ? "size-5 text-accent/80" : "size-3")}
          aria-hidden
        />
      )}
    </button>
  );
}
