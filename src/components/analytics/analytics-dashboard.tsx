"use client";

import { cn } from "@/lib/cn";
import { formatCompact, formatUsd } from "@/lib/utils";
import type {
  AnalyticsPeriod,
  AnalyticsResult,
} from "@/services/catalog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowUpRight, Loader2, Radio } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "ALL" },
];

const GREEN = "#1DB954";
const GREEN_BRIGHT = "#1ED760";
const MUTED = "#6b6b6b";
const GRID = "#1a1a1a";

function toNum(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]/95 px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b6b6b]">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div
            key={String(p.name)}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="flex items-center gap-1.5 text-[#9a9a9a]">
              <span
                className="size-1.5 rounded-full"
                style={{ background: p.color ?? GREEN }}
              />
              {p.name}
            </span>
            <span className="font-mono font-semibold text-white">
              {typeof p.value === "number"
                ? p.value >= 100
                  ? formatUsd(p.value.toFixed(2))
                  : p.value.toLocaleString()
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDashboard({
  initial,
}: {
  initial: AnalyticsResult;
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initial.period);
  const [data, setData] = useState<AnalyticsResult>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const selectPeriod = useCallback(
    async (next: AnalyticsPeriod) => {
      setPeriod(next);
      if (next === initial.period) {
        setData(initial);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics?period=${next}`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = (await res.json()) as { analytics: AnalyticsResult };
        setData(json.analytics);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [initial],
  );

  const chartRows = useMemo(
    () =>
      data.series.map((s) => ({
        label: s.label,
        fees: toNum(s.feesUsd),
        artist: toNum(s.artistAllocUsd),
        protocol: toNum(s.protocolAllocUsd),
        payments: toNum(s.paymentsUsd),
        volume: toNum(s.volumeUsd),
        trades: s.trades,
        launches: s.launches,
      })),
    [data.series],
  );

  const splitPie = useMemo(() => {
    const artist = toNum(data.totals.artistAllocUsd);
    const protocol = toNum(data.totals.protocolAllocUsd);
    const total = artist + protocol;
    return [
      { name: "Artist", value: artist, color: GREEN },
      { name: "Protocol", value: protocol, color: "#3a3a3a" },
      { total },
    ] as const;
  }, [data.totals]);

  const artistShare =
    splitPie[2].total > 0
      ? Math.round((splitPie[0].value / splitPie[2].total) * 100)
      : 0;

  const kpis = [
    {
      label: "Fees collected",
      value: formatUsd(data.totals.feesUsd),
      accent: true,
      hint: "Creator fee inflow",
    },
    {
      label: "Artist share",
      value: formatUsd(data.totals.artistAllocUsd),
      accent: true,
      hint: `${artistShare}% of split`,
    },
    {
      label: "Payments sent",
      value: formatUsd(data.totals.paymentsUsd),
      accent: false,
      hint: "Settled to artists",
    },
    {
      label: "Trade volume",
      value: formatCompact(data.totals.volumeUsd, { currency: true }),
      accent: false,
      hint: "Indexed activity",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period + live status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Analytics period"
          className="inline-flex rounded-full border border-[#1f1f1f] bg-[#0c0c0c] p-1"
        >
          {PERIODS.map((p) => {
            const active = period === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => void selectPeriod(p.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wide transition-all",
                  active
                    ? "bg-accent text-black shadow-[0_0_20px_rgba(29,185,84,0.35)]"
                    : "text-[#8a8a8a] hover:text-white",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6b6b6b]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-accent">
            <Radio className="size-3 animate-pulse" aria-hidden />
            LIVE FEED
          </span>
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Syncing
            </span>
          ) : (
            <span className="font-mono uppercase tracking-[0.12em]">
              {data.label}
            </span>
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="analytics-panel relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-4"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-accent/10 blur-2xl"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
              {k.label}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`${period}-${k.value}`}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  "mt-2 font-mono text-2xl font-bold tracking-tight sm:text-3xl",
                  k.accent ? "text-accent" : "text-white",
                )}
              >
                {k.value}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-xs text-[#5a5a5a]">{k.hint}</p>
          </motion.div>
        ))}
      </div>

      {/* Main chart + allocation */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="analytics-panel relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-4 lg:col-span-2 lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Protocol fee flow
              </h2>
              <p className="mt-0.5 text-xs text-[#6b6b6b]">
                Fees · artist · protocol · payments
              </p>
            </div>
            <Activity className="size-4 text-accent" aria-hidden />
          </div>
          <div className="h-[280px] w-full sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="feesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="payFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN_BRIGHT} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={GREEN_BRIGHT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: MUTED, fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="fees"
                  name="Fees"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  fill="url(#feesFill)"
                  activeDot={{ r: 4, fill: GREEN, stroke: "#000", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="payments"
                  name="Payments"
                  stroke={GREEN_BRIGHT}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="url(#payFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-panel relative flex flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-4 lg:p-5">
          <h2 className="text-sm font-semibold text-white">Fee split</h2>
          <p className="mt-0.5 text-xs text-[#6b6b6b]">
            Artist vs protocol allocation
          </p>
          <div className="relative mx-auto mt-2 h-[180px] w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Artist", value: splitPie[0].value },
                    { name: "Protocol", value: splitPie[1].value || 0.01 },
                  ]}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="none"
                >
                  <Cell fill={GREEN} />
                  <Cell fill="#2a2a2a" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-mono text-3xl font-bold text-accent">
                {artistShare}%
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6b6b]">
                Artist
              </p>
            </div>
          </div>
          <div className="mt-auto space-y-2 pt-2">
            <SplitRow
              label="Artist allocation"
              value={formatUsd(data.totals.artistAllocUsd)}
              color={GREEN}
            />
            <SplitRow
              label="Protocol allocation"
              value={formatUsd(data.totals.protocolAllocUsd)}
              color="#3a3a3a"
            />
          </div>
        </div>
      </div>

      {/* Secondary charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Launches" subtitle="New music tokens registered">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="launches" name="Launches" radius={[6, 6, 0, 0]} fill={GREEN} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Trade activity" subtitle="Indexed volume & trades">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" name="Volume" radius={[6, 6, 0, 0]} fill="#2a2a2a" />
                <Bar dataKey="trades" name="Trades" radius={[6, 6, 0, 0]} fill={GREEN} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Leaderboard
          title="Top artists"
          subtitle="By allocation received"
          items={data.topArtists}
          empty="No artist allocations in this period."
        />
        <Leaderboard
          title="Top tokens"
          subtitle="By fees generated"
          items={data.topTokens}
          empty="No token fee activity in this period."
        />
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-4 py-3 font-mono text-[11px] text-[#5a5a5a]">
        <span>
          ACTIVE_TOKENS={data.totals.activeTokens} · TRADES={data.totals.trades} ·
          LAUNCHES={data.totals.launches}
        </span>
        <span className="text-[#6b6b6b]">
          SpotiPaid / on-chain only — not Spotify listenership
        </span>
      </div>
    </div>
  );
}

function SplitRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-[#9a9a9a]">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-mono font-semibold text-white">{value}</span>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="analytics-panel rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-4 lg:p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mb-3 mt-0.5 text-xs text-[#6b6b6b]">{subtitle}</p>
      {children}
    </div>
  );
}

function Leaderboard({
  title,
  subtitle,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  items: AnalyticsResult["topArtists"];
  empty: string;
}) {
  const max = Math.max(...items.map((i) => toNum(i.valueUsd)), 1);

  return (
    <div className="analytics-panel rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-4 lg:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-[#6b6b6b]">{subtitle}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#5a5a5a]">{empty}</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, i) => {
            const pct = Math.max(4, (toNum(item.valueUsd) / max) * 100);
            return (
              <li key={item.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <Link
                    href={item.href}
                    className="group flex min-w-0 items-center gap-2.5 font-medium text-white hover:text-accent"
                  >
                    <span className="font-mono text-xs text-[#5a5a5a]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{item.label}</span>
                    <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-accent">
                    {item.valueFormatted}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
