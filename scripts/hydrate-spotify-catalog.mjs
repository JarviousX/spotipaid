/**
 * Hydrate top Spotify artists via oEmbed (no client credentials).
 * Writes src/data/spotify-catalog.ts
 *
 * Usage: node scripts/hydrate-spotify-catalog.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Curated top Spotify artist IDs (verified public catalog IDs). */
const IDS = [
  "06HL4z0CvFAxyc27GXpf02", // Taylor Swift
  "3TVXtAsR1Inumwj472S9r4", // Drake
  "1Xyo4u8uXC1ZmMpatF05PJ", // The Weeknd
  "4q3ewBCX7sLwd24euuV69X", // Bad Bunny
  "66CXWjxzNUsdJxJ2JdwvnR", // Ariana Grande
  "1uNFoZAHBGtllmzznpCI3s", // Justin Bieber
  "7dGJo4pcD2V6zGLwrDAfg8", // Eminem
  "246dkjvS1zLTtiykXe5h60", // Post Malone
  "6qqNVTkY8uBg9cP3Jd7DAH", // Billie Eilish
  "6eUKZXaKkcviH0Ku9w2n3V", // Ed Sheeran
  "0Y5tJX1MQlPlqiwlOH1tJY", // Travis Scott
  "7tYKF4w9nC0nq9CsPZTHyP", // SZA
  "1McMsnEElThijjAcsXfBeN", // Olivia Rodrigo
  "5cj0lLjcoR7YOSnhnX0Po5", // Doja Cat
  "0du5cEVh5yTK9QJze8zA0C", // Bruno Mars
  "6vWDO969RrER2AmjNjJ6Hv", // Beyoncé (legacy id — may fail)
  "3rgPTg8zWj9nFTQR4fVDQQ", // Beyoncé alt
  "6M2wZ9GZgrQXHCFfjv46we", // Dua Lipa
  "4gzpq5DPGxSnKTe4SA8HAU", // Coldplay
  "2YZyLoL8N0Wb9xBt1NhZWg", // Kendrick Lamar
  "4dpARuHxo51G3z768sgnrY", // Adele
  "1dfeR4HaWDbWqFHLkxsg1d", // Queen
  "0EmeFodog0BfCgMzAIvKQp", // Shakira
  "1vyhD5VmyZ7KMfW5gqLgo5", // J Balvin
  "1RyvyyTE3xzB2ZywiAwp0i", // Future
  "4O15NlyKLIASxsJ0PrXPfz", // Lil Uzi Vert
  "5pKCCKE4uFGWh9HkEIyAe9", // Rihanna legacy
  "3X6OIL1nVwilde4Z3oqtWh", // Rihanna
  "64KEffDW9EtZ1y2vBYgq8T", // Marshmello
  "1Cs0zKBU1kc0i8ypK3B9ai", // David Guetta
  "3fMbdgg4jU18AjLCKBhRSm", // Michael Jackson
  "4tZwfgrHOc3mvqYlEYSvVi", // Daft Punk
  "7Ln80lUS6He07XvHI8qqHH", // Arctic Monkeys
  "0TnOYISbd1XYRBk9myaseg", // Pitbull
  "3AA28KZvwAUcZuOKwyblJQ", // Gorillaz
  "22bE4uQ6baNwSHPVcDxLCe", // The Rolling Stones
  "0k17h0D3J5VfsdmQ1iZtE9", // Pink Floyd
  "36QJpDe2go2KgaRleHCDTp", // Led Zeppelin
  "1HY2Jd0NmPuamShAr6KMms", // Lady Gaga
  "0hCNtLu0JehylgoiP8L4Gh", // Nicki Minaj
  "2wY79sveU1sp5g7SokKOiI", // Sam Smith
  "4nDoRrQiYLoBzwC5BhVJzF", // Camila Cabello
  "00FQb4jTyendYWaN8pK0wa", // Lana Del Rey
  "3qm84nBOXUEQ2vnTfUTTFC", // Guns N' Roses
  "0C8ZW7ezQVs4URX5aX7Kqx", // Selena Gomez
  "5YGY8feqx7naU7zA7talrv", // Miley Cyrus
  "6S2OmqARrzebv47j0o06el", // Katy Perry?
  "4kYSzw0XehGEZxUqHOaEWO", // check
  "1l7ZsJRRS8wlW3WqasZ3GO", // check
  "4Gso3d4CscC4e6yoe6d8mL", // Gunna?
  "5K4W6rqSEdHF5SzgOqXyHu", // Ye
  "0iEtIxbK0NIaTx7qG7xW0P", // Metro Boomin
  "4V8LnMpNeJZJPfrbylxETe", // ASAP Rocky
  "53XhwfbYqKCa1cC57qN8N7", // Imagine Dragons
  "7CajNmpbOovFozojdO8f0y", // Calvin Harris
  "6KImCVD70vtIoJWnq4nBnM", // Harry Styles
  "4Z8W4fKeB5YxbaeXBw9IxJ", // Radiohead
  "0L8ExT028jH3ddEcZwqmm1", // RHCP
  "6olE6TJLqED3RqFYJYJlnG", // Nirvana
  "3Nrfpe0tUJi4K4DXYWgRXI", // BTS
];

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function tickerFromName(name) {
  const cleaned = name.replace(/\$/g, "S").replace(/[^A-Za-z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ART";
  if (words.length === 1) return words[0].slice(0, 6).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

function demoMint(index) {
  const alphabet =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "Sp";
  const seed = `spotipaid${index}`.padEnd(40, "x");
  for (let i = 0; i < 38; i++) {
    out += alphabet[seed.charCodeAt(i % seed.length) % alphabet.length];
  }
  return out.slice(0, 40);
}

async function fetchArtist(id, attempt = 0) {
  const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(
    `https://open.spotify.com/artist/${id}`,
  )}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SpotiPaidCatalogBot/1.0" },
  });
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    return fetchArtist(id, attempt + 1);
  }
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.title) return null;
  return {
    spotifyId: id,
    name: String(data.title).trim(),
    imageUrl: data.thumbnail_url ?? null,
  };
}

