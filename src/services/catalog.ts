import {
  DEMO_ACTIVITY,
  DEMO_ARTISTS,
  DEMO_PAYMENTS,
  DEMO_PROTOCOL_STATS,
  DEMO_TOKENS,
  DEMO_TRADES,
  getDemoDataset,
} from "@/data/demo-seed";
import {
  add,
  compare,
  formatCompact,
  formatUsd,
  parseMoney,
  splitAmount,
  toMoneyString,
} from "@/domain/money";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import type {
  ActivityFeedItem,
  ClaimState,
  DemoArtist,
  DemoPayment,
  DemoToken,
  DemoTrade,
  MoneyString,
  ProtocolStats,
  TokenStatus,
} from "@/types/domain";

export type ExploreView =
  | "trending"
  | "new"
  | "top-fees"
  | "top-artists"
  | "recently-paid";

export type AnalyticsPeriod = "1d" | "7d" | "30d" | "90d" | "all";

export type ExploreFilters = {
  q?: string;
  limit?: number;
  includeDisabled?: boolean;
};

export type CatalogToken = Omit<DemoToken, "isDemo"> & {
  isDemo: boolean;
  status?: TokenStatus;
  priceFormatted?: string;
  marketCapFormatted?: string;
  volume24hFormatted?: string;
};

export type CatalogArtist = Omit<DemoArtist, "isDemo"> & {
  isDemo: boolean;
  balanceFormatted?: string;
};

export type CatalogPayment = Omit<DemoPayment, "isDemo" | "status"> & {
  isDemo: boolean;
  status: string;
  amountFormatted?: string;
};

export type SearchHit = {
  id: string;
  kind: "artist" | "token" | "music" | "song" | "album" | "mint";
  title: string;
  subtitle: string;
  href: string;
  isDemo: boolean;
};

export type SearchResult = {
  query: string;
  artists: SearchHit[];
  tokens: SearchHit[];
  music: SearchHit[];
  results: SearchHit[];
  isDemo: boolean;
};

export type AnalyticsSeriesPoint = {
  t: string;
  label: string;
  volumeUsd: MoneyString;
  feesUsd: MoneyString;
  artistAllocUsd: MoneyString;
  protocolAllocUsd: MoneyString;
  paymentsUsd: MoneyString;
  trades: number;
  launches: number;
};

export type AnalyticsRankItem = {
  id: string;
  label: string;
  href: string;
  valueUsd: MoneyString;
  valueFormatted: string;
};

export type AnalyticsResult = {
  period: AnalyticsPeriod;
  /** SpotiPaid / on-chain activity — never Spotify listenership */
  label: string;
  /** Data may be delayed, third-party, or demo — never Spotify listenership */
  dataDisclaimer: string;
  series: AnalyticsSeriesPoint[];
  totals: {
    volumeUsd: MoneyString;
    feesUsd: MoneyString;
    artistAllocUsd: MoneyString;
    protocolAllocUsd: MoneyString;
    paymentsUsd: MoneyString;
    trades: number;
    launches: number;
    activeTokens: number;
  };
  topArtists: AnalyticsRankItem[];
  topTokens: AnalyticsRankItem[];
  isDemo: boolean;
};

export type PaymentDetail = CatalogPayment & {
  grossAmount?: MoneyString;
  artistAmount?: MoneyString;
  protocolAmount?: MoneyString;
  artistBps?: number;
  protocolBps?: number;
  method?: string;
  chain?: string;
  sourceTxSig?: string;
  externalRef?: string;
  idempotencyKey?: string;
  feeClaimId?: string;
};

export type FeeHistoryPoint = {
  id: string;
  mint: string;
  grossAmount: MoneyString;
  artistAmount: MoneyString;
  protocolAmount: MoneyString;
  timestamp: string;
  isDemo: boolean;
  grossFormatted: string;
};

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function hasTokenRows(): Promise<boolean> {
  if (!(await dbAvailable())) return false;
  try {
    return (await prisma.token.count()) > 0;
  } catch {
    return false;
  }
}

function withTokenFormats(t: Omit<DemoToken, "isDemo"> & { isDemo: boolean }): CatalogToken {
  return {
    ...t,
    status: t.discoveryDisabled ? "DISABLED" : "ACTIVE",
    priceFormatted: formatUsd(t.priceUsd),
    marketCapFormatted: formatCompact(t.marketCapUsd, { currency: true }),
    volume24hFormatted: formatCompact(t.volume24hUsd, { currency: true }),
  };
}

function withArtistFormats(
  a: Omit<DemoArtist, "isDemo"> & { isDemo: boolean },
): CatalogArtist {
  return {
    ...a,
    balanceFormatted: formatUsd(a.balanceUsd),
  };
}

function withPaymentFormats(
  p: Omit<DemoPayment, "isDemo" | "status"> & {
    isDemo: boolean;
    status?: string;
  },
): CatalogPayment {
  return {
    ...p,
    status: p.status ?? "CONFIRMED",
    amountFormatted: formatUsd(p.amount),
  };
}

