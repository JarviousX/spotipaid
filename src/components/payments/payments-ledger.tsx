"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  matchesPaymentFilter,
  toPaymentStatus,
  type PaymentFilter,
} from "@/lib/payments-ui";
import { cn } from "@/lib/cn";
import {
  formatRelativeTime,
  formatUsd,
  truncateAddress,
} from "@/lib/utils";
import type { CatalogPayment } from "@/services/catalog";
import type { DemoArtist } from "@/types/domain";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Search,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type MouseEvent } from "react";

const FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
];

function artistImage(
  payment: CatalogPayment,
  artists: DemoArtist[],
): string | undefined {
  if (payment.artistId) {
    return artists.find((a) => a.id === payment.artistId)?.imageUrl;
  }
  return artists.find(
    (a) => a.displayName.toLowerCase() === payment.artistName.toLowerCase(),
  )?.imageUrl;
}

function sumAmounts(rows: CatalogPayment[]): number {
  return rows.reduce((acc, p) => {
    const n = Number.parseFloat(p.amount);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function LivePaymentsRail({ payments }: { payments: CatalogPayment[] }) {
  const reduce = useReducedMotion();
  const base = payments.slice(0, 10);
  if (base.length === 0) return null;
  const loop = [...base, ...base];

  return (
    <div className="payments-marquee relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a]/70 py-3">
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
          "payments-marquee-track flex w-max gap-6 px-4",
          reduce && "payments-marquee-static",
        )}
      >
        {loop.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={`/payments/${p.id}`}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm"
          >
            <span className="font-mono font-semibold text-accent">
              {p.amountFormatted ?? formatUsd(p.amount)}
            </span>
            <span className="text-[#6b6b6b]">→</span>
            <span className="font-medium text-white">{p.artistName}</span>
            <span className="rounded-full border border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] text-[#8a8a8a]">
              ${p.symbol}
            </span>
            <span className="font-mono text-[10px] text-[#5a5a5a]">
              {formatRelativeTime(p.timestamp).replace(" ago", "")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
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
      className="inline-flex items-center gap-1 font-mono text-[11px] text-[#6b6b6b] transition-colors hover:text-accent"
      aria-label="Copy"
    >
      {truncateAddress(value, 5)}
      {copied ? (
        <Check className="size-3 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
    </button>
  );
}

export function PaymentsLedger({
  payments,
  artists = [],
}: {
  payments: CatalogPayment[];
  artists?: DemoArtist[];
}) {
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const counts = useMemo(() => {
    const c: Record<PaymentFilter, number> = {
      all: payments.length,
      pending: 0,
      processing: 0,
      paid: 0,
      failed: 0,
    };
    for (const p of payments) {
      const s = toPaymentStatus(p.status);
      if (s === "pending") c.pending += 1;
      else if (s === "processing") c.processing += 1;
      else if (s === "paid") c.paid += 1;
      else if (s === "failed") c.failed += 1;
    }
    return c;
  }, [payments]);

  const stats = useMemo(() => {
    const paid = payments.filter((p) => toPaymentStatus(p.status) === "paid");
    const pending = payments.filter(
      (p) => toPaymentStatus(p.status) === "pending",
    );
    const processing = payments.filter(
      (p) => toPaymentStatus(p.status) === "processing",
    );
    return {
      totalPaid: sumAmounts(paid),
      pending: sumAmounts(pending),
      processing: sumAmounts(processing),
      count: payments.length,
    };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (!matchesPaymentFilter(p.status, filter)) return false;
      if (!q) return true;
      return (
        p.artistName.toLowerCase().includes(q) ||
        p.symbol.toLowerCase().includes(q) ||
        p.mint.toLowerCase().includes(q) ||
        (p.txSignature?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [payments, filter, query]);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total paid",
            value: formatUsd(stats.totalPaid.toFixed(2)),
            tone: "text-accent",
          },
          {
            label: "Pending",
            value: formatUsd(stats.pending.toFixed(2)),
            tone: "text-warning",
          },
          {
            label: "Processing",
            value: formatUsd(stats.processing.toFixed(2)),
            tone: "text-white",
          },
          {
            label: "Settlements",
            value: String(stats.count),
            tone: "text-white",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              {s.label}
            </p>
            <p className={cn("mt-2 font-mono text-2xl font-bold tracking-tight", s.tone)}>
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      <LivePaymentsRail payments={payments} />

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all",
                  active
                    ? "border-accent/40 bg-accent/10 text-white"
                    : "border-[#2a2a2a] text-[#8a8a8a] hover:border-[#3a3a3a] hover:text-white",
                )}
              >
                {active ? (
                  <span
                    className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]"
                    aria-hidden
                  />
                ) : null}
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                    active ? "bg-accent/20 text-accent" : "bg-[#1a1a1a] text-[#6b6b6b]",
                  )}
                >
                  {counts[f.value]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b6b6b]"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artist, ticker, mint…"
            className="h-10 w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#5a5a5a] focus:border-accent/50"
          />
        </label>
      </div>

      {/* Trust strip */}
      <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-[#9a9a9a]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p>
          Settlements are{" "}
          <span className="font-semibold text-white">idempotent</span> by ledger
          key — retries replay the original claim and never invent a second
          obligation.
        </p>
      </div>

      {/* Ledger */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-[#2a2a2a] py-16 text-center text-sm text-[#6b6b6b]"
          >
            No payments in this view.
          </motion.p>
        ) : (
          <motion.ul layout className="space-y-2">
            {filtered.map((payment, i) => {
              const open = expandedId === payment.id;
              const img = artistImage(payment, artists);
              const status = toPaymentStatus(payment.status);

              return (
                <motion.li
                  key={payment.id}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.24) }}
                  className={cn(
                    "payment-row overflow-hidden rounded-2xl border bg-[#0c0c0c] transition-all duration-300",
                    open
                      ? "border-accent/35 shadow-[0_0_32px_rgba(29,185,84,0.08)]"
                      : "border-[#1f1f1f] hover:border-[#2e2e2e]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : payment.id)}
                    className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[#1a1a1a] ring-1 ring-white/10">
                        {img ? (
                          <Image
                            src={img}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-xs font-bold text-[#6b6b6b]">
                            {payment.artistName.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {payment.artistName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6b6b6b]">
                          <span className="font-mono text-[#8a8a8a]">
                            ${payment.symbol}
                          </span>
                          <ArrowRight className="size-3 text-accent/70" aria-hidden />
                          <span>artist allocation</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold tracking-tight text-accent">
                          {payment.amountFormatted ?? formatUsd(payment.amount)}
                        </p>
                        <p className="font-mono text-[10px] text-[#5a5a5a]">
                          {formatRelativeTime(payment.timestamp)}
                        </p>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-[#1a1a1a]"
                      >
                        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a5a]">
                              Token
                            </p>
                            <Link
                              href={`/token/${payment.mint}`}
                              className="mt-1 inline-flex font-mono text-sm text-accent hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ${payment.symbol}
                            </Link>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a5a]">
                              Mint
                            </p>
                            <div className="mt-1">
                              <CopyButton value={payment.mint} />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a5a]">
                              Receipt
                            </p>
                            <div className="mt-1">
                              {payment.txSignature ? (
                                <a
                                  href={`https://solscan.io/tx/${payment.txSignature}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-xs text-[#8a8a8a] hover:text-accent"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {truncateAddress(payment.txSignature, 6)}
                                  <ExternalLink className="size-3" aria-hidden />
                                </a>
                              ) : (
                                <span className="text-xs text-[#5a5a5a]">
                                  Awaiting broadcast
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a5a]">
                              Settled
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {new Date(payment.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1a1a1a] px-4 py-3">
                          <p className="text-xs text-[#5a5a5a]">
                            Idempotent replay · same key → same ledger outcome
                          </p>
                          <Link
                            href={`/payments/${payment.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Full receipt <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
