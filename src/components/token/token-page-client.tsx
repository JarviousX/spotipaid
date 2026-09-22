"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MobileTable,
  MobileTableCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { StatusBadge, type PaymentStatus } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCompact,
  formatPercent,
  formatRelativeTime,
  formatUsd,
  truncateAddress,
} from "@/lib/utils";
import {
  launchpadTokenUrl,
  solscanTokenUrl,
  spotifySearchUrl,
} from "@/lib/external-links";
import type {
  CatalogPayment,
  FeeHistoryPoint,
} from "@/services/catalog";
import type { DemoTrade, PayoutStatus } from "@/types/domain";
import { ExternalLink } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TokenChartPoint = {
  t: string;
  label: string;
  price: number;
  volume: number;
  fees: number;
};

export type TokenPageClientProps = {
  mint: string;
  symbol: string;
  musicTitle: string;
  artistNames: string[];
  chain: string;
  launchpad: string;
  attributionVersion: number;
  artistAllocationBps: number;
  protocolAllocationBps: number;
  anyArtistVerified: boolean;
  chartSeries: TokenChartPoint[];
  trades: DemoTrade[];
  fees: FeeHistoryPoint[];
  payments: CatalogPayment[];
};

function toPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "PENDING":
      return "pending";
    case "SUBMITTED":
    case "PROCESSED":
      return "processing";
    case "CONFIRMED":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

