import type {
  ClaimState,
  MoneyString,
  MusicAlbumMeta,
  MusicArtistMeta,
  MusicTrackMeta,
  SpotifyEntityType,
} from "@/types/domain";

/** Music catalog provider (Spotify, Demo, …). Never downloads audio. */
export interface MusicProvider {
  readonly name: string;
  readonly isDemo: boolean;

  getTrack(externalId: string): Promise<MusicTrackMeta | null>;
  getAlbum(externalId: string): Promise<MusicAlbumMeta | null>;
  getArtist(externalId: string): Promise<MusicArtistMeta | null>;
  searchTracks(query: string, limit?: number): Promise<MusicTrackMeta[]>;
  searchArtists(query: string, limit?: number): Promise<MusicArtistMeta[]>;
  resolveUrl(urlOrUri: string): Promise<{
    type: SpotifyEntityType;
    meta: MusicTrackMeta | MusicAlbumMeta | MusicArtistMeta;
  } | null>;
}

export interface ChainTokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply?: string;
}

export interface ChainTxResult {
  signature: string;
  slot?: number;
  confirmed: boolean;
}

/** On-chain adapter (Solana, …) */
export interface ChainAdapter {
  readonly chain: string;
  readonly isDemo: boolean;

  getTokenInfo(mint: string): Promise<ChainTokenInfo | null>;
  getBalance(address: string, mint?: string): Promise<MoneyString>;
  isValidAddress(address: string): boolean;
}

export interface LaunchpadToken {
  mint: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  bondingCurveProgress?: number;
  marketCapUsd?: MoneyString;
  createdAt?: string;
  launchpadSlug: string;
}

/** Abstract launchpad (e.g. pump.fun) — implementations may be stubs */
export interface LaunchpadAdapter {
  readonly name: string;
  readonly isDemo: boolean;

  getToken(mint: string): Promise<LaunchpadToken | null>;
  listRecent(limit?: number): Promise<LaunchpadToken[]>;
}

export interface MarketQuote {
  mint: string;
  priceUsd: MoneyString;
  marketCapUsd?: MoneyString;
  volume24hUsd?: MoneyString;
  change24hPct?: number;
  asOf: string;
}

export interface MarketDataProvider {
  readonly name: string;
  readonly isDemo: boolean;

  getQuote(mint: string): Promise<MarketQuote | null>;
  getQuotes(mints: string[]): Promise<MarketQuote[]>;
}

export interface PayoutRequest {
  destinationAddr: string;
  amount: MoneyString;
  currency: string;
  memo?: string;
  idempotencyKey: string;
}

export interface PayoutSubmission {
  providerRef: string;
  status: "SUBMITTED" | "CONFIRMED" | "FAILED";
  txSignature?: string;
}

export interface PayoutProvider {
  readonly name: string;
  readonly isDemo: boolean;

  submitPayout(request: PayoutRequest): Promise<PayoutSubmission>;
  getPayoutStatus(providerRef: string): Promise<PayoutSubmission>;
}

export interface VerificationEvidence {
  artistId: string;
  evidenceUrl?: string;
  evidenceNotes?: string;
  socialHandles?: Record<string, string>;
}

export interface VerificationDecision {
  artistId: string;
  status: ClaimState;
  notes?: string;
  reviewedAt: string;
}

export interface ArtistVerificationProvider {
  readonly name: string;
  readonly isDemo: boolean;

  submitClaim(evidence: VerificationEvidence): Promise<{ claimId: string }>;
  getClaimStatus(claimId: string): Promise<VerificationDecision | null>;
}
