"use client";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PublicProtocol = {
  contractAddress: string | null;
  xAccount: string | null;
  xUrl: string | null;
};

export function PublicCaChip({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [ca, setCa] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    void fetch("/api/protocol/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: PublicProtocol) => {
        setCa(data.contractAddress ?? null);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  if (!ca) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(ca!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={ca}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#111] px-2.5 py-1 font-mono text-[10px] text-[#9a9a9a] transition-colors hover:border-accent/40 hover:text-accent",
        className,
      )}
    >
      <span className="text-[#5a5a5a]">CA</span>
      <span className="text-white">
        {compact ? truncateAddress(ca, 3) : truncateAddress(ca, 4)}
      </span>
      {copied ? (
        <Check className="size-3 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
    </button>
  );
}
