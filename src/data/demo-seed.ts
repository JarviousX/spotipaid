import type {
  ActivityFeedItem,
  DemoArtist,
  DemoDataset,
  DemoPayment,
  DemoToken,
  DemoTrade,
  ProtocolStats,
} from "@/types/domain";
import {
  SPOTIFY_CATALOG_ARTISTS,
  SPOTIFY_CATALOG_TOKENS,
} from "@/data/spotify-catalog";

/**
 * Catalog dataset for SpotiPaid UI / seeds.
 * Artists are real top Spotify profiles (IDs + images from Spotify oEmbed).
 * Fee/trade numbers are simulated protocol activity — not Spotify listenership.
 */

const HOUR = 3_600_000;
const now = Date.now();

export const DEMO_ARTISTS: DemoArtist[] = SPOTIFY_CATALOG_ARTISTS.map((a) => ({
  id: a.id,
  displayName: a.displayName,
  slug: a.slug,
  imageUrl: a.imageUrl,
  claimState: a.claimState,
  balanceUsd: a.balanceUsd,
  totalFeesUsd: a.totalFeesUsd,
  artistAllocationBps: a.artistAllocationBps,
  tokenCount: a.tokenCount,
  isDemo: true as const,
}));

export const DEMO_TOKENS: DemoToken[] = SPOTIFY_CATALOG_TOKENS.map((t) => ({
  id: t.id,
  mint: t.mint,
  symbol: t.symbol,
  name: t.name,
  imageUrl: t.imageUrl,
  musicTitle: t.musicTitle,
  artistNames: t.artistNames,
  priceUsd: t.priceUsd,
  marketCapUsd: t.marketCapUsd,
  volume24hUsd: t.volume24hUsd,
  feesGeneratedUsd: t.feesGeneratedUsd,
  artistAllocationBps: t.artistAllocationBps,
  chain: t.chain,
  launchpad: t.launchpad,
  launchedAt: t.launchedAt,
  attributionVersion: t.attributionVersion,
  discoveryDisabled: t.discoveryDisabled,
  isDemo: true as const,
}));

/** Spotify artist id by catalog artist id */
export const SPOTIFY_ID_BY_ARTIST_ID: Record<string, string> = Object.fromEntries(
  SPOTIFY_CATALOG_ARTISTS.map((a) => [a.id, a.spotifyId]),
);

const statuses = [
  "CONFIRMED",
  "CONFIRMED",
  "SUBMITTED",
  "PENDING",
  "CONFIRMED",
  "FAILED",
] as const;

export const DEMO_PAYMENTS: DemoPayment[] = SPOTIFY_CATALOG_TOKENS.slice(
  0,
  24,
).map((t, i) => {
  const artist = SPOTIFY_CATALOG_ARTISTS.find((a) => a.id === t.artistId)!;
  return {
    id: `sp_pay_${i + 1}`,
    artistName: artist.displayName,
    artistId: artist.id,
    mint: t.mint,
    symbol: t.symbol,
    amount: (Number(t.feesGeneratedUsd) * (0.08 + (i % 5) * 0.02)).toFixed(6),
    timestamp: new Date(now - (i + 1) * 3 * HOUR).toISOString(),
    status: statuses[i % statuses.length],
    txSignature:
      i % 6 === 5
        ? `5spFail${t.symbol}${i}`.padEnd(44, "1")
        : `5spPay${t.symbol}${i}`.padEnd(44, "2"),
    isDemo: true,
  };
});

export const DEMO_TRADES: DemoTrade[] = SPOTIFY_CATALOG_TOKENS.slice(0, 20).map(
  (t, i) => ({
    id: `sp_trade_${i + 1}`,
    mint: t.mint,
    symbol: t.symbol,
    side: i % 3 === 0 ? "SELL" : "BUY",
    priceUsd: t.priceUsd,
    amountUsd: (80 + i * 37.5).toFixed(6),
    timestamp: new Date(now - (i + 1) * 1.5 * HOUR).toISOString(),
    isDemo: true,
  }),
);

