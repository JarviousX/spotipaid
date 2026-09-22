import { z } from "zod";
import { nanoid } from "nanoid";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { getMusicProvider } from "@/providers/music";
import { getConfig, DEFAULT_ARTIST_BPS, DEFAULT_PROTOCOL_BPS } from "@/lib/config";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getPublicProtocolConfig, requireLaunchFeeWallet } from "@/services/protocol-config";
import type {
  DemoToken,
  MusicAlbumMeta,
  MusicArtistMeta,
  MusicTrackMeta,
  SpotifyEntityType,
} from "@/types/domain";

export class LaunchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaunchError";
  }
}

export type ResolvedMusic = {
  type: SpotifyEntityType;
  meta: MusicTrackMeta | MusicAlbumMeta | MusicArtistMeta;
  isDemo: boolean;
};

export type TokenDraft = {
  symbol: string;
  name: string;
  imageUrl: string | null;
  musicTitle: string;
  artistNames: string[];
  suggestedMintLabel: string;
  feeConfig: {
    artistBps: number;
    protocolBps: number;
    source: "protocol_settings" | "env_default";
  };
  music: ResolvedMusic;
  isDemo: boolean;
};

export type RegisterTokenInput = {
  symbol: string;
  name: string;
  mint?: string;
  imageUrl?: string | null;
  musicUrl?: string;
  musicExternalId?: string;
  musicType?: SpotifyEntityType;
  artistNames?: string[];
  musicTitle?: string;
  paymentSignature?: string;
  walletAddress?: string;
  authMode?: "wallet" | "walletless" | "register";
};

export function launchFeeLamports(): number {
  const sol = getConfig().fees.launchFeeSol;
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export async function getLaunchQuote(): Promise<{
  feeWallet: string | null;
  launchFeeSol: number;
  launchFeeLamports: number;
  artistBps: number;
  protocolBps: number;
}> {
  const fees = getConfig().fees;
  let feeWallet: string | null = null;
  try {
    feeWallet = await requireLaunchFeeWallet();
  } catch {
    const protocol = await getPublicProtocolConfig();
    feeWallet = protocol.feeWallet;
  }
  return {
    feeWallet,
    launchFeeSol: fees.launchFeeSol,
    launchFeeLamports: launchFeeLamports(),
    artistBps: fees.artistBps,
    protocolBps: fees.protocolBps,
  };
}

function solanaRpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com"
  );
}

/**
 * Confirm a SystemProgram SOL transfer to the protocol fee wallet.
 */
export async function verifyLaunchPayment(input: {
  signature: string;
  fromWallet: string;
  expectedLamports: number;
  feeWallet: string;
}): Promise<void> {
  const connection = new Connection(solanaRpcUrl(), "confirmed");
  const tx = await connection.getParsedTransaction(input.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx || !tx.meta || tx.meta.err) {
    throw new LaunchError("Launch fee transaction not found or failed");
  }

  const feeWallet = new PublicKey(input.feeWallet).toBase58();
  const fromWallet = new PublicKey(input.fromWallet).toBase58();
  let paid = 0;

  for (const ix of tx.transaction.message.instructions) {
    if (!("parsed" in ix) || !ix.parsed) continue;
    if (ix.program !== "system" && ix.programId?.toString() !== SystemProgram.programId.toBase58()) {
      continue;
    }
    const parsed = ix.parsed as {
      type?: string;
      info?: { source?: string; destination?: string; lamports?: number };
    };
    if (parsed.type !== "transfer" || !parsed.info) continue;
    if (
      parsed.info.source === fromWallet &&
      parsed.info.destination === feeWallet &&
      typeof parsed.info.lamports === "number"
    ) {
      paid += parsed.info.lamports;
    }
  }

  if (paid < input.expectedLamports) {
    throw new LaunchError(
      `Launch fee payment incomplete (got ${paid} lamports, need ${input.expectedLamports})`,
    );
  }
}

export type RegisteredToken = DemoToken & {
  status: "ACTIVE";
  feeArtistBps: number;
  feeProtocolBps: number;
};

const registerSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(2)
    .max(12)
    .regex(/^[A-Za-z0-9]+$/, "Symbol must be alphanumeric"),
  name: z.string().trim().min(1).max(80),
  mint: z.string().trim().min(32).max(44).optional(),
  imageUrl: z.string().url().nullable().optional(),
  musicUrl: z.string().trim().min(1).optional(),
  musicExternalId: z.string().trim().min(1).optional(),
  musicType: z.enum(["track", "album", "artist", "playlist"]).optional(),
  artistNames: z.array(z.string().trim().min(1)).max(8).optional(),
  musicTitle: z.string().trim().min(1).max(120).optional(),
  paymentSignature: z.string().trim().min(64).max(128).optional(),
  walletAddress: z.string().trim().min(32).max(64).optional(),
  authMode: z.enum(["wallet", "walletless", "register"]).optional(),
});

