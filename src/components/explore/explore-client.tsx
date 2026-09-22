"use client";

import {
  formatCompact,
  formatRelativeTime,
  formatUsd,
  truncateAddress,
} from "@/lib/utils";
import { cn } from "@/lib/cn";
import type { DemoArtist, DemoToken } from "@/types/domain";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type MouseEvent } from "react";

type LaunchpadFilter = "all" | "pump.fun" | "letsbonk" | "moonshot";
type SortKey = "fees" | "mcap" | "recent";

function artistForToken(
  token: DemoToken,
  artists: DemoArtist[],
): DemoArtist | undefined {
  const names = token.artistNames ?? [];
  return (artists ?? []).find((a) =>
    names.some((n) => n.toLowerCase() === a.displayName.toLowerCase()),
  );
}

function artistShareUsd(token: DemoToken): string {
  const fees = Number.parseFloat(token.feesGeneratedUsd);
  if (!Number.isFinite(fees)) return "0";
  return ((fees * token.artistAllocationBps) / 10_000).toFixed(2);
}

function TrendingRail({
  tokens,
  artists,
}: {
  tokens: DemoToken[];
  artists: DemoArtist[];
}) {
  const reduce = useReducedMotion();
  const items = tokens ?? [];

  if (items.length === 0) return null;

  // Duplicate enough for a seamless loop even with few tokens
  const base = items.slice(0, 12);
  const loop = [...base, ...base];

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Trending</h2>
        <Link
          href="#all-launches"
          className="text-sm text-[#8a8a8a] transition-colors hover:text-accent"
        >
          View all
        </Link>
      </div>

      <div className="trending-marquee relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a]/60 py-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bg to-transparent sm:w-16"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bg to-transparent sm:w-16"
        />

        <div
          className={cn(
            "trending-marquee-track flex w-max gap-3 px-3",
            reduce && "trending-marquee-static",
          )}
        >
          {loop.map((token, i) => {
            const artist = artistForToken(token, artists ?? []);
            return (
              <Link
                key={`${token.id}-${i}`}
                href={`/token/${token.mint}`}
                className="group flex w-[210px] shrink-0 items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-2.5 transition-all duration-300 hover:border-accent/40 hover:bg-[#111] hover:shadow-[0_0_24px_rgba(29,185,84,0.12)]"
              >
                <div className="relative size-11 overflow-hidden rounded-xl bg-[#141414]">
                  {token.imageUrl ? (
                    <Image
                      src={token.imageUrl}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {token.name}
                  </p>
                  <p className="font-mono text-xs text-accent">
                    {formatUsd(artistShareUsd(token))}
                  </p>
                  {artist ? (
                    <p className="truncate text-[10px] text-[#6b6b6b]">
                      {artist.displayName}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CopyMint({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#6b6b6b] transition-colors hover:text-accent"
      aria-label="Copy mint address"
    >
      <span>{truncateAddress(mint, 4)}</span>
      {copied ? (
        <Check className="size-3 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
    </button>
  );
}

function LaunchCard({
  token,
  artists,
  index,
}: {
  token: DemoToken;
  artists: DemoArtist[];
  index: number;
}) {
  const reduce = useReducedMotion();
  const artist = artistForToken(token, artists);
  const age = formatRelativeTime(token.launchedAt).replace(" ago", "");
  const sent = artistShareUsd(token);
  const verified = artist?.claimState === "VERIFIED";

  return (
    <motion.div
      layout
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.04, 0.28), duration: 0.4 }}
    >
      <Link
        href={`/token/${token.mint}`}
        className="explore-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] transition-all duration-300 hover:-translate-y-1 hover:border-accent/45 hover:shadow-[0_12px_40px_rgba(29,185,84,0.14)]"
      >
        <div className="relative aspect-square overflow-hidden bg-[#080808]">
          <Image
            src={token.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-80 transition-opacity group-hover:opacity-100" />
          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 font-mono text-[10px] font-medium text-white/90 backdrop-blur-md">
            {age}
          </span>
          <span className="absolute left-2.5 top-2.5 rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent backdrop-blur-md">
            {token.launchpad.replace(".fun", "")}
          </span>
        </div>

        {artist ? (
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-3 py-2.5">
            <div className="relative size-6 overflow-hidden rounded-full ring-1 ring-white/10">
              <Image
                src={artist.imageUrl}
                alt=""
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
            <span className="min-w-0 flex-1 truncate text-xs text-[#b0b0b0]">
              {artist.displayName}
            </span>
            {verified ? (
              <Check className="size-3.5 shrink-0 text-accent" aria-label="Verified" />
            ) : null}
          </div>
        ) : (
          <div className="border-b border-[#1a1a1a] px-3 py-2.5 text-xs text-[#6b6b6b]">
            {token.artistNames[0] ?? "Unknown artist"}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-3 pt-3">
          <div>
            <p className="truncate text-[15px] font-semibold tracking-tight text-white">
              {token.name}{" "}
              <span className="font-mono text-sm font-medium text-[#8a8a8a]">
                {token.symbol}
              </span>
            </p>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-[#6b6b6b]">
                {formatCompact(token.marketCapUsd)} MC
              </span>
              <span className="text-accent">{formatUsd(sent)} Sent</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#6b6b6b]">
                {formatUsd(token.feesGeneratedUsd)} fees
              </span>
              <span className="text-[#8a8a8a]">
                {(token.artistAllocationBps / 100).toFixed(0)}% artist
              </span>
            </div>
          </div>

          <div className="mt-auto pt-1">
            <CopyMint mint={token.mint} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ExploreClient({
  tokens = [],
  trending = [],
  artists = [],
}: {
  tokens?: DemoToken[];
  trending?: DemoToken[];
  artists?: DemoArtist[];
}) {
  const [query, setQuery] = useState("");
  const [pad, setPad] = useState<LaunchpadFilter>("all");
  const [sort, setSort] = useState<SortKey>("fees");
  const reduce = useReducedMotion();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tokens.filter((t) => !t.discoveryDisabled);

    if (pad !== "all") {
      list = list.filter((t) => t.launchpad === pad);
    }

    if (q) {
      list = list.filter((t) => {
        const names = t.artistNames ?? [];
        return (
          t.name?.toLowerCase().includes(q) ||
          t.symbol?.toLowerCase().includes(q) ||
          t.mint?.toLowerCase().includes(q) ||
          names.some((n) => n.toLowerCase().includes(q)) ||
          t.musicTitle?.toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...list];
    if (sort === "fees") {
      sorted.sort(
        (a, b) =>
          Number.parseFloat(b.feesGeneratedUsd) -
          Number.parseFloat(a.feesGeneratedUsd),
      );
    } else if (sort === "mcap") {
      sorted.sort(
        (a, b) =>
          Number.parseFloat(b.marketCapUsd) - Number.parseFloat(a.marketCapUsd),
      );
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime(),
      );
    }
    return sorted;
  }, [tokens, query, pad, sort]);

  const pads: { id: LaunchpadFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pump.fun", label: "Pump" },
    { id: "letsbonk", label: "LetsBonk" },
    { id: "moonshot", label: "Moonshot" },
  ];

  const sorts: { id: SortKey; label: string }[] = [
    { id: "fees", label: "Artist fees" },
    { id: "mcap", label: "Market Cap" },
    { id: "recent", label: "Recent" },
  ];

  return (
    <div>
      <TrendingRail tokens={trending} artists={artists} />

      <section id="all-launches" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-white">All launches</h2>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {pads.map((p) => {
              const active = pad === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPad(p.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "border-accent/40 bg-accent/10 text-white"
                      : "border-[#2a2a2a] text-[#8a8a8a] hover:border-[#3a3a3a] hover:text-white",
                  )}
                >
                  {p.id === "pump.fun" || (p.id === "all" && active) ? (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        active
                          ? "bg-accent shadow-[0_0_8px_var(--accent)]"
                          : "bg-[#3a3a3a]",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  {p.id === "pump.fun" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/pump-logomark.svg"
                      alt=""
                      className="size-3.5"
                    />
                  ) : null}
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b6b6b]"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by mint, ticker, artist…"
                className="h-10 w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#5a5a5a] focus:border-accent/50"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sorts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    sort === s.id
                      ? "bg-white text-black"
                      : "text-[#8a8a8a] hover:text-white",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16 text-center text-sm text-[#6b6b6b]"
            >
              No launches match these filters.
            </motion.p>
          ) : (
            <motion.div
              layout
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
            >
              {filtered.map((token, i) => (
                <LaunchCard
                  key={token.id}
                  token={token}
                  artists={artists}
                  index={reduce ? 0 : i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