function matchesFilter(haystack: string, q?: string): boolean {
  if (!q?.trim()) return true;
  return haystack.toLowerCase().includes(q.trim().toLowerCase());
}

function periodMs(period: AnalyticsPeriod): number | null {
  const day = 86_400_000;
  switch (period) {
    case "1d":
      return day;
    case "7d":
      return 7 * day;
    case "30d":
      return 30 * day;
    case "90d":
      return 90 * day;
    case "all":
      return null;
  }
}

function bucketKey(iso: string, period: AnalyticsPeriod): string {
  const d = new Date(iso);
  if (period === "1d") {
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function bucketLabel(iso: string, period: AnalyticsPeriod): string {
  const d = new Date(iso);
  if (period === "1d") {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function mapDbToken(
  t: {
    id: string;
    mint: string;
    symbol: string;
    name: string;
    imageUrl: string | null;
    attributionVersion: number;
    discoveryDisabled: boolean;
    isDemo: boolean;
    createdAt: Date;
    launchpadSlug: string | null;
    musicItem?: {
      title: string;
      artists: Array<{ artist: { displayName: string } }>;
    } | null;
    trades?: Array<{ priceUsd: string; amountUsd: string }>;
    feeClaims?: Array<{ grossAmount: string }>;
  },
): CatalogToken {
  const volume = (t.trades ?? []).reduce(
    (acc, tr) => add(acc, tr.amountUsd),
    "0.000000",
  );
  const fees = (t.feeClaims ?? []).reduce(
    (acc, c) => add(acc, c.grossAmount),
    "0.000000",
  );
  return withTokenFormats({
    id: t.id,
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    imageUrl: t.imageUrl ?? "",
    musicTitle: t.musicItem?.title ?? t.name,
    artistNames: t.musicItem?.artists.map((a) => a.artist.displayName) ?? [],
    priceUsd: t.trades?.[0]?.priceUsd ?? "0.000000",
    marketCapUsd: "0.000000",
    volume24hUsd: volume,
    feesGeneratedUsd: fees,
    artistAllocationBps: getConfig().fees.artistBps,
    chain: "Solana",
    launchpad: t.launchpadSlug ?? "unknown",
    launchedAt: t.createdAt.toISOString(),
    attributionVersion: t.attributionVersion,
    discoveryDisabled: t.discoveryDisabled,
    isDemo: t.isDemo,
  });
}

// ── Sync helpers for UI (demo-first) ─────────────────────────────────────────

export function listDiscoverableTokens(): DemoToken[] {
  return DEMO_TOKENS.filter((t) => !t.discoveryDisabled);
}

export function listTopTokens(limit = 8): DemoToken[] {
  return [...listDiscoverableTokens()]
    .sort((a, b) => compare(b.marketCapUsd, a.marketCapUsd))
    .slice(0, limit);
}

export function listTokensByVolume(limit = 20): DemoToken[] {
  return [...listDiscoverableTokens()]
    .sort((a, b) => compare(b.volume24hUsd, a.volume24hUsd))
    .slice(0, limit);
}

export function listTokensByFees(limit = 20): DemoToken[] {
  return [...listDiscoverableTokens()]
    .sort((a, b) => compare(b.feesGeneratedUsd, a.feesGeneratedUsd))
    .slice(0, limit);
}

export function listNewestTokens(limit = 20): DemoToken[] {
  return [...listDiscoverableTokens()]
    .sort(
      (a, b) =>
        new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime(),
    )
    .slice(0, limit);
}

/** Sync demo helpers for Server Components (pages). */
export function listArtists(): DemoArtist[] {
  return DEMO_ARTISTS;
}

export function listTopArtists(limit = 8): DemoArtist[] {
  return [...DEMO_ARTISTS]
    .sort((a, b) => compare(b.totalFeesUsd, a.totalFeesUsd))
    .slice(0, limit);
}

export function listRecentPayments(limit = 8): DemoPayment[] {
  return [...DEMO_PAYMENTS]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

export function listActivity(limit = 20): ActivityFeedItem[] {
  return [...DEMO_ACTIVITY]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

export function searchCatalog(query: string): {
  tokens: DemoToken[];
  artists: DemoArtist[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { tokens: listDiscoverableTokens(), artists: listArtists() };
  }
  return {
    tokens: listDiscoverableTokens().filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.musicTitle.toLowerCase().includes(q) ||
        t.artistNames.some((n) => n.toLowerCase().includes(q)) ||
        t.mint.toLowerCase().includes(q),
    ),
    artists: listArtists().filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q),
    ),
  };
}

// ── Async Prisma-preferring API ──────────────────────────────────────────────

export async function getProtocolStats(): Promise<ProtocolStats> {
  if (await hasTokenRows()) {
    try {
      const [activeTokens, verifiedArtists, unclaimedArtists, claims, payouts] =
        await Promise.all([
          prisma.token.count({
            where: { status: "ACTIVE", discoveryDisabled: false },
          }),
          prisma.artist.count({ where: { claimState: "VERIFIED" } }),
          prisma.artist.count({ where: { claimState: "UNCLAIMED" } }),
          prisma.feeClaim.findMany({
            where: { status: "PROCESSED" },
            select: {
              grossAmount: true,
              artistAmount: true,
              protocolAmount: true,
              isDemo: true,
            },
          }),
          prisma.payout.findMany({
            where: { status: { in: ["CONFIRMED", "SUBMITTED"] } },
            select: { totalAmount: true },
          }),
        ]);

      let totalFees = "0.000000";
      let totalArtist = "0.000000";
      let totalProtocol = "0.000000";
      for (const c of claims) {
        totalFees = add(totalFees, c.grossAmount);
        totalArtist = add(totalArtist, c.artistAmount);
        totalProtocol = add(totalProtocol, c.protocolAmount);
      }
      let totalPaid = "0.000000";
      for (const p of payouts) {
        totalPaid = add(totalPaid, p.totalAmount);
      }

      return {
        totalFeesCollected: totalFees,
        totalArtistObligations: totalArtist,
        totalProtocolObligations: totalProtocol,
        totalPaidOut: totalPaid,
        activeTokens,
        verifiedArtists,
        unclaimedArtists,
        isDemo: claims.every((c) => c.isDemo) || getConfig().isDemoMode,
      };
    } catch {
      /* fall through */
    }
  }
  return { ...DEMO_PROTOCOL_STATS };
}

export async function getTopTokens(limit = 10): Promise<CatalogToken[]> {
  if (await hasTokenRows()) {
    try {
      const tokens = await prisma.token.findMany({
        where: { discoveryDisabled: false, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: limit * 3,
        include: {
          musicItem: {
            include: {
              artists: {
                include: { artist: true },
                orderBy: { position: "asc" },
              },
            },
          },
          trades: { orderBy: { tradedAt: "desc" }, take: 50 },
          feeClaims: { select: { grossAmount: true } },
        },
      });
      if (tokens.length) {
        return tokens
          .map(mapDbToken)
          .sort((a, b) => compare(b.volume24hUsd, a.volume24hUsd))
          .slice(0, limit);
      }
    } catch {
      /* fall through */
    }
  }

  return listTokensByVolume(limit).map((t) => withTokenFormats(t));
}

export async function getTopArtists(limit = 10): Promise<CatalogArtist[]> {
  if (await hasTokenRows()) {
    try {
      const artists = await prisma.artist.findMany({
        include: {
          balances: { where: { status: "AVAILABLE" } },
          tokenAllocations: { where: { isActive: true } },
        },
        take: 200,
      });
      if (artists.length) {
        return artists
          .map((a) => {
            const balance = a.balances.reduce(
              (acc, b) => add(acc, b.amount),
              "0.000000",
            );
            return withArtistFormats({
              id: a.id,
              displayName: a.displayName,
              slug: a.slug,
              imageUrl: a.imageUrl ?? "",
              claimState: a.claimState as ClaimState,
              balanceUsd: balance,
              totalFeesUsd: balance,
              artistAllocationBps: getConfig().fees.artistBps,
              tokenCount: a.tokenAllocations.length,
              isDemo: a.isDemo,
            });
          })
          .sort((a, b) => compare(b.balanceUsd, a.balanceUsd))
          .slice(0, limit);
      }
    } catch {
      /* fall through */
    }
  }

  return listTopArtists(limit).map((a) => withArtistFormats(a));
}

export async function getRecentPayments(
  limit = 20,
  status?: string,
): Promise<CatalogPayment[]> {
  if (await hasTokenRows()) {
    try {
      const claims = await prisma.feeClaim.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          artistBalances: { include: { artist: true }, take: 1 },
          token: true,
        },
      });
      if (claims.length > 0) {
        return claims.map((c) =>
          withPaymentFormats({
            id: c.id,
            artistName:
              c.artistBalances[0]?.artist.displayName ?? "Unknown artist",
            artistId: c.artistBalances[0]?.artistId,
            mint: c.mint,
            symbol: c.token?.symbol ?? "—",
            amount: c.artistAmount,
            timestamp: (c.processedAt ?? c.createdAt).toISOString(),
            status: c.status,
            isDemo: c.isDemo,
          }),
        );
      }
    } catch {
      /* fall through */
    }
  }

  return DEMO_PAYMENTS.filter((p) =>
    status ? p.status === status || (status === "PROCESSED" && p.status === "CONFIRMED") : true,
  )
    .slice(0, limit)
    .map((p) => withPaymentFormats(p));
}

export async function getPaymentById(
  id: string,
): Promise<PaymentDetail | null> {
  if (await hasTokenRows()) {
    try {
      const claim = await prisma.feeClaim.findUnique({
        where: { id },
        include: {
          artistBalances: { include: { artist: true }, take: 1 },
          token: true,
          payoutItems: {
            include: { payout: true },
            take: 1,
          },
        },
      });
      if (claim) {
        const payout = claim.payoutItems[0]?.payout;
        return {
          ...withPaymentFormats({
            id: claim.id,
            artistName:
              claim.artistBalances[0]?.artist.displayName ?? "Unknown artist",
            artistId: claim.artistBalances[0]?.artistId,
            mint: claim.mint,
            symbol: claim.token?.symbol ?? "—",
            amount: claim.artistAmount,
            timestamp: (claim.processedAt ?? claim.createdAt).toISOString(),
            status: claim.status,
            txSignature: payout?.txSignature ?? claim.sourceTxSig ?? undefined,
            isDemo: claim.isDemo,
          }),
          grossAmount: claim.grossAmount,
          artistAmount: claim.artistAmount,
          protocolAmount: claim.protocolAmount,
          artistBps: claim.artistBps,
          protocolBps: claim.protocolBps,
          method: payout ? "On-chain USDC payout" : "Fee claim settlement",
          chain: payout?.chain ?? "solana",
          sourceTxSig: claim.sourceTxSig ?? undefined,
          externalRef: payout?.idempotencyKey ?? claim.idempotencyKey,
          idempotencyKey: claim.idempotencyKey,
          feeClaimId: claim.id,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const demo = DEMO_PAYMENTS.find((p) => p.id === id);
  if (!demo) return null;

  const artistBps = 8000;
  const protocolBps = 2000;
  const grossApprox = toMoneyString(
    parseMoney(demo.amount).times(10_000).div(artistBps),
  );
  const split = splitAmount(grossApprox, artistBps, protocolBps);

  return {
    ...withPaymentFormats(demo),
    grossAmount: split.total,
    artistAmount: split.artistAmount,
    protocolAmount: split.protocolAmount,
    artistBps,
    protocolBps,
    method: "On-chain USDC payout",
    chain: "solana",
    sourceTxSig: demo.txSignature,
    externalRef: `demo-ref-${demo.id}`,
    idempotencyKey: `idem_${demo.id}`,
    feeClaimId: demo.id,
  };
}

export async function getActivityFeed(
  limit = 30,
): Promise<ActivityFeedItem[]> {
  if (await hasTokenRows()) {
    try {
      const [claims, trades, claimRows] = await Promise.all([
        prisma.feeClaim.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { token: true },
        }),
        prisma.trade.findMany({
          orderBy: { tradedAt: "desc" },
          take: 15,
          include: { token: true },
        }),
        prisma.artistClaim.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { artist: true },
        }),
      ]);

      const items: ActivityFeedItem[] = [];
      for (const c of claims) {
        items.push({
          id: `fee_${c.id}`,
          type: "FEE_CLAIM",
          title: "Fee claim processed",
          subtitle: `${c.token?.symbol ?? "TOKEN"} · ${formatUsd(c.grossAmount)}`,
          amount: c.grossAmount,
          mint: c.mint,
          timestamp: (c.processedAt ?? c.createdAt).toISOString(),
          isDemo: c.isDemo,
        });
      }
      for (const t of trades) {
        items.push({
          id: `trade_${t.id}`,
          type: "TRADE",
          title: t.side === "BUY" ? "Buy" : "Sell",
          subtitle: `${t.token?.symbol ?? "TOKEN"} · ${formatUsd(t.amountUsd)}`,
          amount: t.amountUsd,
          mint: t.mint,
          timestamp: t.tradedAt.toISOString(),
          isDemo: t.isDemo,
        });
      }
      for (const cl of claimRows) {
        items.push({
          id: `claim_${cl.id}`,
          type: cl.status === "VERIFIED" ? "VERIFICATION" : "CLAIM",
          title:
            cl.status === "VERIFIED"
              ? "Artist verified"
              : "Artist claim submitted",
          subtitle: cl.artist.displayName,
          artistName: cl.artist.displayName,
          timestamp: cl.createdAt.toISOString(),
          isDemo: cl.isDemo,
        });
      }
      items.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      if (items.length > 0) return items.slice(0, limit);
    } catch {
      /* fall through */
    }
  }
  return listActivity(limit);
}

export async function getTokenByMint(
  mint: string,
): Promise<CatalogToken | null> {
  if (await hasTokenRows()) {
    try {
      const t = await prisma.token.findUnique({
        where: { mint },
        include: {
          musicItem: {
            include: {
              artists: {
                include: { artist: true },
                orderBy: { position: "asc" },
              },
            },
          },
          trades: { orderBy: { tradedAt: "desc" }, take: 50 },
          feeClaims: { select: { grossAmount: true } },
        },
      });
      if (t) return mapDbToken(t);
    } catch {
      /* fall through */
    }
  }
  const demo = DEMO_TOKENS.find((t) => t.mint === mint);
  return demo ? withTokenFormats(demo) : null;
}

export async function getArtistByIdOrSlug(
  idOrSlug: string,
): Promise<CatalogArtist | null> {
  if (await hasTokenRows()) {
    try {
      const a = await prisma.artist.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        include: {
          balances: { where: { status: "AVAILABLE" } },
          tokenAllocations: { where: { isActive: true } },
        },
      });
      if (a) {
        const balance = a.balances.reduce(
          (acc, b) => add(acc, b.amount),
          "0.000000",
        );
        return withArtistFormats({
          id: a.id,
          displayName: a.displayName,
          slug: a.slug,
          imageUrl: a.imageUrl ?? "",
          claimState: a.claimState as ClaimState,
          balanceUsd: balance,
          totalFeesUsd: balance,
          artistAllocationBps: getConfig().fees.artistBps,
          tokenCount: a.tokenAllocations.length,
          isDemo: a.isDemo,
        });
      }
    } catch {
      /* fall through */
    }
  }
  const demo = DEMO_ARTISTS.find(
    (a) => a.id === idOrSlug || a.slug === idOrSlug,
  );
  return demo ? withArtistFormats(demo) : null;
}

