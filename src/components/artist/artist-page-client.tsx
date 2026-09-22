"use client";

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
import { StatusBadge, type PaymentStatus } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { claimStateLabel } from "@/lib/claim-labels";
import { spotifySearchUrl } from "@/lib/external-links";
import {
  formatCompact,
  formatPercent,
  formatRelativeTime,
  formatUsd,
  truncateAddress,
} from "@/lib/utils";
import type { CatalogPayment, CatalogToken } from "@/services/catalog";
import type { ClaimState, PayoutStatus } from "@/types/domain";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export type ArtistPageClientProps = {
  artistId: string;
  displayName: string;
  claimState: ClaimState;
  artistAllocationBps: number;
  tokens: CatalogToken[];
  payments: CatalogPayment[];
  aboutBlurb: string;
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

export function ArtistPageClient({
  artistId,
  displayName,
  claimState,
  artistAllocationBps,
  tokens,
  payments,
  aboutBlurb,
}: ArtistPageClientProps) {
  const musicItems = tokens.map((t) => ({
    id: t.id,
    title: t.musicTitle,
    symbol: t.symbol,
    mint: t.mint,
    imageUrl: t.imageUrl,
  }));

  return (
    <Tabs defaultValue="tokens" className="mt-10">
      <TabsList className="flex w-full flex-wrap sm:w-auto">
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="music">Music</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>

      <TabsContent value="tokens">
        {tokens.length === 0 ? (
          <EmptyState
            title="No linked tokens"
            description="Tokens that attribute fees to this artist will list here."
          />
        ) : (
          <ul className="grid gap-3">
            {tokens.map((token) => (
              <li key={token.id}>
                <Link
                  href={`/token/${token.mint}`}
                  className="group flex items-center gap-4 rounded-md border border-border bg-bg-elevated/40 p-4 transition-colors hover:border-[#3a3a3a]"
                >
                  <Artwork src={token.imageUrl} alt={token.name} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-lg font-bold tracking-tight text-fg">
                        ${token.symbol}
                      </p>
                    </div>
                    <p className="truncate text-sm text-fg-muted">{token.name}</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-fg">
                      <span className="text-fg-muted">
                        {token.marketCapFormatted ??
                          formatCompact(token.marketCapUsd, { currency: true })}{" "}
                        MC
                      </span>
                      <span className="mx-2 text-border">·</span>
                      <span className="text-accent">
                        {formatUsd(token.feesGeneratedUsd)} generated
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="payments">
        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Settled fee payouts to this artist will appear here."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Token</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH>Tx</TH>
                  <TH>When</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link
                        href={`/token/${p.mint}`}
                        className="font-mono font-semibold text-accent hover:underline"
                      >
                        ${p.symbol}
                      </Link>
                    </TD>
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
                  title={`$${p.symbol} · ${p.amountFormatted ?? formatUsd(p.amount)}`}
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

      <TabsContent value="music">
        {musicItems.length === 0 ? (
          <EmptyState
            title="No linked music"
            description="Tracks and albums attributed to this artist’s tokens will show here."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {musicItems.map((item) => (
              <li key={item.id}>
                <div className="flex items-center gap-3 rounded-md border border-border bg-bg-elevated/40 p-3">
                  <Artwork src={item.imageUrl} alt={item.title} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{item.title}</p>
                    <p className="font-mono text-xs text-fg-muted">
                      Linked token ${item.symbol}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                      <a
                        href={spotifySearchUrl(`${item.title} ${displayName}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        Spotify
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                      <Link
                        href={`/token/${item.mint}`}
                        className="text-fg-muted hover:text-fg hover:underline"
                      >
                        Token page
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="about" className="space-y-5">
        <div className="rounded-md border border-border bg-bg-elevated/30 p-5">
          <h2 className="text-lg font-bold tracking-tight">Profile</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {aboutBlurb}
          </p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                Claim status
              </dt>
              <dd className="mt-1 font-semibold">
                {claimStateLabel(claimState)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                Artist allocation
              </dt>
              <dd className="mt-1 font-mono font-semibold text-accent">
                {formatPercent(artistAllocationBps)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                Artist ID
              </dt>
              <dd className="mt-1 font-mono text-sm">{artistId}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-md border border-border/80 p-4 text-sm leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg">Important</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Unclaimed artists did not create, approve, or endorse linked
              tokens.
            </li>
            <li>
              Verification on SpotiPaid is separate from owning a Spotify URL.
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
