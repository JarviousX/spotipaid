"use client";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";
import { useEffect, useRef } from "react";

function recordActivity(
  address: string,
  event: "connect" | "disconnect" | "account_change" | "reconnect",
) {
  void fetch("/api/wallet/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      chain: "solana",
      network: "mainnet-beta",
      event,
    }),
  }).catch(() => {
    /* non-blocking */
  });
}

/**
 * Real Solana wallet connect control via Wallet Adapter (Phantom / Solflare).
 * Never claims connected until the adapter reports a public key.
 * Never requests seed phrases or private keys.
 */
export function ConnectWalletButton({ className }: { className?: string }) {
  const { connected, connecting, publicKey, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    const key = publicKey?.toBase58() ?? null;
    if (key && key !== prevKey.current) {
      recordActivity(
        key,
        prevKey.current ? "account_change" : "connect",
      );
    }
    if (!key && prevKey.current) {
      recordActivity(prevKey.current, "disconnect");
    }
    prevKey.current = key;
  }, [publicKey]);

  if (connected && publicKey) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111] px-3 text-xs font-semibold text-white transition-colors hover:border-accent/40"
          title={wallet?.adapter.name}
        >
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          {truncateAddress(publicKey.toBase58(), 4)}
        </button>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="inline-flex h-9 items-center rounded-full border border-transparent px-2 text-xs text-[#8a8a8a] hover:text-white"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={connecting}
      onClick={() => setVisible(true)}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111] px-4 text-sm font-semibold text-white transition-colors",
        "hover:border-accent/50 hover:text-accent",
        "disabled:opacity-60",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Wallet className="size-3.5" aria-hidden />
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