/** Sync helpers for UI pages */
export function getArtistById(id: string): DemoArtist | null {
  return DEMO_ARTISTS.find((a) => a.id === id || a.slug === id) ?? null;
}

export function getTokenByMintSync(mint: string): DemoToken | null {
  return DEMO_TOKENS.find((t) => t.mint === mint) ?? null;
}

export function getProtocolStatsSync(): ProtocolStats {
  return { ...DEMO_PROTOCOL_STATS };
}

export async function getArtistTokens(
  artistId: string,
): Promise<CatalogToken[]> {
  const artist = await getArtistByIdOrSlug(artistId);
  if (!artist) return [];

  if (await hasTokenRows()) {
    try {
      const allocs = await prisma.tokenArtistAllocation.findMany({
        where: { artistId: artist.id, isActive: true },
        include: {
          token: {
            include: {
              musicItem: {
                include: {
                  artists: {
                    include: { artist: true },
                    orderBy: { position: "asc" },
                  },
                },
              },
              trades: { orderBy: { tradedAt: "desc" }, take: 20 },
              feeClaims: { select: { grossAmount: true } },
            },
          },
        },
      });
      if (allocs.length > 0) {
        return allocs.map((al) => mapDbToken(al.token));
      }
    } catch {
      /* fall through */
    }
  }

  return DEMO_TOKENS.filter((t) =>
    t.artistNames.includes(artist.displayName),
  ).map((t) => withTokenFormats(t));
}

