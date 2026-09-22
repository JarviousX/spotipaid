"use client";

import { formatRelativeTime, formatUsd } from "@/lib/utils";
import { cn } from "@/lib/cn";
import type { DemoArtist, DemoPayment } from "@/types/domain";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CapitalFlowPipeline } from "@/components/capital-flow/capital-flow-pipeline";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Coins,
  Cpu,
  Infinity as InfinityIcon,
  KeyRound,
  User,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "all" | "claims" | "splits" | "payouts";

function PumpMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pump-logomark.svg"
      alt=""
      width={22}
      height={22}
      className={cn("size-5 object-contain", className)}
    />
  );
}

function SolMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] text-[9px] font-black text-black",
        className,
      )}
    >
      S
    </span>
  );
}

function HowItWorks({
  artistPct,
  protocolPct,
}: {
  artistPct: string;
  protocolPct: string;
}) {
  const reduceMotion = useReducedMotion();
  const cards = [
    {
      id: "origin",
      icon: <PumpMark className="size-6" />,
      title: "A token on pump.fun points its fees at us",
      body: `At launch, the token’s creator fees route through SpotiPaid. Launchpads pay in SOL. We read the music attribution, claim fees, and split every claim — ${artistPct} artist, ${protocolPct} protocol.`,
    },
    {
      id: "artist",
      icon: <Wallet className="size-6 text-accent" />,
      title: "Artist share is reserved on-chain",
      body: "The artist allocation accrues against the linked music identity. Claimed SOL is staged for settlement — never treated as Spotify royalties or ownership of masters.",
      tag: artistPct,
    },
    {
      id: "protocol",
      icon: <Cpu className="size-6 text-[#f59e0b]" />,
      title: "Protocol share covers the rails",
      body: "The protocol cut funds execution, monitoring, and treasury operations that keep fee routing reliable.",
      tag: protocolPct,
    },
    {
      id: "settle",
      icon: <Coins className="size-6 text-accent" />,
      title: "USD settlement when available",
      body: "Batches convert to USD for artist payouts when offramp rails are configured. Until then, balances remain as on-chain obligations with a full audit trail.",
    },
    {
      id: "payout",
      icon: <User className="size-6 text-white" />,
      title: "The artist receives the distribution",
      body: "Verified artists withdraw allocations to a connected Solana wallet. Every payout is idempotent and receipted in Payments.",
    },
  ];

  return (
    <div className="relative">
      <div className="grid gap-4 lg:grid-cols-6 lg:grid-rows-2">
        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-[#1f1f1f] bg-[#0c0c0c] p-5 lg:col-span-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#111]">
              {cards[0]!.icon}
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">
                {cards[0]!.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8a8a8a]">
                {cards[0]!.body}
              </p>
            </div>
          </div>
        </motion.article>

        {cards.slice(1).map((card, i) => (
          <motion.article
            key={card.id}
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: 0.08 * i }}
            className={cn(
              "relative rounded-3xl border border-[#1f1f1f] bg-[#0c0c0c] p-5",
              i < 2 ? "lg:col-span-3" : "lg:col-span-3",
            )}
          >
            {card.tag ? (
              <span className="absolute right-4 top-4 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
                {card.tag}
              </span>
            ) : null}
            <span className="flex size-11 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#111]">
              {card.icon}
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-white">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#8a8a8a]">
              {card.body}
            </p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

function OfframpFeed({
  payments,
  artists,
}: {
  payments: DemoPayment[];
  artists: DemoArtist[];
}) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const rows = useMemo(() => {
    const mapped = payments.map((p, i) => {
      const kinds: Array<"claims" | "splits" | "payouts"> = [
        "claims",
        "splits",
        "payouts",
      ];
      const kind = kinds[i % 3]!;
      const artist = artists.find(
        (a) => a.id === p.artistId || a.displayName === p.artistName,
      );
      return { payment: p, kind, artist };
    });
    return filter === "all" ? mapped : mapped.filter((r) => r.kind === filter);
  }, [payments, artists, filter]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, page * pageSize + pageSize);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "claims", label: "Claims" },
    { id: "splits", label: "Splits" },
    { id: "payouts", label: "Payouts" },
  ];

  function copyFor(kind: "claims" | "splits" | "payouts", p: DemoPayment) {
    if (kind === "claims")
      return { amount: `${(Number(p.amount) * 1.4).toFixed(2)} SOL`, action: "claimed from launchpad" };
    if (kind === "splits")
      return {
        amount: formatUsd(p.amount),
        action: `split · 80% ${p.artistName}`,
      };
    return { amount: formatUsd(p.amount), action: `sent to ${p.artistName}` };
  }

  return (
    <section className="rounded-[1.75rem] border border-[#1f1f1f] bg-[#0c0c0c] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#6b6b6b]">
            Showing recent verified transfers while the feed refreshes.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Off-ramp
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilter(f.id);
                    setPage(0);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    filter === f.id
                      ? "bg-[#2a2a2a] text-white"
                      : "text-[#8a8a8a] hover:text-white",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#6b6b6b]">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-md px-2 py-1 hover:text-white disabled:opacity-30"
          >
            ‹
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            className="rounded-md px-2 py-1 hover:text-white disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map(({ payment: p, kind, artist }) => {
            const copy = copyFor(kind, p);
            return (
              <motion.li
                key={`${p.id}-${kind}-${filter}`}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                className="rounded-2xl border border-[#1a1a1a] bg-[#111] px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-[9rem] flex-1">
                    <p className="font-mono text-lg font-semibold tabular-nums text-white">
                      {copy.amount}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8a8a8a]">{copy.action}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0c0c0c]">
                      {kind === "claims" ? (
                        <PumpMark className="size-4" />
                      ) : kind === "splits" ? (
                        <SolMark />
                      ) : artist?.imageUrl ? (
                        <Image
                          src={artist.imageUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-4 text-[#8a8a8a]" />
                      )}
                      {!reduceMotion ? (
                        <span
                          aria-hidden
                          className="capital-flow-hop absolute inset-y-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full bg-accent"
                        />
                      ) : null}
                    </span>
                    <ArrowRight className="size-3.5 text-[#555]" aria-hidden />
                    <span className="flex size-9 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0c0c0c]">
                      {kind === "payouts" ? (
                        <Wallet className="size-4 text-accent" />
                      ) : kind === "splits" ? (
                        <Coins className="size-4 text-accent" />
                      ) : (
                        <ArrowDownToLine className="size-4 text-accent" />
                      )}
                    </span>
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] px-2.5 py-1 text-[11px] font-medium text-[#cfcfcf]">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          p.status === "CONFIRMED"
                            ? "bg-accent"
                            : p.status === "FAILED"
                              ? "bg-danger"
                              : "bg-[#f59e0b]",
                        )}
                      />
                      {kind === "claims"
                        ? "Claimed"
                        : kind === "splits"
                          ? "Split"
                          : p.status === "CONFIRMED"
                            ? "Sent"
                            : "Initiated"}
                    </span>
                    <span className="w-8 text-right font-mono text-[11px] text-[#555]">
                      {formatRelativeTime(p.timestamp).replace(" ago", "")}
                    </span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="mt-5 flex gap-3 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <PumpMark />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">
            A token on pump.fun points its fees at us
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#8a8a8a]">
            Creator fees accrue on the launchpad, get claimed into SpotiPaid
            accounting, then split to artist allocations and protocol ops — with
            every stage visible here.
          </p>
        </div>
      </div>
    </section>
  );
}

function OperationsBento() {
  const cards = [
    {
      icon: KeyRound,
      label: "Verification",
      value: "Wallet + claim evidence for artist payouts",
    },
    {
      icon: InfinityIcon,
      label: "Routing",
      value: "Per-mint attribution · permanent fee destination",
    },
    {
      icon: Coins,
      label: "Protocol fee",
      value: "20% default · covers execution rails",
    },
    {
      icon: BadgeCheck,
      label: "Artist share",
      value: "80% reserved until claimed",
    },
  ];

  return (
    <section className="rounded-[1.75rem] border border-[#1f1f1f] bg-[#0c0c0c] p-5 sm:p-6">
      <h2 className="text-xl font-bold tracking-tight text-white">
        Money operations
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#8a8a8a]">
        SpotiPaid keeps fee routing deterministic: music attribution at launch,
        irreversible creator-fee destination, and auditable splits. Artists
        claim with evidence — SpotiPaid never asks for seed phrases.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-4"
          >
            <c.icon className="size-4 text-accent" aria-hidden />
            <p className="mt-3 text-xs text-[#6b6b6b]">{c.label}</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-white">
              {c.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[#555]">
        September 2026 · Fee stages (accrued → claimed → allocated → paid) are
        tracked separately in the ledger.
      </p>
    </section>
  );
}

export function CapitalFlowExperience({
  artistBps,
  protocolBps,
  payments,
  artists,
}: {
  artistBps: number;
  protocolBps: number;
  payments: DemoPayment[];
  artists: DemoArtist[];
}) {
  const artistPct = `${(artistBps / 100).toFixed(0)}%`;
  const protocolPct = `${(protocolBps / 100).toFixed(0)}%`;
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-4xl bg-[radial-gradient(ellipse_at_top,_rgba(29,185,84,0.14),_transparent_70%)]"
      />

      <header className="relative max-w-3xl">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-accent"
        >
          Protocol rails
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          Capital flow
        </motion.h1>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-base leading-relaxed text-[#9a9a9a] sm:text-lg"
        >
          Creator fees from pump.fun are claimed on a schedule, split on SpotiPaid,
          and routed to artist allocations. The {protocolPct} protocol share
          covers execution costs that keep the rails online.
        </motion.p>
      </header>

      <section className="relative mt-8 rounded-[1.75rem] border border-[#1f1f1f] bg-[#0c0c0c] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">SpotiPaid fee flow</h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#9a9a9a]">
          <li>
            <span className="font-semibold text-white">1.</span> Native SOL
            creator fees accrue on the launchpad and are claimed into SpotiPaid
            accounting against the music-linked mint.
          </li>
          <li>
            <span className="font-semibold text-white">2.</span> Each claim splits
            immediately — {artistPct} reserved for the associated artist
            identity, {protocolPct} to protocol operations.
          </li>
          <li>
            <span className="font-semibold text-white">3.</span> Artist
            allocations accumulate until a verified claim withdraws to a Solana
            wallet (or staged USD offramp when configured).
          </li>
          <li>
            <span className="font-semibold text-white">4.</span> Accrued, claimed,
            allocated, and paid are separate ledger stages. Token-denominated
            fees can be held for review before settlement.
          </li>
        </ol>
        <p className="mt-4 text-xs text-[#6b6b6b]">
          Tokens do not grant music ownership or Spotify royalties. See{" "}
          <Link href="/disclosures" className="text-accent hover:underline">
            Disclosures
          </Link>
          .
        </p>
      </section>

      <section className="relative mt-6">
        <CapitalFlowPipeline artistPct={artistPct} protocolPct={protocolPct} />
      </section>

      <section className="relative mt-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-white">
          How it works
        </h2>
        <HowItWorks artistPct={artistPct} protocolPct={protocolPct} />
      </section>

      <section className="relative mt-10">
        <OfframpFeed payments={payments} artists={artists} />
      </section>

      <section className="relative mt-6">
        <OperationsBento />
      </section>
    </div>
  );
}
