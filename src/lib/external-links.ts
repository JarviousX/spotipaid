export function solscanTokenUrl(mint: string): string {
  return `https://solscan.io/token/${encodeURIComponent(mint)}`;
}

export function launchpadTokenUrl(launchpad: string, mint: string): string {
  const slug = launchpad.toLowerCase();
  if (slug.includes("pump")) {
    return `https://pump.fun/coin/${encodeURIComponent(mint)}`;
  }
  if (slug.includes("bonk")) {
    return `https://letsbonk.fun/token/${encodeURIComponent(mint)}`;
  }
  if (slug.includes("moon")) {
    return `https://moonshot.com/token/${encodeURIComponent(mint)}`;
  }
  return `https://solscan.io/token/${encodeURIComponent(mint)}`;
}

export function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

/** Deterministic demo holder estimate from mint + market cap */
export function estimateHolders(mint: string, marketCapUsd: string): number {
  let hash = 0;
  for (let i = 0; i < mint.length; i++) {
    hash = (hash * 31 + mint.charCodeAt(i)) >>> 0;
  }
  const mcap = Number.parseFloat(marketCapUsd) || 0;
  const base = Math.max(24, Math.floor(mcap / 95));
  return base + (hash % 180);
}
