import { BentoDashboard } from "@/components/home/bento-dashboard";
import { LivePayoutChip } from "@/components/home/live-payout-chip";
import { getConfig } from "@/lib/config";
import {
  getProtocolStats,
  listArtists,
  listRecentPayments,
  listTopTokens,
} from "@/services/catalog";
import Link from "next/link";
import type { ReactNode } from "react";

function PlatformPill({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#111] px-2.5 py-0.5 align-middle text-sm font-medium text-white transition-colors hover:border-[#3a3a3a]"
    >
      <span className="relative inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-[3px]">
        {icon}
      </span>
      {label}
    </a>
  );
}

function SpotifyIcon() {
  return (
    <span className="inline-flex size-full items-center justify-center bg-accent">
      <svg viewBox="0 0 24 24" className="size-2.5 fill-black" aria-hidden>
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.1-10.56-1.15a.75.75 0 1 1-.33-1.46c4.55-1.03 8.48-.59 11.67 1.35a.75.75 0 0 1 .25 1.01Zm1.38-3.07a.9.9 0 0 1-1.24.3c-3.23-1.98-8.15-2.56-11.97-1.4a.9.9 0 1 1-.52-1.72c4.34-1.32 9.74-.68 13.43 1.58a.9.9 0 0 1 .3 1.24Zm.12-3.2c-3.87-2.3-10.26-2.51-13.95-1.39a1.05 1.05 0 1 1-.61-2.01c4.24-1.28 11.2-1.03 15.63 1.6a1.05 1.05 0 0 1-1.07 1.8Z" />
      </svg>
    </span>
  );
}

function PumpIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pump-logomark.svg"
      alt=""
      width={14}
      height={14}
      className="size-3.5 object-contain"
    />
  );
}

export default async function Home() {
  const config = getConfig();
  const artists = listArtists();
  const payments = listRecentPayments(24);
  const tokens = listTopTokens(24);
  const stats = await getProtocolStats();

  const chipItems = payments.slice(0, 15).map((p) => ({
    amount: p.amount,
    artistName: p.artistName,
  }));

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-72 max-w-3xl bg-[radial-gradient(ellipse_at_center,_rgba(29,185,84,0.18),_transparent_65%)]"
      />

      <section className="relative mx-auto max-w-3xl text-center">
        <LivePayoutChip items={chipItems} />

        <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
          Route token fees to{" "}
          <span className="text-accent">artists</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#9a9a9a] sm:text-lg">
          Point a token&apos;s creator fees at music you love and we route a
          share to the artist. Launch on{" "}
          <PlatformPill
            href="https://open.spotify.com"
            label="Spotify"
            icon={<SpotifyIcon />}
          />{" "}
          links via{" "}
          <PlatformPill
            href="https://pump.fun"
            label="Pump"
            icon={<PumpIcon />}
          />
          .
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/launch"
            className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-semibold text-black transition-colors hover:bg-[#1ed760]"
          >
            Launch a token
          </Link>
          <Link
            href="/disclosures"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-transparent px-7 text-sm font-semibold text-white transition-colors hover:border-accent/50 hover:text-accent"
          >
            Read the docs
          </Link>
        </div>
      </section>

      <section className="relative mt-14 lg:mt-20">
        <BentoDashboard
          tokens={tokens}
          payments={payments}
          artists={artists}
          stats={stats}
          artistBps={config.fees.artistBps}
          protocolBps={config.fees.protocolBps}
        />
      </section>

      <aside className="relative mt-10 rounded-2xl border border-border bg-bg-elevated/40 px-5 py-5 text-sm leading-relaxed text-fg-muted">
        Tokens on SpotiPaid do not represent ownership of music, masters,
        publishing rights, or Spotify royalties. An artist&apos;s name or
        artwork does not imply endorsement. See{" "}
        <Link href="/disclosures" className="text-accent hover:underline">
          Disclosures
        </Link>{" "}
        for full legal notices.
      </aside>
    </div>
  );
}
