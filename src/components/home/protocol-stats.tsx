"use client";

import { Stat } from "@/components/ui/stat";
import type { ProtocolStats } from "@/types/domain";
import { parseMoney } from "@/domain/money";

export interface ProtocolStatsProps {
  stats: ProtocolStats;
  paymentsSent: number;
  artistsSupported: number;
}

export function ProtocolStatsSection({
  stats,
  paymentsSent,
  artistsSupported,
}: ProtocolStatsProps) {
  const artistEarnings = parseMoney(stats.totalArtistObligations).toNumber();
  const totalFees = parseMoney(stats.totalFeesCollected).toNumber();

  return (
    <section aria-labelledby="protocol-stats-heading">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h2
            id="protocol-stats-heading"
            className="text-2xl font-bold tracking-tight text-fg sm:text-3xl"
          >
            Protocol Statistics
          </h2>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          Aggregate fee routing and payout activity across SpotiPaid.
        </p>
      </div>

      <div className="grid gap-6 rounded-md border border-border bg-bg-elevated/40 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="Total Artist Earnings"
          value={artistEarnings}
          prefix="$"
          decimals={0}
        />
        <Stat
          label="Total Fees Generated"
          value={totalFees}
          prefix="$"
          decimals={0}
        />
        <Stat label="Artists Supported" value={artistsSupported} />
        <Stat label="Tokens Registered" value={stats.activeTokens} />
        <Stat label="Payments Sent" value={paymentsSent} />
      </div>
    </section>
  );
}