export async function getArtistPayments(
  artistId: string,
): Promise<CatalogPayment[]> {
  const artist = await getArtistByIdOrSlug(artistId);
  if (!artist) return [];
  const payments = await getRecentPayments(100);
  return payments.filter(
    (p) =>
      p.artistName === artist.displayName || p.artistId === artist.id,
  );
}

export async function searchAll(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) {
    // Return popular stubs for empty query (command palette default)
    const tokens = listTopTokens(5).map((t) => ({
      id: t.id,
      kind: "token" as const,
      title: `$${t.symbol}`,
      subtitle: `${t.name} · ${formatCompact(t.marketCapUsd, { currency: true })} mcap`,
      href: `/token/${t.mint}`,
      isDemo: true as boolean,
    }));
    const artists = listTopArtists(5).map((a) => ({
      id: a.id,
      kind: "artist" as const,
      title: a.displayName,
      subtitle: `Claim · ${a.claimState}`,
      href: `/artist/${a.slug}`,
      isDemo: true as boolean,
    }));
    const music = listDiscoverableTokens()
      .slice(0, 5)
      .map((t) => ({
        id: `music_${t.id}`,
        kind: "song" as const,
        title: t.musicTitle,
        subtitle: t.artistNames.join(", "),
        href: `/token/${t.mint}`,
        isDemo: true as boolean,
      }));
    const results = [...artists, ...tokens, ...music];
    return { query: q, artists, tokens, music, results, isDemo: true };
  }

  const artists: SearchHit[] = [];
  const tokens: SearchHit[] = [];
  const music: SearchHit[] = [];

  for (const a of DEMO_ARTISTS.filter(
    (x) => matchesFilter(x.displayName, q) || matchesFilter(x.slug, q),
  )) {
    artists.push({
      id: a.id,
      kind: "artist",
      title: a.displayName,
      subtitle: `Claim · ${a.claimState} · ${formatUsd(a.balanceUsd)} obligation`,
      href: `/artist/${a.slug}`,
      isDemo: true,
    });
  }

  for (const t of DEMO_TOKENS.filter(
    (x) =>
      matchesFilter(x.symbol, q) ||
      matchesFilter(x.name, q) ||
      matchesFilter(x.mint, q) ||
      x.artistNames.some((n) => matchesFilter(n, q)),
  )) {
    tokens.push({
      id: t.id,
      kind: "token",
      title: `$${t.symbol}`,
      subtitle: `${t.name} · ${formatCompact(t.marketCapUsd, { currency: true })} mcap`,
      href: `/token/${t.mint}`,
      isDemo: true,
    });
    tokens.push({
      id: `mint_${t.id}`,
      kind: "mint",
      title: t.mint,
      subtitle: `$${t.symbol} mint`,
      href: `/token/${t.mint}`,
      isDemo: true,
    });
  }

  for (const t of DEMO_TOKENS.filter(
    (x) =>
      matchesFilter(x.musicTitle, q) ||
      x.artistNames.some((n) => matchesFilter(n, q)),
  )) {
    music.push({
      id: `music_${t.id}`,
      kind: "song",
      title: t.musicTitle,
      subtitle: `${t.artistNames.join(", ")} · linked token $${t.symbol}`,
      href: `/token/${t.mint}`,
      isDemo: true,
    });
  }

  if (await hasTokenRows()) {
    try {
      const [dbArtists, dbTokens] = await Promise.all([
        prisma.artist.findMany({
          where: {
            OR: [
              { displayName: { contains: q } },
              { slug: { contains: q } },
            ],
          },
          take: 20,
        }),
        prisma.token.findMany({
          where: {
            OR: [
              { symbol: { contains: q } },
              { name: { contains: q } },
              { mint: { contains: q } },
            ],
          },
          take: 20,
          include: { musicItem: true },
        }),
      ]);

      for (const a of dbArtists) {
        if (artists.some((x) => x.id === a.id)) continue;
        artists.push({
          id: a.id,
          kind: "artist",
          title: a.displayName,
          subtitle: `Claim · ${a.claimState}`,
          href: `/artist/${a.slug}`,
          isDemo: a.isDemo,
        });
      }
      for (const t of dbTokens) {
        if (tokens.some((x) => x.id === t.id)) continue;
        tokens.push({
          id: t.id,
          kind: "token",
          title: `$${t.symbol}`,
          subtitle: t.name,
          href: `/token/${t.mint}`,
          isDemo: t.isDemo,
        });
        if (t.musicItem) {
          music.push({
            id: `music_${t.musicItem.id}`,
            kind: "song",
            title: t.musicItem.title,
            subtitle: `$${t.symbol}`,
            href: `/token/${t.mint}`,
            isDemo: t.isDemo,
          });
        }
      }
    } catch {
      /* demo results already filled */
    }
  }

  const results = [
    ...artists.slice(0, 10),
    ...tokens.slice(0, 10),
    ...music.slice(0, 10),
  ];

  return {
    query: q,
    artists: artists.slice(0, 10),
    tokens: tokens.slice(0, 10),
    music: music.slice(0, 10),
    results,
    isDemo: results.every((r) => r.isDemo),
  };
}

