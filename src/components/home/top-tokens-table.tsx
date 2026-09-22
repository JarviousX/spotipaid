import { Artwork } from "@/components/ui/artwork";
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
import { formatCompact, formatPercent, formatRelativeTime } from "@/lib/utils";
import type { DemoToken } from "@/types/domain";
import Link from "next/link";

export interface TopTokensTableProps {
  tokens: DemoToken[];
}

export function TopTokensTable({ tokens }: TopTokensTableProps) {
  if (tokens.length === 0) {
    return (
      <EmptyState
        title="No tokens yet"
        description="When music tokens launch on SpotiPaid, they will appear here."
      />
    );
  }

  return (
    <section aria-labelledby="top-tokens-heading">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="top-tokens-heading"
              className="text-2xl font-bold tracking-tight text-fg sm:text-3xl"
            >
              Top Music Tokens
            </h2>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            Ranked by market cap. Fees route to associated artists.
          </p>
        </div>
        <Link
          href="/explore"
          className="hidden text-sm font-semibold text-accent hover:underline sm:inline"
        >
          View all
        </Link>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Token</TH>
            <TH>Artist</TH>
            <TH className="text-right">Market cap</TH>
            <TH className="text-right">24h vol</TH>
            <TH className="text-right">Fees</TH>
            <TH className="text-right">Artist %</TH>
            <TH>Venue</TH>
            <TH className="text-right">Age</TH>
          </TR>
        </THead>
        <TBody>
          {tokens.map((token) => (
            <TR key={token.id}>
              <TD>
                <Link
                  href={`/token/${token.mint}`}
                  className="flex items-center gap-3 hover:opacity-90"
                >
                  <Artwork src={token.imageUrl} alt={token.name} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-fg">
                      {token.name}
                    </span>
                    <span className="font-mono text-xs text-fg-muted">
                      ${token.symbol}
                    </span>
                  </span>
                </Link>
              </TD>
              <TD className="text-fg-muted">
                {token.artistNames.join(", ")}
              </TD>
              <TD className="text-right font-mono">
                {formatCompact(token.marketCapUsd)}
              </TD>
              <TD className="text-right font-mono text-fg-muted">
                {formatCompact(token.volume24hUsd)}
              </TD>
              <TD className="text-right font-mono">
                {formatCompact(token.feesGeneratedUsd)}
              </TD>
              <TD className="text-right font-mono text-accent">
                {formatPercent(token.artistAllocationBps)}
              </TD>
              <TD>
                <span className="text-fg-muted">
                  {token.chain} · {token.launchpad}
                </span>
              </TD>
              <TD className="text-right text-fg-muted">
                {formatRelativeTime(token.launchedAt)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <MobileTable>
        {tokens.map((token) => (
          <Link key={token.id} href={`/token/${token.mint}`} className="block">
            <MobileTableCard
              title={
                <span className="flex items-center gap-3">
                  <Artwork src={token.imageUrl} alt={token.name} size={48} />
                  <span>
                    <span className="block font-semibold">{token.name}</span>
                    <span className="font-mono text-xs text-fg-muted">
                      ${token.symbol} · {token.artistNames.join(", ")}
                    </span>
                  </span>
                </span>
              }
              rows={[
                {
                  label: "Market cap",
                  value: formatCompact(token.marketCapUsd),
                },
                {
                  label: "24h volume",
                  value: formatCompact(token.volume24hUsd),
                },
                {
                  label: "Fees generated",
                  value: formatCompact(token.feesGeneratedUsd),
                },
                {
                  label: "Artist allocation",
                  value: formatPercent(token.artistAllocationBps),
                },
                {
                  label: "Venue",
                  value: `${token.chain} · ${token.launchpad}`,
                },
                {
                  label: "Age",
                  value: formatRelativeTime(token.launchedAt),
                },
              ]}
            />
          </Link>
        ))}
      </MobileTable>
    </section>
  );
}