async function main() {
  const seen = new Set();
  const artists = [];
  const seenNames = new Set();

  for (const id of IDS) {
    if (seen.has(id) || id.length !== 22) continue;
    seen.add(id);
    process.stderr.write(`fetch ${id}… `);
    try {
      const artist = await fetchArtist(id);
      if (!artist) {
        process.stderr.write("fail\n");
        continue;
      }
      const key = artist.name.toLowerCase();
      if (seenNames.has(key)) {
        process.stderr.write(`${artist.name} (dup skip)\n`);
        continue;
      }
      seenNames.add(key);
      process.stderr.write(`${artist.name}\n`);
      artists.push(artist);
    } catch (e) {
      process.stderr.write(`err ${e.message}\n`);
    }
    await new Promise((r) => setTimeout(r, 180));
    if (artists.length >= 45) break;
  }

  if (artists.length < 30) {
    console.error(`Only hydrated ${artists.length} artists — aborting.`);
    process.exit(1);
  }

  const claimStates = [
    "UNCLAIMED",
    "UNCLAIMED",
    "UNCLAIMED",
    "CLAIM_SUBMITTED",
    "UNDER_REVIEW",
    "VERIFIED",
    "VERIFIED",
  ];

  const launchpads = ["pump.fun", "letsbonk", "moonshot"];
  const DAY = 86_400_000;
  const now = Date.now();

  const demoArtists = artists.map((a, i) => {
    const fees = (50_000 / (i + 1) + (i % 7) * 1200).toFixed(6);
    const balance = (Number(fees) * 0.8).toFixed(6);
    return {
      id: `sp_artist_${a.spotifyId}`,
      spotifyId: a.spotifyId,
      displayName: a.name,
      slug: slugify(a.name),
      imageUrl: a.imageUrl ?? "",
      claimState: claimStates[i % claimStates.length],
      balanceUsd: balance,
      totalFeesUsd: fees,
      artistAllocationBps: 8000,
      tokenCount: 1,
      isDemo: true,
    };
  });

  const usedSymbols = new Set();
  const demoTokens = artists.map((a, i) => {
    let symbol = tickerFromName(a.name);
    if (usedSymbols.has(symbol)) {
      symbol = `${symbol}${i}`.slice(0, 8);
    }
    usedSymbols.add(symbol);
    const price = (0.25 / (i + 1) + 0.01).toFixed(6);
    const mcap = (Number(price) * 1_000_000).toFixed(2);
    const vol = (Number(mcap) * (0.05 + (i % 5) * 0.02)).toFixed(2);
    const fees = (Number(vol) * 0.01).toFixed(6);
    return {
      id: `sp_token_${a.spotifyId}`,
      mint: demoMint(i),
      symbol,
      name: a.name,
      imageUrl: a.imageUrl ?? "",
      musicTitle: a.name,
      artistNames: [a.name],
      artistId: `sp_artist_${a.spotifyId}`,
      spotifyArtistId: a.spotifyId,
      priceUsd: price,
      marketCapUsd: mcap,
      volume24hUsd: vol,
      feesGeneratedUsd: fees,
      artistAllocationBps: 8000,
      chain: "Solana",
      launchpad: launchpads[i % launchpads.length],
      launchedAt: new Date(now - (i + 1) * 2 * DAY).toISOString(),
      attributionVersion: 1,
      discoveryDisabled: false,
      isDemo: true,
    };
  });

  const out = `/* Auto-generated by scripts/hydrate-spotify-catalog.mjs — do not edit by hand */
import type { DemoArtist, DemoToken } from "@/types/domain";

export type SpotifyCatalogArtist = DemoArtist & {
  spotifyId: string;
};

export type SpotifyCatalogToken = DemoToken & {
  artistId: string;
  spotifyArtistId: string;
};

export const SPOTIFY_CATALOG_ARTISTS: SpotifyCatalogArtist[] = ${JSON.stringify(
    demoArtists,
    null,
    2,
  )} as SpotifyCatalogArtist[];

export const SPOTIFY_CATALOG_TOKENS: SpotifyCatalogToken[] = ${JSON.stringify(
    demoTokens,
    null,
    2,
  )} as SpotifyCatalogToken[];
`;

  const dest = join(root, "src", "data", "spotify-catalog.ts");
  writeFileSync(dest, out, "utf8");
  console.error(`Wrote ${artists.length} artists → ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