export async function getExplore(
  view: ExploreView,
  filters: ExploreFilters = {},
): Promise<{
  view: ExploreView;
  tokens: CatalogToken[];
  artists: CatalogArtist[];
  payments: CatalogPayment[];
  isDemo: boolean;
}> {
  const limit = filters.limit ?? 20;
  const q = filters.q;

  let tokens = await getTopTokens(50);
  let artists = await getTopArtists(50);
  let payments = await getRecentPayments(50);

  if (!filters.includeDisabled) {
    tokens = tokens.filter((t) => !t.discoveryDisabled);
  }
  if (q) {
    tokens = tokens.filter(
      (t) =>
        matchesFilter(t.symbol, q) ||
        matchesFilter(t.name, q) ||
        t.artistNames.some((n) => matchesFilter(n, q)),
    );
    artists = artists.filter(
      (a) => matchesFilter(a.displayName, q) || matchesFilter(a.slug, q),
    );
    payments = payments.filter(
      (p) =>
        matchesFilter(p.artistName, q) ||
        matchesFilter(p.symbol, q) ||
        matchesFilter(p.mint, q),
    );
  }

  switch (view) {
    case "trending":
      tokens = tokens
        .slice()
        .sort((a, b) => compare(b.volume24hUsd, a.volume24hUsd))
        .slice(0, limit);
      break;
    case "new":
      tokens = tokens
        .slice()
        .sort(
          (a, b) =>
            new Date(b.launchedAt).getTime() -
            new Date(a.launchedAt).getTime(),
        )
        .slice(0, limit);
      break;
    case "top-fees":
      tokens = tokens
        .slice()
        .sort((a, b) => compare(b.feesGeneratedUsd, a.feesGeneratedUsd))
        .slice(0, limit);
      break;
    case "top-artists":
      artists = artists
        .slice()
        .sort((a, b) => compare(b.balanceUsd, a.balanceUsd))
        .slice(0, limit);
      tokens = [];
      payments = [];
      break;
    case "recently-paid":
      payments = payments.slice(0, limit);
      tokens = [];
      artists = [];
      break;
  }

  return { view, tokens, artists, payments, isDemo: true };
}

