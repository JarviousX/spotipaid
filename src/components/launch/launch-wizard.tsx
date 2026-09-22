"use client";

import { Artwork } from "@/components/ui/artwork";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { WalletlessGuide } from "@/components/launch/walletless-guide";
import { cn } from "@/lib/cn";
import { formatPercent, truncateAddress } from "@/lib/utils";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Fingerprint,
  Loader2,
  Music2,
  Rocket,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type LaunchpadOption = "pump.fun" | "letsbonk" | "moonshot";
type AuthMode = "wallet" | "walletless" | "register";
type LaunchState = "idle" | "pending" | "success" | "failure";

type ResolvedMusicResponse = {
  type: string;
  meta: {
    id: string;
    title?: string;
    name?: string;
    imageUrl?: string | null;
    artists?: Array<{ id: string; name: string; imageUrl?: string | null }>;
    albumTitle?: string | null;
    provider: string;
    externalId: string;
    isDemo?: boolean;
  };
  spotifyUrl: string;
  isDemo: boolean;
  attribution: string;
};

const LAUNCHPADS: LaunchpadOption[] = ["pump.fun", "letsbonk", "moonshot"];

const AUTH_MODES: Array<{
  id: AuthMode;
  label: string;
  blurb: string;
  icon: typeof Wallet;
}> = [
  {
    id: "wallet",
    label: "Wallet",
    blurb: "Sign with Phantom or Solflare",
    icon: Wallet,
  },
  {
    id: "walletless",
    label: "Walletless",
    blurb: "Fee share on pump.fun",
    icon: Sparkles,
  },
  {
    id: "register",
    label: "Register",
    blurb: "Create a launcher identity",
    icon: Fingerprint,
  },
];

const LAUNCHER_KEY = "spotipaid.launcher";

type LauncherProfile = {
  email: string;
  displayName: string;
  registeredAt: string;
};

type MusicHit = {
  type: "track" | "artist";
  title: string;
  subtitle: string;
  imageUrl: string | null;
  externalId: string;
  spotifyUrl: string;
};

function looksLikeSpotifyUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v.includes("open.spotify.com/") ||
    v.startsWith("spotify:") ||
    /^https?:\/\/spotify\.link\//.test(v)
  );
}

function buildAttributionRef(externalId: string, type: string): string {
  return `spotipaid:ref=${type}:${externalId};v=1`;
}

function musicTitle(meta: ResolvedMusicResponse["meta"]): string {
  return meta.title ?? meta.name ?? "Untitled";
}

function musicArtists(meta: ResolvedMusicResponse["meta"]): string[] {
  if (meta.artists?.length) return meta.artists.map((a) => a.name);
  if (meta.name) return [meta.name];
  return [];
}

function suggestTicker(title: string): string {
  return (
    title
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
      .filter(Boolean)
      .slice(0, 2)
      .map((w, i) => (i === 0 ? w.slice(0, 4) : w.slice(0, 2)))
      .join("")
      .toUpperCase()
      .slice(0, 8) || "MUSIC"
  );
}