function ExternalLinkRow({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-elevated/40 px-4 py-3 transition-colors hover:border-[#3a3a3a]"
    >
      <div>
        <p className="text-sm font-semibold text-fg">{label}</p>
        <p className="text-xs text-fg-muted">{hint}</p>
      </div>
      <ExternalLink className="size-4 shrink-0 text-fg-muted" aria-hidden />
    </a>
  );
}

export function TokenPageClient({
  mint,
  symbol,
  musicTitle,
  artistNames,
  chain,
  launchpad,
  attributionVersion,
  artistAllocationBps,
  protocolAllocationBps,
  anyArtistVerified,
  chartSeries,
  trades,
  fees,
  payments,
}: TokenPageClientProps) {
  const musicUrl = spotifySearchUrl(`${musicTitle} ${artistNames.join(" ")}`);
  const launchUrl = launchpadTokenUrl(launchpad, mint);
  const scanUrl = solscanTokenUrl(mint);

  return (
    <Tabs defaultValue="overview" className="mt-10">
      <TabsList className="flex w-full flex-wrap sm:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="trades">Trades</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="rounded-md border border-border bg-bg-elevated/30 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Activity</h2>
              <p className="text-sm text-fg-muted">
                Price, volume, and fee flow from SpotiPaid activity — not Spotify
                listenership.
              </p>
            </div>
          </div>
          {chartSeries.length === 0 ? (
            <EmptyState
              title="No chart data yet"
              description="Trades and fee claims will populate this series once activity begins."
            />
          ) : (
            <div className="h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries}>
                  <defs>
                    <linearGradient id="tokenPriceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1db954" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1db954" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#8a8a8a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8a8a8a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v: number) =>
                      v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#121212",
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#f5f5f5" }}
                    formatter={(value, name) => {
                      const n = typeof value === "number" ? value : Number(value);
                      if (name === "price") {
                        return [
                          n >= 1 ? formatUsd(n.toFixed(6)) : `$${n.toFixed(6)}`,
                          "Price",
                        ];
                      }
                      if (name === "volume") {
                        return [formatCompact(n.toFixed(2)), "Volume"];
                      }
                      return [formatUsd(n.toFixed(6)), "Fees"];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#1db954"
                    fill="url(#tokenPriceFill)"
                    strokeWidth={2}
                    name="price"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ExternalLinkRow
            href={musicUrl}
            label="Listen on Spotify"
            hint={`${musicTitle} · search`}
          />
          <ExternalLinkRow
            href={launchUrl}
            label={`Open on ${launchpad}`}
            hint="Launchpad listing"
          />
          <ExternalLinkRow
            href={scanUrl}
            label="View on Solscan"
            hint="On-chain explorer"
          />
        </div>
      </TabsContent>

      <TabsContent value="trades">
        {trades.length === 0 ? (
          <EmptyState
            title="No trades yet"
            description="Recent buys and sells for this mint will appear here."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Side</TH>
                  <TH>Price</TH>
                  <TH>Amount</TH>
                  <TH>When</TH>
                </TR>
              </THead>
              <TBody>
                {trades.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <Badge tone={t.side === "BUY" ? "success" : "danger"}>
                        {t.side}
                      </Badge>
                    </TD>
                    <TD className="font-mono">{formatUsd(t.priceUsd)}</TD>
                    <TD className="font-mono">{formatUsd(t.amountUsd)}</TD>
                    <TD className="text-fg-muted">
                      {formatRelativeTime(t.timestamp)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <MobileTable>
              {trades.map((t) => (
                <MobileTableCard
                  key={t.id}
                  title={
                    <span className="flex items-center gap-2">
                      <Badge tone={t.side === "BUY" ? "success" : "danger"}>
                        {t.side}
                      </Badge>
                      ${symbol}
                    </span>
                  }
                  rows={[
                    { label: "Price", value: formatUsd(t.priceUsd) },
                    { label: "Amount", value: formatUsd(t.amountUsd) },
                    { label: "When", value: formatRelativeTime(t.timestamp) },
                  ]}
                />
              ))}
            </MobileTable>
          </>
        )}
      </TabsContent>

      <TabsContent value="fees">
        {fees.length === 0 ? (
          <EmptyState
            title="No fee claims yet"
            description="Creator fee history for this token will show once claims process."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Gross</TH>
                  <TH>Artist</TH>
                  <TH>Protocol</TH>
                  <TH>When</TH>
                </TR>
              </THead>
              <TBody>
                {fees.map((f) => (
                  <TR key={f.id}>
                    <TD className="font-mono">{f.grossFormatted}</TD>
                    <TD className="font-mono text-accent">
                      {formatUsd(f.artistAmount)}
                    </TD>
                    <TD className="font-mono">{formatUsd(f.protocolAmount)}</TD>
                    <TD className="text-fg-muted">
                      {formatRelativeTime(f.timestamp)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <MobileTable>
              {fees.map((f) => (
                <MobileTableCard
                  key={f.id}
                  title={f.grossFormatted}
                  rows={[
                    { label: "Artist", value: formatUsd(f.artistAmount) },
                    { label: "Protocol", value: formatUsd(f.protocolAmount) },
                    { label: "When", value: formatRelativeTime(f.timestamp) },
                  ]}
                />
              ))}
            </MobileTable>
          </>
        )}
      </TabsContent>

      <TabsContent value="payments">
        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Artist payouts tied to this mint will appear when settlements confirm."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Artist</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH>Tx</TH>
                  <TH>When</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((p) => (
                  <TR key={p.id}>
                    <TD>{p.artistName}</TD>
                    <TD className="font-mono">
                      {p.amountFormatted ?? formatUsd(p.amount)}
                    </TD>
                    <TD>
                      <StatusBadge
                        status={toPaymentStatus(p.status as PayoutStatus)}
                      />
                    </TD>
                    <TD className="font-mono text-xs text-fg-muted">
                      {p.txSignature
                        ? truncateAddress(p.txSignature, 4)
                        : "—"}
                    </TD>
                    <TD className="text-fg-muted">
                      {formatRelativeTime(p.timestamp)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <MobileTable>
              {payments.map((p) => (
                <MobileTableCard
                  key={p.id}
                  title={`${p.artistName} · ${p.amountFormatted ?? formatUsd(p.amount)}`}
                  rows={[
                    {
                      label: "Status",
                      value: (
                        <StatusBadge
                          status={toPaymentStatus(p.status as PayoutStatus)}
                        />
                      ),
                    },
                    {
                      label: "Tx",
                      value: p.txSignature
                        ? truncateAddress(p.txSignature, 4)
                        : "—",
                    },
                    { label: "When", value: formatRelativeTime(p.timestamp) },
                  ]}
                />
              ))}
            </MobileTable>
          </>
        )}
      </TabsContent>

      <TabsContent value="details" className="space-y-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Mint", value: mint },
            { label: "Chain", value: chain },
            { label: "Launchpad", value: launchpad },
            {
              label: "Fee split",
              value: `${formatPercent(artistAllocationBps)} artist / ${formatPercent(protocolAllocationBps)} protocol`,
            },
            {
              label: "Attribution version",
              value: `v${attributionVersion}`,
            },
            {
              label: "Official label",
              value: anyArtistVerified
                ? "Eligible only while artist remains verified on SpotiPaid"
                : "Not official — artist is not verified on SpotiPaid",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-md border border-border bg-bg-elevated/30 p-4"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {row.label}
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-fg">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="rounded-md border border-border/80 bg-bg-elevated/20 p-4 text-sm leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg">Disclaimers</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Supporting an artist on SpotiPaid does not mean endorsement unless
              the artist is verified on SpotiPaid.
            </li>
            <li>
              This token is not an official Spotify product and does not grant
              ownership of music, masters, publishing, or streaming royalties.
            </li>
            <li>
              SpotiPaid is not affiliated with or endorsed by Spotify.
            </li>
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
