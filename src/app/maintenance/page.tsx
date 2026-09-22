import { Logo } from "@/components/brand/logo";
import { getPublicProtocolConfig } from "@/services/protocol-config";
import { truncateAddress } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const config = await getPublicProtocolConfig();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(29,185,84,0.1),_transparent_60%)]"
      />
      <div className="relative max-w-lg">
        <Logo showWordmark markClassName="size-10" />
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Maintenance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          SpotiPaid is temporarily paused
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#8a8a8a]">
          Launches, trades, and other write actions are frozen while we perform
          maintenance. Please check back shortly.
        </p>
        {config.contractAddress ? (
          <p className="mt-8 break-all rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-4 py-4 font-mono text-sm text-white">
            <span className="text-[#6b6b6b]">CA: </span>
            {config.contractAddress}
          </p>
        ) : (
          <p className="mt-8 font-mono text-sm text-[#5a5a5a]">CA: —</p>
        )}
        {config.contractAddress ? (
          <p className="mt-2 text-xs text-[#5a5a5a]">
            {truncateAddress(config.contractAddress, 6)}
          </p>
        ) : null}
        <Link
          href="/"
          className="mt-8 inline-block text-xs text-[#6b6b6b] hover:text-accent"
        >
          Refresh status
        </Link>
      </div>
    </div>
  );
}