function loadLauncher(): LauncherProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAUNCHER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LauncherProfile;
    if (!parsed.email || !parsed.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

function initialLauncher(): {
  profile: LauncherProfile | null;
  email: string;
  name: string;
} {
  const profile = loadLauncher();
  return {
    profile,
    email: profile?.email ?? "",
    name: profile?.displayName ?? "",
  };
}

function saveLauncher(profile: LauncherProfile) {
  localStorage.setItem(LAUNCHER_KEY, JSON.stringify(profile));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export interface LaunchWizardProps {
  demo?: boolean;
  artistBps: number;
  protocolBps: number;
}

export function LaunchWizard({
  demo = true,
  artistBps,
  protocolBps,
}: LaunchWizardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();

  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedMusicResponse | null>(null);
  const [searchHits, setSearchHits] = useState<MusicHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [feeWallet, setFeeWallet] = useState<string | null>(null);
  const [launchFeeSol, setLaunchFeeSol] = useState(0.05);

  const [tokenName, setTokenName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [tokenImage, setTokenImage] = useState("");
  const [artists, setArtists] = useState<string[]>([]);
  const [launchpad, setLaunchpad] = useState<LaunchpadOption>("pump.fun");
  const [confirmed, setConfirmed] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>("wallet");
  const [launcherBoot] = useState(initialLauncher);
  const [launcher, setLauncher] = useState<LauncherProfile | null>(
    launcherBoot.profile,
  );
  const [regEmail, setRegEmail] = useState(launcherBoot.email);
  const [regName, setRegName] = useState(launcherBoot.name);

  const [launchState, setLaunchState] = useState<LaunchState>("idle");
  const [launchError, setLaunchError] = useState<string | null>(null);

  const attributionLine = useMemo(() => {
    if (!resolved) return "";
    return buildAttributionRef(resolved.meta.externalId, resolved.type);
  }, [resolved]);

  const artistPct = formatPercent(artistBps);
  const protocolPct = formatPercent(protocolBps);
  const launchFeeLamports = Math.round(launchFeeSol * LAMPORTS_PER_SOL);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/launch")
      .then((r) => r.json())
      .then(
        (data: {
          feeWallet?: string | null;
          launchFeeSol?: number;
        }) => {
          if (cancelled) return;
          if (typeof data.launchFeeSol === "number") {
            setLaunchFeeSol(data.launchFeeSol);
          }
          setFeeWallet(data.feeWallet ?? null);
        },
      )
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = spotifyUrl.trim();
    if (!q || looksLikeSpotifyUrl(q) || q.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/music/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          tracks?: MusicHit[];
          artists?: MusicHit[];
          error?: string;
        };
        if (!res.ok) {
          setSearchHits([]);
          return;
        }
        setSearchHits([...(data.tracks ?? []), ...(data.artists ?? [])]);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSearchHits([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [spotifyUrl]);

  const showSearchHits =
    !resolved &&
    spotifyUrl.trim().length >= 2 &&
    !looksLikeSpotifyUrl(spotifyUrl) &&
    searchHits.length > 0;

  function applyMusicSuggestions(data: ResolvedMusicResponse) {
    const title = musicTitle(data.meta);
    const names = musicArtists(data.meta);
    setTokenName(title);
    setTicker(suggestTicker(title));
    setTokenImage(data.meta.imageUrl ?? "");
    setArtists(names);
    setConfirmed(false);
    setDescription(
      `${title} — music-linked token on SpotiPaid. ${buildAttributionRef(data.meta.externalId, data.type)}`,
    );
  }

  async function resolveMusic(urlOverride?: string) {
    const url = (urlOverride ?? spotifyUrl).trim();
    if (!url) return;
    setResolveError(null);
    setResolveLoading(true);
    setSearchHits([]);
    try {
      const res = await fetch("/api/music/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as ResolvedMusicResponse & {
        error?: string;
        music?: ResolvedMusicResponse;
      };
      if (!res.ok) {
        setResolved(null);
        setResolveError(data.error ?? "Could not find that music.");
        return;
      }
      const music: ResolvedMusicResponse = {
        type: data.type ?? data.music!.type,
        meta: data.meta ?? data.music!.meta,
        spotifyUrl: data.spotifyUrl ?? url,
        isDemo: data.isDemo,
        attribution:
          data.attribution ??
          buildAttributionRef(
            (data.meta ?? data.music!.meta).externalId,
            data.type ?? data.music!.type,
          ),
      };
      setSpotifyUrl(music.spotifyUrl);
      setResolved(music);
      applyMusicSuggestions(music);
    } catch {
      setResolveError("Network error while finding music.");
      setResolved(null);
    } finally {
      setResolveLoading(false);
    }
  }

  async function pickSearchHit(hit: MusicHit) {
    setSpotifyUrl(hit.spotifyUrl);
    setSearchHits([]);
    await resolveMusic(hit.spotifyUrl);
  }

  function registerIdentity(): boolean {
    const email = regEmail.trim();
    const displayName = regName.trim();
    if (!isValidEmail(email) || displayName.length < 2) return false;
    const profile: LauncherProfile = {
      email,
      displayName,
      registeredAt: new Date().toISOString(),
    };
    saveLauncher(profile);
    setLauncher(profile);
    return true;
  }

  const authReady = (() => {
    if (authMode === "wallet") return Boolean(connected && publicKey);
    if (authMode === "walletless") return true;
    if (launcher) return true;
    return isValidEmail(regEmail) && regName.trim().length >= 2;
  })();

  const formReady =
    authMode === "walletless"
      ? false
      : Boolean(resolved) &&
        tokenName.trim().length > 0 &&
        ticker.trim().length >= 2 &&
        description.includes("spotipaid:ref=") &&
        artists.length > 0 &&
        confirmed &&
        authReady &&
        launchState !== "pending" &&
        (authMode !== "wallet" || Boolean(feeWallet));

  async function submitLaunch() {
    if (!formReady) return;

    if (authMode === "register" && !launcher) {
      if (!registerIdentity()) {
        setLaunchError("Enter a valid email and display name to register.");
        setLaunchState("failure");
        return;
      }
    }

    setLaunchState("pending");
    setLaunchError(null);

    try {
      let paymentSignature: string | undefined;

      if (authMode === "wallet") {
        if (!publicKey || !feeWallet) {
          throw new Error(
            feeWallet
              ? "Connect a wallet to pay the launch fee."
              : "Fee wallet is not configured in /adm1n.",
          );
        }

        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(feeWallet),
            lamports: launchFeeLamports,
          }),
        );
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        paymentSignature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(
          { signature: paymentSignature, blockhash, lastValidBlockHeight },
          "confirmed",
        );
      }

      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: ticker.trim(),
          name: tokenName.trim(),
          imageUrl: tokenImage.trim() || null,
          musicUrl: spotifyUrl.trim() || undefined,
          artistNames: artists,
          musicTitle: resolved ? musicTitle(resolved.meta) : tokenName,
          authMode,
          walletAddress:
            authMode === "wallet" ? publicKey?.toBase58() : undefined,
          paymentSignature,
          contactEmail:
            authMode === "register"
              ? (launcher?.email ?? regEmail.trim())
              : undefined,
          launcherName:
            authMode === "register"
              ? (launcher?.displayName ?? regName.trim())
              : undefined,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        mint?: string;
        token?: { mint?: string };
      };

      const mint = data.mint ?? data.token?.mint;
      if (!res.ok || !mint) {
        setLaunchState("failure");
        setLaunchError(data.error ?? "Launch failed.");
        return;
      }

      setLaunchState("success");
      router.push(`/token/${mint}`);
    } catch (err) {
      setLaunchState("failure");
      setLaunchError(
        err instanceof Error ? err.message : "Network error during launch.",
      );
    }
  }

  const previewReady = Boolean(resolved && tokenName);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:gap-4">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Protocol launch
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-none">
            Launch.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            {formatPercent(artistBps)} artist
            <span className="text-accent/40">·</span>
            {formatPercent(protocolBps)} protocol
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.15fr_0.85fr] lg:gap-4">
        {/* Left — configure */}
        <section className="launch-panel relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c]">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Music & token
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">
                01 · CONFIG
              </span>
            </div>

            <div className="relative space-y-2">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#5a5a5a]"
                    aria-hidden
                  />
                  <input
                    name="spotify-query"
                    placeholder="Search a song or paste a Spotify link…"
                    value={spotifyUrl}
                    onChange={(e) => {
                      setSpotifyUrl(e.target.value);
                      setResolved(null);
                      setSearchHits([]);
                      setResolveError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && spotifyUrl.trim()) {
                        e.preventDefault();
                        if (looksLikeSpotifyUrl(spotifyUrl)) {
                          void resolveMusic();
                        } else if (searchHits[0]) {
                          void pickSearchHit(searchHits[0]);
                        } else {
                          void resolveMusic();
                        }
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-[#2a2a2a] bg-[#111] py-2 pl-10 pr-3.5 text-sm text-white placeholder:text-[#5a5a5a] transition-colors focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/40"
                    autoComplete="off"
                  />
                </div>
                <Button
                  variant="accent"
                  className="h-11 shrink-0 rounded-xl px-4"
                  onClick={() => {
                    if (looksLikeSpotifyUrl(spotifyUrl)) void resolveMusic();
                    else if (searchHits[0]) void pickSearchHit(searchHits[0]);
                    else void resolveMusic();
                  }}
                  disabled={!spotifyUrl.trim() || resolveLoading}
                >
                  {resolveLoading || searchLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : looksLikeSpotifyUrl(spotifyUrl) ? (
                    "Resolve"
                  ) : (
                    "Find"
                  )}
                </Button>
              </div>

              {showSearchHits ? (
                <ul className="absolute z-20 max-h-64 w-full overflow-y-auto rounded-xl border border-[#2a2a2a] bg-[#0e0e0e] shadow-2xl shadow-black/50">
                  {searchHits.map((hit) => (
                    <li key={`${hit.type}-${hit.externalId}`}>
                      <button
                        type="button"
                        onClick={() => void pickSearchHit(hit)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#161616]"
                      >
                        <Artwork
                          src={hit.imageUrl}
                          alt=""
                          size={40}
                          className="rounded-md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {hit.title}
                          </p>
                          <p className="truncate text-xs text-[#8a8a8a]">
                            {hit.type === "track" ? hit.subtitle : "Artist"}
                          </p>
                        </div>
                        <Music2
                          className="size-3.5 shrink-0 text-[#555]"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {resolveError ? (
              <p className="text-xs text-danger">{resolveError}</p>
            ) : null}

            <AnimatePresence mode="wait">
              {resolved ? (
                <motion.div
                  key={resolved.meta.externalId}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#111]/80 p-2.5"
                >
                  <Artwork
                    src={resolved.meta.imageUrl}
                    alt={musicTitle(resolved.meta)}
                    size={52}
                    className="rounded-lg"
                    spotifyUrl={resolved.spotifyUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {musicTitle(resolved.meta)}
                    </p>
                    <p className="truncate text-xs text-[#8a8a8a]">
                      {musicArtists(resolved.meta).join(", ")}
                      {resolved.meta.albumTitle
                        ? ` · ${resolved.meta.albumTitle}`
                        : ""}
                    </p>
                  </div>
                  <Check className="size-4 shrink-0 text-accent" aria-hidden />
                </motion.div>
              ) : (
                <motion.p
                  key="empty-music"
                  initial={false}
                  className="rounded-xl border border-dashed border-[#222] px-3 py-4 text-center text-xs text-[#5a5a5a]"
                >
                  Search by song or artist name, or paste a Spotify URL.
                </motion.p>
              )}
            </AnimatePresence>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
                  Name
                </span>
                <input
                  name="token-name"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={!resolved}
                  className="h-10 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 text-sm text-white disabled:opacity-40 focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
                  Ticker
                </span>
                <input
                  name="token-ticker"
                  value={ticker}
                  onChange={(e) =>
                    setTicker(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 12),
                    )
                  }
                  disabled={!resolved}
                  className="h-10 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 font-mono text-sm text-white disabled:opacity-40 focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
                />
              </label>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
                Launchpad
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LAUNCHPADS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLaunchpad(opt)}
                    disabled={!resolved}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40",
                      launchpad === opt
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-[#2a2a2a] text-[#8a8a8a] hover:border-[#3a3a3a] hover:text-white",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-auto flex items-start gap-2.5 rounded-xl border border-[#222] bg-[#0a0a0a]/60 px-3 py-2.5 text-xs leading-relaxed text-[#9a9a9a]">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={!resolved || authMode === "walletless"}
                className="mt-0.5 accent-[#1DB954]"
              />
              <span>
                Artists, suggestions, fee routing, and irreversibility confirmed.
                Tokens do not grant music ownership or Spotify royalties.
              </span>
            </label>

            <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                Costs & fees
              </p>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[#8a8a8a]">Wallet launch fee</dt>
                  <dd className="font-mono font-semibold text-white">
                    {launchFeeSol} SOL
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[#8a8a8a]">Creator fee split</dt>
                  <dd className="font-mono text-accent">
                    {artistPct} / {protocolPct}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[#8a8a8a]">Extra claim cut</dt>
                  <dd className="font-mono text-[#8a8a8a]">None</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] leading-relaxed text-[#5a5a5a]">
                {authMode === "wallet"
                  ? `Launch pays ${launchFeeSol} SOL to the protocol fee wallet set in /adm1n.`
                  : authMode === "walletless"
                    ? "Walletless: no on-site payment — point pump.fun fee sharing at the protocol address."
                    : "Register attaches attribution to an existing mint without a launch fee."}
              </p>
            </div>
          </div>
        </section>

        {/* Right — preview + auth + launch */}
        <section className="launch-panel relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-accent/15 blur-3xl"
          />
          <div
            aria-hidden
            className="launch-scanline pointer-events-none absolute inset-0 opacity-[0.03]"
          />

          <div className="relative flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white">
                {authMode === "walletless" ? "Walletless" : "Preview"}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">
                02 · GO
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
                How you launch
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {AUTH_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const active = authMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAuthMode(mode.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border px-2.5 py-2.5 text-left transition-colors",
                        active
                          ? "border-accent/50 bg-accent/10"
                          : "border-[#222] bg-[#111]/50 hover:border-[#333]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-3.5",
                          active ? "text-accent" : "text-[#6b6b6b]",
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          active ? "text-white" : "text-[#9a9a9a]",
                        )}
                      >
                        {mode.label}
                      </span>
                      <span className="hidden text-[10px] leading-tight text-[#5a5a5a] sm:block">
                        {mode.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {authMode === "walletless" ? (
              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                <WalletlessGuide
                  feeWallet={feeWallet}
                  attributionLine={attributionLine}
                  artistPct={artistPct}
                  protocolPct={protocolPct}
                />
              </div>
            ) : (
              <>
                <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#1a1a1a] bg-[radial-gradient(ellipse_at_center,_rgba(29,185,84,0.08),_transparent_65%)] px-4 py-5">
                  <AnimatePresence mode="wait">
                    {previewReady ? (
                      <motion.div
                        key={ticker || "preview"}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={
                          reduceMotion ? undefined : { opacity: 0, scale: 0.98 }
                        }
                        className="flex w-full max-w-xs flex-col items-center text-center"
                      >
                        <div className="launch-art-ring relative rounded-2xl p-[2px]">
                          <Artwork
                            src={tokenImage || resolved?.meta.imageUrl}
                            alt={tokenName}
                            size={112}
                            className="rounded-[14px]"
                            priority
                          />
                        </div>
                        <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-white">
                          ${ticker || "—"}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-[#8a8a8a]">
                          {tokenName}
                        </p>
                        <p className="mt-2 text-[11px] text-[#6b6b6b]">
                          {artists.join(", ") || "—"} · {launchpad}
                        </p>
                        <div className="mt-4 flex w-full gap-1.5">
                          <div
                            className="h-1.5 rounded-full bg-accent"
                            style={{ width: `${artistBps / 100}%` }}
                            title="Artist"
                          />
                          <div
                            className="h-1.5 rounded-full bg-[#2a2a2a]"
                            style={{ width: `${protocolBps / 100}%` }}
                            title="Protocol"
                          />
                        </div>
                        <p className="mt-1.5 font-mono text-[10px] text-[#5a5a5a]">
                          FEE SPLIT LOCKED
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-preview"
                        className="flex flex-col items-center gap-2 text-center"
                      >
                        <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-[#2a2a2a] text-[#3a3a3a]">
                          <Rocket className="size-7" aria-hidden />
                        </div>
                        <p className="text-xs text-[#5a5a5a]">
                          Resolve music to see your token
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="min-h-[4.5rem]">
                  <AnimatePresence mode="wait">
                    {authMode === "wallet" ? (
                      <motion.div
                        key="wallet"
                        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        className="flex flex-wrap items-center gap-3"
                      >
                        <ConnectWalletButton />
                        {connected && publicKey ? (
                          <p className="font-mono text-xs text-success">
                            {truncateAddress(publicKey.toBase58(), 4)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#6b6b6b]">
                            Connect to pay {launchFeeSol} SOL launch fee
                          </p>
                        )}
                      </motion.div>
                    ) : null}

                    {authMode === "register" ? (
                      <motion.div
                        key="register"
                        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        className="space-y-1.5"
                      >
                        {launcher ? (
                          <p className="flex items-center gap-2 text-xs text-accent">
                            <Check className="size-3.5" aria-hidden />
                            Registered as {launcher.displayName} ·{" "}
                            {launcher.email}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#8a8a8a]">
                            Save a launcher identity on this device, then launch.
                          </p>
                        )}
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          <input
                            name="reg-name"
                            placeholder="Display name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="h-10 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 text-sm text-white placeholder:text-[#5a5a5a] focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
                          />
                          <input
                            type="email"
                            name="reg-email"
                            placeholder="Email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="h-10 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 text-sm text-white placeholder:text-[#5a5a5a] focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
                          />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {!feeWallet && authMode === "wallet" ? (
                  <p className="text-xs text-warning">
                    Protocol fee wallet missing — set it in /adm1n before wallet
                    launch.
                  </p>
                ) : null}

                {launchError ? (
                  <p className="text-xs text-danger">{launchError}</p>
                ) : null}

                <Button
                  variant="accent"
                  size="lg"
                  disabled={!formReady}
                  onClick={submitLaunch}
                  className="launch-cta h-12 w-full rounded-xl text-sm font-bold tracking-tight"
                >
                  {launchState === "pending" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {authMode === "wallet"
                        ? `Paying ${launchFeeSol} SOL…`
                        : "Launching…"}
                    </>
                  ) : launchState === "success" ? (
                    <>
                      <Check className="size-4" aria-hidden />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <Rocket className="size-4" aria-hidden />
                      {authMode === "register"
                        ? launcher
                          ? "Register token"
                          : "Register & launch"
                        : `Launch · ${launchFeeSol} SOL`}
                    </>
                  )}
                </Button>
              </>
            )}

            {attributionLine ? (
              <p className="truncate font-mono text-[10px] text-[#3a3a3a]">
                {attributionLine}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
