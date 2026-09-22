/**
 * Shared domain types for SpotiPaid.
 * Money amounts are always decimal strings — never floating point.
 */

export type ClaimState =
  | "UNCLAIMED"
  | "CLAIM_SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export type MusicItemType =
  | "TRACK"
  | "ALBUM"
  | "ARTIST"
  | "PLAYLIST"
  | "OTHER";

export type ProviderName = "SPOTIFY" | "APPLE_MUSIC" | "DEMO" | "OTHER";

export type TokenStatus = "ACTIVE" | "DISABLED" | "HIDDEN" | "MALICIOUS";

export type FeeClaimStatus = "PENDING" | "PROCESSED" | "FAILED" | "REVERSED";

export type BalanceStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PAID"
  | "REVERSED"
  | "SWEPT";

export type PayoutStatus =
  | "PENDING"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED";

export type AdminRole = "SUPER_ADMIN" | "MODERATOR" | "FINANCE" | "READONLY";

export type TradeSide = "BUY" | "SELL";

export type IntegrationEventStatus =
  | "PENDING"
  | "PROCESSED"
  | "FAILED"
  | "SKIPPED";

export type SpotifyEntityType = "track" | "album" | "artist" | "playlist";

/** Decimal string representing a USD / USDC amount */
export type MoneyString = string;

/** Basis points — 10000 = 100%, 8000 = 80% */
export type BasisPoints = number;

export interface MoneySplit {
  artistAmount: MoneyString;
  protocolAmount: MoneyString;
  total: MoneyString;
  artistBps: BasisPoints;
  protocolBps: BasisPoints;
}

export interface SpotifyRef {
  type: SpotifyEntityType;
  id: string;
  uri: string;
  url: string;
}

export interface MusicArtistRef {
  id: string;
  name: string;
  imageUrl?: string | null;
  claimState?: ClaimState;
  providerIds?: Partial<Record<ProviderName, string>>;
}

export interface MusicTrackMeta {
  id: string;
  title: string;
  artists: MusicArtistRef[];
  albumTitle?: string | null;
  imageUrl?: string | null;
  durationMs?: number | null;
  releaseDate?: string | null;
  provider: ProviderName;
  externalId: string;
  isDemo?: boolean;
}

export interface MusicAlbumMeta {
  id: string;
  title: string;
  artists: MusicArtistRef[];
  imageUrl?: string | null;
  releaseDate?: string | null;
  trackCount?: number | null;
  provider: ProviderName;
  externalId: string;
  isDemo?: boolean;
}

export interface MusicArtistMeta {
  id: string;
  name: string;
  imageUrl?: string | null;
  genres?: string[];
  followers?: number | null;
  provider: ProviderName;
  externalId: string;
  claimState?: ClaimState;
  isDemo?: boolean;
}

export interface TokenSummary {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  imageUrl?: string | null;
  status: TokenStatus;
  musicItemId?: string | null;
  attributionVersion: number;
  discoveryDisabled: boolean;
  isDemo?: boolean;
}

export interface FeeClaimInput {
  idempotencyKey: string;
  mint: string;
  grossAmount: MoneyString;
  artistBps: BasisPoints;
  protocolBps: BasisPoints;
  /** Optional artist id to credit; defaults to protocol holding artist bucket */
  artistId?: string;
  tokenId?: string;
  sourceTxSig?: string;
  isDemo?: boolean;
}

export interface FeeClaimResult {
  feeClaimId: string;
  idempotencyKey: string;
  mint: string;
  grossAmount: MoneyString;
  artistAmount: MoneyString;
  protocolAmount: MoneyString;
  artistBalanceId: string | null;
  protocolBalanceId: string;
  alreadyProcessed: boolean;
  status: FeeClaimStatus;
}

export interface CreatePayoutInput {
  idempotencyKey: string;
  destinationAddr: string;
  /** Artist balance IDs to include */
  artistBalanceIds: string[];
  walletId?: string;
  chain?: string;
  currency?: string;
  isDemo?: boolean;
}

export interface PayoutResult {
  payoutId: string;
  idempotencyKey: string;
  totalAmount: MoneyString;
  status: PayoutStatus;
  itemCount: number;
  alreadyExists: boolean;
}

export interface ProtocolStats {
  totalFeesCollected: MoneyString;
  totalArtistObligations: MoneyString;
  totalProtocolObligations: MoneyString;
  totalPaidOut: MoneyString;
  activeTokens: number;
  verifiedArtists: number;
  unclaimedArtists: number;
  isDemo: boolean;
}

export interface ActivityFeedItem {
  id: string;
  type:
    | "FEE_CLAIM"
    | "PAYOUT"
    | "TRADE"
    | "CLAIM"
    | "TOKEN_LAUNCH"
    | "VERIFICATION";
  title: string;
  subtitle?: string;
  amount?: MoneyString;
  mint?: string;
  artistName?: string;
  timestamp: string;
  isDemo: boolean;
}

export interface DemoDataset {
  isDemo: true;
  tokens: DemoToken[];
  artists: DemoArtist[];
  payments: DemoPayment[];
  trades: DemoTrade[];
  activity: ActivityFeedItem[];
  protocolStats: ProtocolStats;
}

export interface DemoToken {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  imageUrl: string;
  musicTitle: string;
  artistNames: string[];
  priceUsd: MoneyString;
  marketCapUsd: MoneyString;
  volume24hUsd: MoneyString;
  feesGeneratedUsd: MoneyString;
  artistAllocationBps: BasisPoints;
  chain: string;
  launchpad: string;
  launchedAt: string;
  attributionVersion: number;
  discoveryDisabled: boolean;
  isDemo: true;
}

export interface DemoArtist {
  id: string;
  displayName: string;
  slug: string;
  imageUrl: string;
  claimState: ClaimState;
  balanceUsd: MoneyString;
  totalFeesUsd: MoneyString;
  artistAllocationBps: BasisPoints;
  tokenCount: number;
  isDemo: true;
}

export interface DemoPayment {
  id: string;
  artistName: string;
  artistId?: string;
  mint: string;
  symbol: string;
  amount: MoneyString;
  timestamp: string;
  status: PayoutStatus;
  txSignature?: string;
  isDemo: true;
}

export interface DemoTrade {
  id: string;
  mint: string;
  symbol: string;
  side: TradeSide;
  priceUsd: MoneyString;
  amountUsd: MoneyString;
  timestamp: string;
  isDemo: true;
}

export type Permission =
  | "admin:read"
  | "admin:write"
  | "claims:review"
  | "finance:read"
  | "finance:payout"
  | "tokens:moderate"
  | "settings:write"
  | "audit:read";

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    "admin:read",
    "admin:write",
    "claims:review",
    "finance:read",
    "finance:payout",
    "tokens:moderate",
    "settings:write",
    "audit:read",
  ],
  MODERATOR: [
    "admin:read",
    "claims:review",
    "tokens:moderate",
    "audit:read",
  ],
  FINANCE: ["admin:read", "finance:read", "finance:payout", "audit:read"],
  READONLY: ["admin:read", "finance:read", "audit:read"],
} as const;
