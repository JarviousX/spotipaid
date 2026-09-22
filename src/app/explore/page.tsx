import { ExploreClient } from "@/components/explore/explore-client";
import {
  listArtists,
  listDiscoverableTokens,
  listTokensByVolume,
} from "@/services/catalog";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Discover music tokens, artists, and fee activity on SpotiPaid.",
};

export default function ExplorePage() {
  const tokens = listDiscoverableTokens() ?? [];
  const trending = listTokensByVolume(12) ?? [];
  const artists = listArtists() ?? [];

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-4xl bg-[radial-gradient(ellipse_at_top,_rgba(29,185,84,0.14),_transparent_70%)]"
      />

      <section className="relative overflow-hidden rounded-3xl border border-[#1f1f1f] bg-[#0c0c0c]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 size-56 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 lg:p-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Discover
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Explore tokens.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a] sm:text-base">
              Launchpads create the tokens. SpotiPaid routes creator fees
              on-chain and reserves an artist allocation — with a public trail
              for every payment.
            </p>
          </div>
          <Link
            href="/launch"
            className="explore-cta inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-accent px-7 text-sm font-semibold text-black transition-transform hover:scale-[1.03] hover:bg-[#1ed760] active:scale-[0.98]"
          >
            Launch a token
          </Link>
        </div>
      </section>

      <ExploreClient
        tokens={tokens}
        trending={trending}
        artists={artists}
      />
    </div>
  );
}