/** In-memory demo registry when Prisma is unavailable */
const memoryTokens: RegisteredToken[] = [];

function slugifySymbol(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function suggestSymbolFromTitle(title: string): string {
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);
  if (words.length === 0) return "TRACK";
  if (words.length === 1) return slugifySymbol(words[0]).slice(0, 6) || "TRACK";
  return slugifySymbol(words.map((w) => w[0]).join("") + words[0].slice(0, 3));
}

function artistNamesFromMeta(
  meta: MusicTrackMeta | MusicAlbumMeta | MusicArtistMeta,
): string[] {
  if ("artists" in meta && Array.isArray(meta.artists)) {
    return meta.artists.map((a) => a.name);
  }
  if ("name" in meta && typeof meta.name === "string") {
    return [meta.name];
  }
  return [];
}

function titleFromMeta(
  meta: MusicTrackMeta | MusicAlbumMeta | MusicArtistMeta,
): string {
  if ("title" in meta && typeof meta.title === "string") return meta.title;
  if ("name" in meta && typeof meta.name === "string") return meta.name;
  return "Untitled";
}

function imageFromMeta(
  meta: MusicTrackMeta | MusicAlbumMeta | MusicArtistMeta,
): string | null {
  return meta.imageUrl ?? null;
}

export async function getProtocolFeeConfig(): Promise<{
  artistBps: number;
  protocolBps: number;
  source: "protocol_settings" | "env_default";
}> {
  const fallback = {
    artistBps: getConfig().fees.artistBps || DEFAULT_ARTIST_BPS,
    protocolBps: getConfig().fees.protocolBps || DEFAULT_PROTOCOL_BPS,
    source: "env_default" as const,
  };

  try {
    const fee = await prisma.feeConfig.findFirst({
      where: { isDefault: true },
    });
    if (fee) {
      return {
        artistBps: fee.artistBps,
        protocolBps: fee.protocolBps,
        source: "protocol_settings",
      };
    }
    const artistSetting = await prisma.protocolSetting.findUnique({
      where: { key: "fee.artist_bps" },
    });
    const protocolSetting = await prisma.protocolSetting.findUnique({
      where: { key: "fee.protocol_bps" },
    });
    if (artistSetting && protocolSetting) {
      const artistBps = Number.parseInt(artistSetting.value, 10);
      const protocolBps = Number.parseInt(protocolSetting.value, 10);
      if (
        Number.isFinite(artistBps) &&
        Number.isFinite(protocolBps) &&
        artistBps + protocolBps === 10_000
      ) {
        return { artistBps, protocolBps, source: "protocol_settings" };
      }
    }
  } catch {
    /* use env defaults */
  }

  return fallback;
}

export async function resolveMusicFromUrl(url: string): Promise<ResolvedMusic> {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new LaunchError("Music URL is required");
  }

  const provider = getMusicProvider();
  const resolved = await provider.resolveUrl(trimmed);
  if (!resolved) {
    throw new LaunchError("Could not resolve that Spotify link");
  }

  return {
    type: resolved.type,
    meta: resolved.meta,
    isDemo: provider.isDemo || Boolean(resolved.meta.isDemo),
  };
}

export type MusicSearchHit = {
  type: "track" | "artist";
  title: string;
  subtitle: string;
  imageUrl: string | null;
  externalId: string;
  spotifyUrl: string;
};

export async function searchMusicCatalog(
  query: string,
  limit = 8,
): Promise<{ tracks: MusicSearchHit[]; artists: MusicSearchHit[] }> {
  const q = query.trim();
  if (!q) {
    return { tracks: [], artists: [] };
  }

  const provider = getMusicProvider();
  const [tracks, artists] = await Promise.all([
    provider.searchTracks(q, limit),
    provider.searchArtists(q, Math.min(4, limit)),
  ]);

  return {
    tracks: tracks.map((t) => ({
      type: "track" as const,
      title: t.title,
      subtitle: t.artists.map((a) => a.name).join(", "),
      imageUrl: t.imageUrl ?? null,
      externalId: t.externalId,
      spotifyUrl: `https://open.spotify.com/track/${t.externalId}`,
    })),
    artists: artists.map((a) => ({
      type: "artist" as const,
      title: a.name,
      subtitle: "Artist",
      imageUrl: a.imageUrl ?? null,
      externalId: a.externalId,
      spotifyUrl: `https://open.spotify.com/artist/${a.externalId}`,
    })),
  };
}