export const DEMO_ACTIVITY: ActivityFeedItem[] = [
  ...SPOTIFY_CATALOG_TOKENS.slice(0, 8).map((t, i) => {
    const artist = SPOTIFY_CATALOG_ARTISTS.find((a) => a.id === t.artistId)!;
    return {
      id: `sp_act_fee_${i}`,
      type: "FEE_CLAIM" as const,
      title: "Fee claim processed",
      subtitle: `${t.symbol} · ${t.name}`,
      amount: (Number(t.feesGeneratedUsd) * 0.1).toFixed(6),
      mint: t.mint,
      artistName: artist.displayName,
      timestamp: new Date(now - (i + 1) * 2 * HOUR).toISOString(),
      isDemo: true,
    };
  }),
  ...SPOTIFY_CATALOG_TOKENS.slice(8, 14).map((t, i) => ({
    id: `sp_act_trade_${i}`,
    type: "TRADE" as const,
    title: i % 2 === 0 ? "Large buy" : "Sell pressure",
    subtitle: `${t.symbol} · ${t.name}`,
    amount: (120 + i * 40).toFixed(6),
    mint: t.mint,
    timestamp: new Date(now - (i + 2) * 3 * HOUR).toISOString(),
    isDemo: true,
  })),
  ...SPOTIFY_CATALOG_ARTISTS.filter((a) => a.claimState === "VERIFIED")
    .slice(0, 4)
    .map((a, i) => ({
      id: `sp_act_ver_${i}`,
      type: "VERIFICATION" as const,
      title: "Artist verified",
      subtitle: a.displayName,
      artistName: a.displayName,
      timestamp: new Date(now - (i + 5) * 12 * HOUR).toISOString(),
      isDemo: true,
    })),
  ...SPOTIFY_CATALOG_ARTISTS.filter((a) => a.claimState === "CLAIM_SUBMITTED")
    .slice(0, 3)
    .map((a, i) => ({
      id: `sp_act_claim_${i}`,
      type: "CLAIM" as const,
      title: "Artist claim submitted",
      subtitle: a.displayName,
      artistName: a.displayName,
      timestamp: new Date(now - (i + 3) * 8 * HOUR).toISOString(),
      isDemo: true,
    })),
];

export const DEMO_PROTOCOL_STATS: ProtocolStats = {
  totalFeesCollected: DEMO_ARTISTS
    .reduce((s, a) => s + Number(a.totalFeesUsd), 0)
    .toFixed(6),
  totalArtistObligations: DEMO_ARTISTS
    .reduce((s, a) => s + Number(a.balanceUsd), 0)
    .toFixed(6),
  totalProtocolObligations: (
    DEMO_ARTISTS.reduce((s, a) => s + Number(a.totalFeesUsd), 0) * 0.2
  ).toFixed(6),
  totalPaidOut: (
    DEMO_ARTISTS.reduce((s, a) => s + Number(a.balanceUsd), 0) * 0.45
  ).toFixed(6),
  activeTokens: DEMO_TOKENS.filter((t) => !t.discoveryDisabled).length,
  verifiedArtists: DEMO_ARTISTS.filter((a) => a.claimState === "VERIFIED")
    .length,
  unclaimedArtists: DEMO_ARTISTS.filter((a) => a.claimState === "UNCLAIMED")
    .length,
  isDemo: true,
};

export const DEMO_DATASET: DemoDataset = {
  isDemo: true,
  tokens: DEMO_TOKENS,
  artists: DEMO_ARTISTS,
  payments: DEMO_PAYMENTS,
  trades: DEMO_TRADES,
  activity: DEMO_ACTIVITY,
  protocolStats: DEMO_PROTOCOL_STATS,
};

export function getDemoDataset(): DemoDataset {
  return DEMO_DATASET;
}