type ClaimAllocRow = {
  id: string;
  mint: string;
  symbol: string;
  artistName: string;
  artistId?: string;
  grossAmount: MoneyString;
  artistAmount: MoneyString;
  protocolAmount: MoneyString;
  timestamp: string;
  isDemo: boolean;
};

export async function getAnalytics(
  period: AnalyticsPeriod,
): Promise<AnalyticsResult> {
  const windowMs = periodMs(period);
  const cutoff = windowMs == null ? 0 : Date.now() - windowMs;
  const artistBps = getConfig().fees.artistBps;
  const protocolBps = getConfig().fees.protocolBps;

  let trades: DemoTrade[] = DEMO_TRADES;
  let claims: ClaimAllocRow[] = DEMO_PAYMENTS.map((p) => {
    const gross = toMoneyString(
      parseMoney(p.amount).times(10_000).div(artistBps),
    );
    const split = splitAmount(gross, artistBps, protocolBps);
    return {
      id: p.id,
      mint: p.mint,
      symbol: p.symbol,
      artistName: p.artistName,
      artistId: p.artistId,
      grossAmount: split.total,
      artistAmount: split.artistAmount,
      protocolAmount: split.protocolAmount,
      timestamp: p.timestamp,
      isDemo: true,
    };
  });
  let launches: Array<{ id: string; timestamp: string; symbol: string; mint: string }> =
    DEMO_TOKENS.map((t) => ({
      id: t.id,
      timestamp: t.launchedAt,
      symbol: t.symbol,
      mint: t.mint,
    }));
  let activeTokens = DEMO_TOKENS.filter((t) => !t.discoveryDisabled).length;
  let isDemo = true;

  if (await hasTokenRows()) {
    try {
      const [dbTrades, dbClaims, dbTokens] = await Promise.all([
        prisma.trade.findMany({
          where:
            windowMs == null
              ? undefined
              : { tradedAt: { gte: new Date(cutoff) } },
          orderBy: { tradedAt: "asc" },
        }),
        prisma.feeClaim.findMany({
          where:
            windowMs == null
              ? undefined
              : { createdAt: { gte: new Date(cutoff) } },
          orderBy: { createdAt: "asc" },
          include: {
            token: { select: { symbol: true } },
            artistBalances: { include: { artist: true }, take: 1 },
          },
        }),
        prisma.token.findMany({
          select: {
            id: true,
            mint: true,
            symbol: true,
            createdAt: true,
            discoveryDisabled: true,
            status: true,
            isDemo: true,
          },
        }),
      ]);
      if (dbTrades.length || dbClaims.length || dbTokens.length) {
        trades = dbTrades.map((t) => ({
          id: t.id,
          mint: t.mint,
          symbol: "—",
          side: t.side as DemoTrade["side"],
          priceUsd: t.priceUsd,
          amountUsd: t.amountUsd,
          timestamp: t.tradedAt.toISOString(),
          isDemo: true as const,
        }));
        claims = dbClaims.map((c) => ({
          id: c.id,
          mint: c.mint,
          symbol: c.token?.symbol ?? "—",
          artistName:
            c.artistBalances[0]?.artist.displayName ?? "Unknown artist",
          artistId: c.artistBalances[0]?.artistId,
          grossAmount: c.grossAmount,
          artistAmount: c.artistAmount,
          protocolAmount: c.protocolAmount,
          timestamp: (c.processedAt ?? c.createdAt).toISOString(),
          isDemo: c.isDemo,
        }));
        launches = dbTokens.map((t) => ({
          id: t.id,
          timestamp: t.createdAt.toISOString(),
          symbol: t.symbol,
          mint: t.mint,
        }));
        activeTokens = dbTokens.filter(
          (t) => t.status === "ACTIVE" && !t.discoveryDisabled,
        ).length;
        isDemo =
          dbTrades.every((t) => t.isDemo) &&
          dbClaims.every((c) => c.isDemo) &&
          dbTokens.every((t) => t.isDemo);
      }
    } catch {
      /* use demo */
    }
  }

  const filteredTrades = trades.filter(
    (t) => new Date(t.timestamp).getTime() >= cutoff,
  );
  const filteredClaims = claims.filter(
    (p) => new Date(p.timestamp).getTime() >= cutoff,
  );
  const filteredLaunches = launches.filter(
    (l) => new Date(l.timestamp).getTime() >= cutoff,
  );

  const buckets = new Map<string, AnalyticsSeriesPoint>();
  const ensure = (iso: string) => {
    const key = bucketKey(iso, period);
    let point = buckets.get(key);
    if (!point) {
      point = {
        t: key,
        label: bucketLabel(key, period),
        volumeUsd: "0.000000",
        feesUsd: "0.000000",
        artistAllocUsd: "0.000000",
        protocolAllocUsd: "0.000000",
        paymentsUsd: "0.000000",
        trades: 0,
        launches: 0,
      };
      buckets.set(key, point);
    }
    return point;
  };

  for (const t of filteredTrades) {
    const p = ensure(t.timestamp);
    p.volumeUsd = add(p.volumeUsd, t.amountUsd);
    p.trades += 1;
  }
  for (const claim of filteredClaims) {
    const p = ensure(claim.timestamp);
    p.feesUsd = add(p.feesUsd, claim.grossAmount);
    p.artistAllocUsd = add(p.artistAllocUsd, claim.artistAmount);
    p.protocolAllocUsd = add(p.protocolAllocUsd, claim.protocolAmount);
    p.paymentsUsd = add(p.paymentsUsd, claim.artistAmount);
  }
  for (const launch of filteredLaunches) {
    const p = ensure(launch.timestamp);
    p.launches += 1;
  }

  const series = [...buckets.values()].sort(
    (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime(),
  );

  const totals = series.reduce(
    (acc, s) => ({
      volumeUsd: add(acc.volumeUsd, s.volumeUsd),
      feesUsd: add(acc.feesUsd, s.feesUsd),
      artistAllocUsd: add(acc.artistAllocUsd, s.artistAllocUsd),
      protocolAllocUsd: add(acc.protocolAllocUsd, s.protocolAllocUsd),
      paymentsUsd: add(acc.paymentsUsd, s.paymentsUsd),
      trades: acc.trades + s.trades,
      launches: acc.launches + s.launches,
      activeTokens,
    }),
    {
      volumeUsd: "0.000000",
      feesUsd: "0.000000",
      artistAllocUsd: "0.000000",
      protocolAllocUsd: "0.000000",
      paymentsUsd: "0.000000",
      trades: 0,
      launches: 0,
      activeTokens,
    },
  );

  const artistMap = new Map<string, AnalyticsRankItem>();
  for (const c of filteredClaims) {
    const key = c.artistId ?? c.artistName;
    const prev = artistMap.get(key);
    const valueUsd = prev
      ? add(prev.valueUsd, c.artistAmount)
      : c.artistAmount;
    artistMap.set(key, {
      id: key,
      label: c.artistName,
      href: c.artistId ? `/artist/${c.artistId}` : "/artists",
      valueUsd,
      valueFormatted: formatUsd(valueUsd),
    });
  }
  const topArtists = [...artistMap.values()]
    .sort((a, b) => compare(b.valueUsd, a.valueUsd))
    .slice(0, 8);

  const tokenMap = new Map<string, AnalyticsRankItem>();
  for (const c of filteredClaims) {
    const prev = tokenMap.get(c.mint);
    const valueUsd = prev ? add(prev.valueUsd, c.grossAmount) : c.grossAmount;
    tokenMap.set(c.mint, {
      id: c.mint,
      label: `$${c.symbol}`,
      href: `/token/${c.mint}`,
      valueUsd,
      valueFormatted: formatUsd(valueUsd),
    });
  }
  const topTokens = [...tokenMap.values()]
    .sort((a, b) => compare(b.valueUsd, a.valueUsd))
    .slice(0, 8);

  return {
    period,
    label: "SpotiPaid on-chain activity (fees, trades, payments)",
    dataDisclaimer:
      "Figures reflect SpotiPaid protocol and on-chain activity only. Statistics may be delayed, incomplete, or incorrect. Demo and third-party sources are labeled. This is not Spotify listenership or streaming analytics.",
    series,
    totals,
    topArtists,
    topTokens,
    isDemo,
  };
}

export async function getTradesForToken(mint: string): Promise<DemoTrade[]> {
  if (await hasTokenRows()) {
    try {
      const rows = await prisma.trade.findMany({
        where: { mint },
        orderBy: { tradedAt: "desc" },
        take: 100,
        include: { token: true },
      });
      if (rows.length) {
        return rows.map((t) => ({
          id: t.id,
          mint: t.mint,
          symbol: t.token?.symbol ?? "—",
          side: t.side as DemoTrade["side"],
          priceUsd: t.priceUsd,
          amountUsd: t.amountUsd,
          timestamp: t.tradedAt.toISOString(),
          isDemo: true as const,
        }));
      }
    } catch {
      /* fall through */
    }
  }
  return DEMO_TRADES.filter((t) => t.mint === mint);
}

export async function getFeeHistoryForToken(
  mint: string,
): Promise<FeeHistoryPoint[]> {
  if (await hasTokenRows()) {
    try {
      const claims = await prisma.feeClaim.findMany({
        where: { mint },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      if (claims.length) {
        return claims.map((c) => ({
          id: c.id,
          mint: c.mint,
          grossAmount: c.grossAmount,
          artistAmount: c.artistAmount,
          protocolAmount: c.protocolAmount,
          timestamp: (c.processedAt ?? c.createdAt).toISOString(),
          isDemo: c.isDemo,
          grossFormatted: formatUsd(c.grossAmount),
        }));
      }
    } catch {
      /* fall through */
    }
  }

  const fees = getConfig().fees;
  return DEMO_PAYMENTS.filter((p) => p.mint === mint).map((p) => {
    const artistDec = parseMoney(p.amount);
    const gross = artistDec
      .times(10_000)
      .dividedBy(fees.artistBps)
      .toFixed(6);
    const protocol = parseMoney(gross).minus(artistDec).toFixed(6);
    return {
      id: `feehist_${p.id}`,
      mint: p.mint,
      grossAmount: gross,
      artistAmount: p.amount,
      protocolAmount: protocol,
      timestamp: p.timestamp,
      isDemo: true,
      grossFormatted: formatUsd(gross),
    };
  });
}

export async function getPaymentsForToken(
  mint: string,
): Promise<CatalogPayment[]> {
  const payments = await getRecentPayments(100);
  return payments.filter((p) => p.mint === mint);
}

export async function listArtistsAsync(limit = 50): Promise<CatalogArtist[]> {
  return getTopArtists(limit);
}

export async function listTokens(limit = 50): Promise<CatalogToken[]> {
  return getTopTokens(limit);
}

export { getDemoDataset };