export async function buildTokenDraft(
  music: ResolvedMusic,
): Promise<TokenDraft> {
  const feeConfig = await getProtocolFeeConfig();
  const musicTitle = titleFromMeta(music.meta);
  const artistNames = artistNamesFromMeta(music.meta);
  const symbol = suggestSymbolFromTitle(musicTitle);

  return {
    symbol,
    name: musicTitle,
    imageUrl: imageFromMeta(music.meta),
    musicTitle,
    artistNames,
    suggestedMintLabel: `demo_${symbol.toLowerCase()}_${nanoid(6)}`,
    feeConfig,
    music,
    isDemo: music.isDemo,
  };
}

function demoMint(): string {
  // Valid-looking base58 length without 0/O/I/l
  const alphabet =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "Dm";
  for (let i = 0; i < 36; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out.slice(0, 40);
}

export async function registerToken(
  input: RegisterTokenInput,
): Promise<RegisteredToken & { paymentSignature?: string }> {
  const parsed = registerSchema.parse(input);
  const feeConfig = await getProtocolFeeConfig();

  // Never trust client fee amounts — server owns splits
  const artistBps = feeConfig.artistBps;
  const protocolBps = feeConfig.protocolBps;

  const authMode = parsed.authMode ?? "wallet";
  if (authMode === "wallet") {
    // Always resolve fee wallet server-side — never trust the client destination.
    let feeWallet: string;
    try {
      feeWallet = await requireLaunchFeeWallet();
    } catch (err) {
      throw new LaunchError(
        err instanceof Error
          ? err.message
          : "Fee wallet is not configured in /adm1n.",
      );
    }
    if (!parsed.walletAddress || !parsed.paymentSignature) {
      throw new LaunchError(
        "Wallet launch requires a connected wallet and launch-fee payment.",
      );
    }
    await verifyLaunchPayment({
      signature: parsed.paymentSignature,
      fromWallet: parsed.walletAddress,
      expectedLamports: launchFeeLamports(),
      feeWallet,
    });
  }

  let musicTitle = parsed.musicTitle ?? parsed.name;
  let artistNames = parsed.artistNames ?? [];
  let imageUrl = parsed.imageUrl ?? null;
  let isDemo = true;

  if (parsed.musicUrl) {
    const resolved = await resolveMusicFromUrl(parsed.musicUrl);
    const draft = await buildTokenDraft(resolved);
    musicTitle = draft.musicTitle;
    artistNames = draft.artistNames.length ? draft.artistNames : artistNames;
    imageUrl = imageUrl ?? draft.imageUrl;
    isDemo = resolved.isDemo;
  }

  const mint = parsed.mint ?? demoMint();
  const symbol = parsed.symbol.toUpperCase();

  const record: RegisteredToken = {
    id: `token_${nanoid(10)}`,
    mint,
    symbol,
    name: parsed.name,
    imageUrl: imageUrl ?? "",
    musicTitle,
    artistNames,
    priceUsd: "0.000000",
    marketCapUsd: "0.000000",
    volume24hUsd: "0.000000",
    feesGeneratedUsd: "0.000000",
    artistAllocationBps: artistBps,
    chain: "Solana",
    launchpad: "pump.fun",
    launchedAt: new Date().toISOString(),
    attributionVersion: 1,
    discoveryDisabled: false,
    isDemo: true,
    status: "ACTIVE",
    feeArtistBps: artistBps,
    feeProtocolBps: protocolBps,
  };

  try {
    const musicItem = await prisma.musicItem.create({
      data: {
        type: "TRACK",
        title: musicTitle,
        imageUrl,
        isDemo,
        discoveryDisabled: false,
      },
    });

    const token = await prisma.token.create({
      data: {
        id: record.id,
        mint,
        symbol,
        name: parsed.name,
        imageUrl,
        musicItemId: musicItem.id,
        attributionVersion: 1,
        status: "ACTIVE",
        discoveryDisabled: false,
        isDemo,
      },
    });

    await writeAuditLog({
      action: "token.register",
      entityType: "Token",
      entityId: token.id,
      metadata: {
        mint,
        symbol,
        artistBps,
        protocolBps,
        isDemo,
        authMode,
        walletAddress: parsed.walletAddress ?? null,
        paymentSignature: parsed.paymentSignature ?? null,
        launchFeeLamports: authMode === "wallet" ? launchFeeLamports() : 0,
      },
    });

    return {
      ...record,
      id: token.id,
      isDemo: true,
      paymentSignature: parsed.paymentSignature,
    };
  } catch (err) {
    if (err instanceof LaunchError) throw err;
    memoryTokens.unshift(record);
    return { ...record, paymentSignature: parsed.paymentSignature };
  }
}

export function listMemoryRegisteredTokens(): RegisteredToken[] {
  return [...memoryTokens];
}

/** Test helper */
export function resetMemoryRegisteredTokens(): void {
  memoryTokens.length = 0;
}
