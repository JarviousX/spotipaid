"use client";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function WalletlessGuide({
  feeWallet,
  attributionLine,
  artistPct,
  protocolPct,
}: {
  feeWallet: string | null;
  attributionLine: string;
  artistPct: string;
  protocolPct: string;
}) {
  const [copied, setCopied] = useState<"fee" | "attr" | null>(null);

  async function copy(text: string, key: "fee" | "attr") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
          Pump
        </div>
        <h2 className="mt-3 text-lg font-bold tracking-tight text-white">
          Walletless launch
        </h2>
        <p className="mt-1 text-sm text-[#8a8a8a]">
          Create on pump.fun, point fees at SpotiPaid, and keep the music
          attribution in the description. No wallet connection on this site.
        </p>
      </div>

      <ol className="space-y-4">
        <li className="rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Step 1
          </p>
          <h3 className="mt-1.5 text-sm font-semibold text-white">
            Put the music attribution in the description
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#8a8a8a]">
            When you create the coin on pump.fun, include this line in its
            description so SpotiPaid can bind fees to the right Spotify
            identity:
          </p>
          {attributionLine ? (
            <button
              type="button"
              onClick={() => void copy(attributionLine, "attr")}
              className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-left font-mono text-[11px] text-accent hover:border-accent/40"
            >
              <span className="truncate">{attributionLine}</span>
              {copied === "attr" ? (
                <Check className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <Copy className="size-3.5 shrink-0 text-[#666]" aria-hidden />
              )}
            </button>
          ) : (
            <p className="mt-3 text-xs text-warning">
              Resolve a Spotify track on the left first to generate the
              attribution line.
            </p>
          )}
        </li>

        <li className="rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Step 2
          </p>
          <h3 className="mt-1.5 text-sm font-semibold text-white">
            Set up fee sharing
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#8a8a8a]">
            Once the coin exists, open its fee sharing on pump.fun and send{" "}
            <strong className="text-white">100%</strong> of creator fees to this
            address. Then revoke the sharing authority so it stays permanent.
          </p>
          {feeWallet ? (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
                Pump fee-sharing address
              </p>
              <button
                type="button"
                onClick={() => void copy(feeWallet, "fee")}
                className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-left font-mono text-[11px] text-white hover:border-accent/40"
              >
                <span className="break-all">{feeWallet}</span>
                {copied === "fee" ? (
                  <Check className="size-3.5 shrink-0 text-accent" aria-hidden />
                ) : (
                  <Copy className="size-3.5 shrink-0 text-[#666]" aria-hidden />
                )}
              </button>
              <p className="mt-1.5 font-mono text-[10px] text-[#555]">
                {truncateAddress(feeWallet, 6)}
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Fee wallet not set yet. Configure it in /adm1n before directing
              pump.fun fees here.
            </p>
          )}
        </li>

        <li className="rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Step 3
          </p>
          <h3 className="mt-1.5 text-sm font-semibold text-white">
            Payouts start on their own
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#8a8a8a]">
            Nothing to submit here. After the indexer sees the permanent fee
            direction and attribution, the mint can appear on Explore. Claimed
            fees split {artistPct} artist / {protocolPct} protocol.
          </p>
        </li>
      </ol>

      <p
        className={cn(
          "rounded-xl border border-[#1f1f1f] bg-[#111] px-3 py-2.5 text-xs leading-relaxed text-[#8a8a8a]",
        )}
      >
        Already launched and the description has no attribution? Use{" "}
        <strong className="text-white">Register</strong> to attach the Spotify
        identity after the fact.
      </p>
    </div>
  );
}
