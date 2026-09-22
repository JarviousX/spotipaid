import { isValidSolanaAddress, validateSolanaAddress } from "@/domain/wallet";
import type {
  ChainAdapter,
  ChainTokenInfo,
  LaunchpadAdapter,
  LaunchpadToken,
} from "@/providers/types";

/**
 * Solana chain adapter.
 * Live RPC optional via SOLANA_RPC_URL; otherwise returns demo-safe stubs.
 */
export function createSolanaChainAdapter(): ChainAdapter {
  const rpcUrl = process.env.SOLANA_RPC_URL?.trim();
  const isDemo = !rpcUrl;

  return {
    chain: "solana",
    isDemo,

    isValidAddress(address: string) {
      return isValidSolanaAddress(address);
    },

    async getTokenInfo(mint: string): Promise<ChainTokenInfo | null> {
      try {
        validateSolanaAddress(mint);
      } catch {
        return null;
      }

      if (!rpcUrl) {
        return {
          mint,
          symbol: "DEMO",
          name: "Demo Token",
          decimals: 6,
          supply: "1000000000",
        };
      }

      // Minimal JSON-RPC getAccountInfo — metadata enrichment left to market provider
      try {
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [mint, { encoding: "base64" }],
          }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          result?: { value?: unknown };
        };
        if (!data.result?.value) return null;
        return {
          mint,
          symbol: "UNKNOWN",
          name: "Solana Token",
          decimals: 6,
        };
      } catch {
        return null;
      }
    },

    async getBalance(address: string, mint?: string) {
      void mint;
      validateSolanaAddress(address);
      if (!rpcUrl) {
        return "0.000000";
      }
      try {
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [address],
          }),
        });
        if (!res.ok) return "0.000000";
        const data = (await res.json()) as {
          result?: { value?: number };
        };
        const lamports = data.result?.value ?? 0;
        // SOL has 9 decimals — return decimal string
        return (lamports / 1e9).toFixed(9);
      } catch {
        return "0.000000";
      }
    },
  };
}

export const solanaChainAdapter = createSolanaChainAdapter();

/**
 * Abstract pump.fun-style launchpad adapter.
 * Returns demo listings when no API key is configured.
 */
export function createPumpFunLaunchpadAdapter(): LaunchpadAdapter {
  const apiKey = process.env.PUMPFUN_API_KEY?.trim();
  const isDemo = !apiKey;

  const demoTokens: LaunchpadToken[] = [
    {
      mint: "NvAE11isDemoMint1111111111111111111111",
      symbol: "NOVA",
      name: "Midnight Voltage [DEMO]",
      imageUrl:
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
      bondingCurveProgress: 0.72,
      marketCapUsd: "184200.00",
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      launchpadSlug: "pumpfun",
    },
    {
      mint: "GLassHarborDemoMint2222222222222222222",
      symbol: "GLASS",
      name: "Glass Harbor [DEMO]",
      imageUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      bondingCurveProgress: 0.41,
      marketCapUsd: "52300.00",
      createdAt: new Date(Date.now() - 172_800_000).toISOString(),
      launchpadSlug: "pumpfun",
    },
  ];

  return {
    name: "pump.fun",
    isDemo,

    async getToken(mint: string) {
      if (isDemo) {
        return demoTokens.find((t) => t.mint === mint) ?? null;
      }
      // Live pump.fun integration would go here when API key is present
      return demoTokens.find((t) => t.mint === mint) ?? null;
    },

    async listRecent(limit = 20) {
      return demoTokens.slice(0, limit);
    },
  };
}

export const pumpFunLaunchpadAdapter = createPumpFunLaunchpadAdapter();
