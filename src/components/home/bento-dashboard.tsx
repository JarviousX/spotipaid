"use client";

import { formatCompact, formatRelativeTime, formatUsd } from "@/lib/utils";
import { cn } from "@/lib/cn";
import type {
  DemoArtist,
  DemoPayment,
  DemoToken,
  ProtocolStats,
} from "@/types/domain";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";

function resolveArtist(
  artists: DemoArtist[],
  name?: string,
  id?: string,
): DemoArtist | undefined {
  if (id) {
    const byId = artists.find((a) => a.id === id);
    if (byId) return byId;
  }
  if (!name) return undefined;
  return artists.find((a) => a.displayName === name);
}

function Panel({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-[#1e1e1e] bg-[#0b0b0b]",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <div className="flex shrink-0 items-center justify-between px-5 py-3.5">
        <span className="text-[15px] font-semibold tracking-tight text-white">
          {title}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#7a7a7a] transition-colors hover:text-accent"
        >
          Open <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function Avatar({
  src,
  name,
  size,
  className,
}: {
  src?: string | null;
  name: string;
  size: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-[#1a1a1a]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-[11px] font-bold text-[#555]">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/* ── Explore: 6-slot mosaic, staggered soft swaps ───────────────────────── */

function ExploreBento({
  tokens,
  artists,
}: {
  tokens: DemoToken[];
  artists: DemoArtist[];
}) {
  const reduceMotion = useReducedMotion();
  const pool = useMemo(
    () =>
      tokens.slice(0, 24).map((token) => ({
        token,
        artist: resolveArtist(artists, token.artistNames[0]),
      })),
    [tokens, artists],
  );

  const [offsets, setOffsets] = useState(() =>
    Array.from({ length: 6 }, (_, i) => i % Math.max(pool.length, 1)),
  );

  useEffect(() => {
    if (reduceMotion || pool.length <= 6) return;
    const id = window.setInterval(() => {
      setOffsets((prev) => {
        const next = [...prev];
        const slot = Math.floor(Math.random() * 6);
        let candidate = Math.floor(Math.random() * pool.length);
        let guard = 0;
        while (next.includes(candidate) && guard < 12) {
          candidate = (candidate + 1) % pool.length;
          guard += 1;
        }
        next[slot] = candidate;
        return next;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, [pool.length, reduceMotion]);

  return (
    <Panel title="Explore" href="/explore">
      <div className="grid h-full grid-cols-3 grid-rows-2 gap-2.5 p-3.5 pb-1">
        {offsets.map((poolIndex, slot) => {
          const item = pool[poolIndex % pool.length];
          if (!item) return <div key={slot} className="rounded-2xl bg-[#111]" />;
          const { token, artist } = item;
          const label = artist?.displayName ?? token.artistNames[0] ?? token.name;
          return (
            <Link
              key={slot}
              href={`/token/${token.mint}`}
              className="group relative min-h-0 overflow-hidden rounded-2xl bg-[#111]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={token.id}
                  initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {token.imageUrl ? (
                    <Image
                      src={token.imageUrl}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="flex items-center gap-1 truncate text-[12px] font-semibold text-white">
                      {label}
                      {artist?.claimState === "VERIFIED" ? (
                        <BadgeCheck
                          className="size-3 shrink-0 text-accent"
                          aria-hidden
                        />
                      ) : null}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-white/65">
                      {formatCompact(token.marketCapUsd)} MC ·{" "}
                      {formatUsd(token.feesGeneratedUsd)} sent
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Payments: fixed rows, highlight walks down ─────────────────────────── */

function PaymentsBento({
  payments,
  artists,
}: {
  payments: DemoPayment[];
  artists: DemoArtist[];
}) {
  const reduceMotion = useReducedMotion();
  const rows = payments.slice(0, 6);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion || rows.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % rows.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [rows.length, reduceMotion]);

  return (
    <Panel title="Payments" href="/payments">
      <ul className="flex h-full flex-col justify-between px-2 py-2 pb-1">
        {rows.map((p, i) => {
          const artist = resolveArtist(artists, p.artistName, p.artistId);
          const isActive = i === active;
          return (
            <li key={p.id}>
              <Link
                href={`/payments/${p.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-500",
                  isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.03]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <motion.p
                    animate={
                      isActive && !reduceMotion
                        ? { color: "#ffffff" }
                        : { color: "#e8e8e8" }
                    }
                    className="font-mono text-[15px] font-semibold tabular-nums"
                  >
                    {formatUsd(p.amount)}
                  </motion.p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#8a8a8a]">
                    sent to {p.artistName}
                    {artist?.claimState === "VERIFIED" ? (
                      <BadgeCheck className="size-3 text-accent" aria-hidden />
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center">
                    <Avatar src={artist?.imageUrl} name={p.artistName} size={30} />
                    <span
                      className={cn(
                        "absolute -right-1.5 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-500",
                        isActive
                          ? "bg-accent text-black"
                          : "bg-[#1a1a1a] text-accent",
                      )}
                    >
                      →
                    </span>
                  </div>
                  <span className="w-7 text-right font-mono text-[10px] text-[#555]">
                    {formatRelativeTime(p.timestamp).replace(" ago", "")}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ── Analytics: rising fees + breathing wave ─────────────────────────────── */

function FeesBento({ stats }: { stats: ProtocolStats }) {
  const reduceMotion = useReducedMotion();
  const base = Number.parseFloat(stats.totalFeesCollected) || 9_847_300;
  const [value, setValue] = useState(base);

  const onTick = useEffectEvent(() => {
    setValue((v) => v + 18 + Math.random() * 55);
  });

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(onTick, 1100);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const display = Math.floor(value).toLocaleString("en-US");

  return (
    <Panel title="Analytics" href="/analytics">
      <div className="flex h-full flex-col px-5 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#8a8a8a]">Fees</p>
          <span className="rounded-full border border-[#2a2a2a] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#8a8a8a]">
            1D
          </span>
        </div>

        <p className="mt-3 font-mono text-[2.35rem] font-bold leading-none tracking-tight text-white sm:text-[2.6rem]">
          <span className="text-[#666]">$</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={display}
              initial={reduceMotion ? false : { opacity: 0.55, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-block tabular-nums"
            >
              {display}
            </motion.span>
          </AnimatePresence>
        </p>

        <div className="relative mt-auto min-h-[100px] flex-1 overflow-hidden">
          <svg
            viewBox="0 0 720 110"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-[110%] w-[200%]"
            aria-hidden
          >
            <defs>
              <linearGradient id="feeWaveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1DB954" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#1DB954" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className={cn(!reduceMotion && "bento-wave-drift")}>
              {/* Two identical periods so -50% translate loops seamlessly */}
              <path
                d="M0 72 C 45 48, 80 88, 120 58 S 190 28, 230 52 S 290 78, 360 36 C 405 48, 440 88, 480 58 S 550 28, 590 52 S 650 78, 720 36 L 720 110 L 0 110 Z"
                fill="url(#feeWaveFill)"
              />
              <path
                d="M0 72 C 45 48, 80 88, 120 58 S 190 28, 230 52 S 290 78, 360 36 C 405 48, 440 88, 480 58 S 550 28, 590 52 S 650 78, 720 36"
                fill="none"
                stroke="#1DB954"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

/* ── Launch: featured payout cycle ───────────────────────────────────────── */

function LaunchBento({
  payments,
  artists,
}: {
  payments: DemoPayment[];
  artists: DemoArtist[];
}) {
  const reduceMotion = useReducedMotion();
  const slides = payments.slice(0, 10);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [slides.length, reduceMotion]);

  const payment = slides[index];
  const artist = payment
    ? resolveArtist(artists, payment.artistName, payment.artistId)
    : undefined;

  return (
    <Panel title="Launch" href="/launch">
      <div className="flex h-full flex-col items-center justify-center px-5 pt-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555]">
          Paying out
        </p>
        <div className="relative mt-4 w-full flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {payment ? (
              <motion.div
                key={`${payment.id}-${index}`}
                initial={
                  reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(6px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, y: -10, filter: "blur(6px)" }
                }
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="bento-glow-ring rounded-full p-[2px]">
                  <Avatar
                    src={artist?.imageUrl}
                    name={payment.artistName}
                    size={72}
                  />
                </div>
                <p className="mt-3.5 flex items-center gap-1.5 text-[15px] font-semibold text-white">
                  {payment.artistName}
                  {artist?.claimState === "VERIFIED" ? (
                    <BadgeCheck className="size-3.5 text-accent" aria-hidden />
                  ) : null}
                </p>
                <p className="mt-0.5 text-[12px] text-[#666]">
                  @{artist?.slug ?? "artist"}
                </p>
                <p className="mt-5 font-mono text-[2rem] font-bold tracking-tight text-white">
                  {formatUsd(payment.amount)}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Panel>
  );
}

/* ── Docs: calm typewriter on locked layout ──────────────────────────────── */

const DOC_BLOCKS = [
  {
    title: "DETECTION",
    lines: [
      "program_account_change → fee_vault filter",
      "mint attribution matched · spotipaid:ref",
    ],
  },
  {
    title: "CLAIMING",
    lines: [
      "distribute_creator_fees(artist_bps, protocol_bps)",
      "settlement queued · idempotency_key bound",
    ],
  },
  {
    title: "SHARING CONFIG",
    lines: ["Attribution is per-mint"],
  },
] as const;

function DocsBento({
  artistBps,
  protocolBps,
}: {
  artistBps: number;
  protocolBps: number;
}) {
  const reduceMotion = useReducedMotion();
  const [block, setBlock] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setBlock((b) => (b + 1) % DOC_BLOCKS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const active = DOC_BLOCKS[block]!;

  return (
    <Panel title="Docs" href="/disclosures">
      <div className="flex h-full flex-col justify-between px-5 pt-5 pb-2 font-mono text-[11px] leading-relaxed">
        <div className="space-y-4">
          {DOC_BLOCKS.map((doc, i) => (
            <div
              key={doc.title}
              className={cn(
                "transition-opacity duration-500",
                i === block ? "opacity-100" : "opacity-35",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                {doc.title}
              </p>
              {doc.lines.map((line) => (
                <p key={line} className="mt-1 text-[#9a9a9a]">
                  {line}
                </p>
              ))}
              {doc.title === "SHARING CONFIG" ? (
                <p className="mt-1 text-[#9a9a9a]">
                  {(artistBps / 100).toFixed(0)}% artist ·{" "}
                  {(protocolBps / 100).toFixed(0)}% protocol
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[#555]">
          <span className="text-accent">{active.title.toLowerCase()}</span>
          <span
            className={cn(
              "inline-block h-3 w-1.5 bg-accent/80",
              !reduceMotion && "bento-cursor-blink",
            )}
            aria-hidden
          />
        </p>
      </div>
    </Panel>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────────── */

export function BentoDashboard({
  tokens,
  payments,
  artists,
  stats,
  artistBps,
  protocolBps,
}: {
  tokens: DemoToken[];
  payments: DemoPayment[];
  artists: DemoArtist[];
  stats: ProtocolStats;
  artistBps: number;
  protocolBps: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:grid-rows-[340px_280px]">
      <div className="min-h-[320px] md:col-span-2 xl:col-span-7 xl:min-h-0">
        <ExploreBento tokens={tokens} artists={artists} />
      </div>
      <div className="min-h-[320px] xl:col-span-5 xl:min-h-0">
        <PaymentsBento payments={payments} artists={artists} />
      </div>
      <div className="min-h-[260px] xl:col-span-4 xl:min-h-0">
        <FeesBento stats={stats} />
      </div>
      <div className="min-h-[260px] xl:col-span-4 xl:min-h-0">
        <LaunchBento payments={payments} artists={artists} />
      </div>
      <div className="min-h-[260px] xl:col-span-4 xl:min-h-0">
        <DocsBento artistBps={artistBps} protocolBps={protocolBps} />
      </div>
    </div>
  );
}
