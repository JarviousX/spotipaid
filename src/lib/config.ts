/**
 * App configuration from environment.
 * Fee splits default to 80/20 (8000/2000 bps) matching protocol settings.
 */

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  if (v === undefined || v === "") return fallback;
  return v === "1" || v === "true" || v === "yes";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback = ""): string {
  return process.env[key]?.trim() ?? fallback;
}

export const DEFAULT_ARTIST_BPS = 8000;
export const DEFAULT_PROTOCOL_BPS = 2000;

export const config = {
  appName: "SpotiPaid",
  isDemoMode: envBool("DEMO_MODE", true),
  databaseUrl: envString("DATABASE_URL", "file:./dev.db"),

  fees: {
    artistBps: envInt("FEE_ARTIST_BPS", DEFAULT_ARTIST_BPS),
    protocolBps: envInt("FEE_PROTOCOL_BPS", DEFAULT_PROTOCOL_BPS),
    /** SOL charged on wallet-connected Launch, sent to protocol.fee_wallet */
    launchFeeSol: Number.parseFloat(envString("LAUNCH_FEE_SOL", "0.05")) || 0.05,
  },

  spotify: {
    clientId: envString("SPOTIFY_CLIENT_ID"),
    clientSecret: envString("SPOTIFY_CLIENT_SECRET"),
    get configured() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },

  solana: {
    rpcUrl: envString("SOLANA_RPC_URL"),
  },

  admin: {
    jwtSecret: envString("ADMIN_JWT_SECRET", "dev-only-change-me"),
    /** bcrypt hash of the admin passphrase — never store plaintext in code */
    passphraseHash: envString("ADMIN_PASSPHRASE_HASH"),
    /** Short-lived sessions for privileged console (default 1h) */
    sessionTtlSeconds: envInt("ADMIN_SESSION_TTL", 60 * 60),
  },

  features: {
    enableArtistClaims: envBool("FEATURE_ARTIST_CLAIMS", true),
    enablePayouts: envBool("FEATURE_PAYOUTS", true),
    enableLaunchpadIngest: envBool("FEATURE_LAUNCHPAD_INGEST", true),
    enablePublicDiscovery: envBool("FEATURE_PUBLIC_DISCOVERY", true),
    enableAdminImpersonation: envBool("FEATURE_ADMIN_IMPERSONATION", false),
  },
} as const;

export type AppConfig = typeof config;

export function getConfig(): AppConfig {
  return config;
}
