import { Artwork } from "@/components/ui/artwork";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { TokenPageClient } from "@/components/token/token-page-client";
import { add, parseMoney, subtract, splitAmount } from "@/domain/money";
import {
  canClaimProfile,
  claimStateLabel,
  claimStateTone,
  isArtistVerified,
} from "@/lib/claim-labels";
import { estimateHolders } from "@/lib/external-links";
import { buildTokenChartSeries } from "@/lib/token-chart";
import {
  formatCompact,
  formatPercent,
  formatRelativeTime,
  formatUsd,
} from "@/lib/utils";
import { getConfig } from "@/lib/config";
import {
  getFeeHistoryForToken,
  getPaymentsForToken,
  getTokenByMint,
  getTradesForToken,
  listArtists,
} from "@/services/catalog";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ mint: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mint } = await params;
  const token = await getTokenByMint(mint);
  return {
    title: token ? `${token.name} ($${token.symbol})` : "Token",
    description: token
      ? `${token.musicTitle} by ${token.artistNames.join(", ")} on SpotiPaid`
      : "Token not found",
  };
}

export default async function TokenPage({ params }: Props) {
  const { mint } = await params;
  const token = await getTokenByMint(mint);

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Token not found"
          description="This mint is not in the catalog. Newly launched demo tokens may appear after refresh."
          action={
            <Link
              href="/explore"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Back to Explore
            </Link>
          }
        />
      </div>
    );
  }

  const [trades, fees, payments] = await Promise.all([
    getTradesForToken(token.mint),
    getFeeHistoryForToken(token.mint),
    getPaymentsForToken(token.mint),
  ]);

  const feesCfg = getConfig().fees;
  const split = splitAmount(
    token.feesGeneratedUsd,
    token.artistAllocationBps,
    10_000 - token.artistAllocationBps,
  );

  const paymentsSent = payments
    .filter((p) => p.status === "CONFIRMED" || p.status === "SUBMITTED")
    .reduce((acc, p) => add(acc, p.amount), "0.000000");

  const pendingArtist = (() => {
    const artistShare = split.artistAmount;
    const remaining = subtract(artistShare, paymentsSent);
    return parseMoney(remaining).isNegative() ? "0.000000" : remaining;
  })();

  const holders = estimateHolders(token.mint, token.marketCapUsd);
  const chartSeries = buildTokenChartSeries({
    priceUsd: token.priceUsd,
    launchedAt: token.launchedAt,
    trades,
    fees,
  });

  const artists = listArtists().filter((a) =>
    token.artistNames.includes(a.displayName),
  );
  const anyVerified = artists.some((a) => isArtistVerified(a.claimState));
  const primaryArtist = artists[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <Artwork
          src={token.imageUrl}
          alt={token.name}
          size={180}
          priority
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {anyVerified ? (
              <Badge tone="success">Artist verified</Badge>
            ) : (
              <Badge tone="neutral">Not official</Badge>
            )}
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            {token.name}
          </h1>
          <p className="mt-1 font-mono text-xl text-fg-muted">${token.symbol}</p>

          <p className="mt-3 text-sm text-fg-muted">
            <span className="text-fg">{token.musicTitle}</span>
            {" · "}
            {token.artistNames.map((name, i) => {
              const artist = artists.find((a) => a.displayName === name);
              return (
                <span key={name}>
                  {i > 0 ? ", " : null}
                  {artist ? (
                    <Link
                      href={`/artist/${artist.slug}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    name
                  )}
                </span>
              );
            })}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Market cap",
                value:
                  token.marketCapFormatted ??
                  formatCompact(token.marketCapUsd, { currency: true }),
              },
              {
                label: "Price",
                value: token.priceFormatted ?? formatUsd(token.priceUsd),
              },
              {
                label: "24h volume",
                value:
                  token.volume24hFormatted ??
                  formatCompact(token.volume24hUsd, { currency: true }),
              },
              { label: "Holders", value: holders.toLocaleString() },
              {
                label: "Launched",
                value: formatRelativeTime(token.launchedAt),
              },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-fg">
                  {stat.value}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                Mint
              </dt>
              <dd className="mt-1">
                <CopyButton value={token.mint} label="mint address" />
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section
        aria-label="Artist support notice"
        className="mt-8 rounded-md border border-accent/25 bg-accent-dim/40 px-5 py-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          Supporting
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Supporting{" "}
          {primaryArtist ? (
            <Link
              href={`/artist/${primaryArtist.slug}`}
              className="text-accent hover:underline"
            >
              {token.artistNames.join(", ")}
            </Link>
          ) : (
            token.artistNames.join(", ")
          )}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
          Fee attribution routes creator fees toward{" "}
          {token.artistNames.join(", ")}. This does{" "}
          <strong className="font-semibold text-fg">not</strong> mean
          endorsement unless the artist is verified on SpotiPaid
          {anyVerified
            ? " — at least one linked artist is currently verified."
            : "."}
          {primaryArtist && canClaimProfile(primaryArtist.claimState) ? (
            <>
              {" "}
              <Link
                href={`/artist/${primaryArtist.slug}/claim`}
                className="font-semibold text-accent hover:underline"
              >
                Claim Artist Profile
              </Link>
            </>
          ) : null}
        </p>
        {artists.map((a) => (
          <Badge
            key={a.id}
            tone={claimStateTone(a.claimState)}
            className="mt-3 mr-2"
          >
            {a.displayName}: {claimStateLabel(a.claimState)}
          </Badge>
        ))}
      </section>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Total creator fees",
            value: formatUsd(token.feesGeneratedUsd),
          },
          {
            label: "Artist allocation",
            value: `${formatUsd(split.artistAmount)} (${formatPercent(token.artistAllocationBps)})`,
          },
          {
            label: "Protocol allocation",
            value: `${formatUsd(split.protocolAmount)} (${formatPercent(feesCfg.protocolBps || 10_000 - token.artistAllocationBps)})`,
          },
          { label: "Payments sent", value: formatUsd(paymentsSent) },
          {
            label: "Pending artist balance",
            value: formatUsd(pendingArtist),
            accent: true,
          },
        ].map((row) => (
          <div
            key={row.label}
            className="rounded-md border border-border bg-bg-elevated/40 p-4"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {row.label}
            </dt>
            <dd
              className={
                row.accent
                  ? "mt-1 font-mono text-lg font-semibold tabular-nums text-accent"
                  : "mt-1 font-mono text-lg font-semibold tabular-nums text-fg"
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <TokenPageClient
        mint={token.mint}
        symbol={token.symbol}
        musicTitle={token.musicTitle}
        artistNames={token.artistNames}
        chain={token.chain}
        launchpad={token.launchpad}
        attributionVersion={token.attributionVersion}
        artistAllocationBps={token.artistAllocationBps}
        protocolAllocationBps={
          feesCfg.protocolBps || 10_000 - token.artistAllocationBps
        }
        anyArtistVerified={anyVerified}
        chartSeries={chartSeries}
        trades={trades}
        fees={fees}
        payments={payments}
      />
    </div>
  );
}
