import { tryParseSpotifyUrl, toSpotifyRef } from "@/domain/spotify-url";
import type {
  MusicAlbumMeta,
  MusicArtistMeta,
  MusicArtistRef,
  MusicTrackMeta,
  SpotifyEntityType,
} from "@/types/domain";

type OEmbedPayload = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name?: string;
};

type OpenGraph = {
  title?: string;
  description?: string;
  image?: string;
};

export type OEmbedResolved = {
  type: SpotifyEntityType;
  meta: MusicTrackMeta | MusicAlbumMeta | MusicArtistMeta;
};

async function fetchOEmbed(canonicalUrl: string): Promise<OEmbedPayload | null> {
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
  const res = await fetch(endpoint, {
    headers: { "User-Agent": "SpotiPaid/1.0 (+https://spotipaid.local)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as OEmbedPayload;
}

async function fetchOpenGraph(canonicalUrl: string): Promise<OpenGraph | null> {
  try {
    const res = await fetch(canonicalUrl, {
      headers: {
        "User-Agent": "SpotiPaid/1.0 (+https://spotipaid.local)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const prop = (name: string) => {
      const m = html.match(
        new RegExp(`property="${name}" content="([^"]*)"`, "i"),
      );
      return m?.[1] ? decodeHtmlEntities(m[1]) : undefined;
    };

    return {
      title: prop("og:title"),
      description: prop("og:description"),
      image: prop("og:image"),
    };
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Spotify OG descriptions look like:
 * "SIVAN, Bảo Hân Helia · chấm xám · Song · 2026"
 */
function artistsFromOgDescription(description: string): MusicArtistRef[] {
  const head = description.split(" · ")[0]?.trim();
  if (!head) return [];
  // Skip if the head looks like a generic label
  if (/^(song|album|playlist|single|ep)$/i.test(head)) return [];

  return head
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      id: `name:${name.toLowerCase()}`,
      name,
    }));
}

/**
 * Resolve any open.spotify.com entity via public oEmbed + Open Graph.
 * oEmbed alone often omits artist names; OG description includes them.
 */
export async function resolveSpotifyOEmbed(
  urlOrUri: string,
): Promise<OEmbedResolved | null> {
  const ref = tryParseSpotifyUrl(urlOrUri);
  if (!ref) return null;
  if (ref.type === "playlist") return null;

  const canonical = toSpotifyRef(ref.type, ref.id).url;

  const [oembed, og] = await Promise.all([
    fetchOEmbed(canonical),
    fetchOpenGraph(canonical),
  ]);

  const title = String(og?.title ?? oembed?.title ?? "").trim();
  if (!title) return null;

  const imageUrl = og?.image ?? oembed?.thumbnail_url ?? null;
  const author = String(oembed?.author_name ?? "").trim();
  const ogArtists = og?.description
    ? artistsFromOgDescription(og.description)
    : [];

  if (ref.type === "track") {
    const artists: MusicArtistRef[] =
      ogArtists.length > 0
        ? ogArtists
        : author
          ? [{ id: `name:${author.toLowerCase()}`, name: author }]
          : [{ id: "unknown", name: "Unknown artist" }];

    const meta: MusicTrackMeta = {
      id: `spotify:track:${ref.id}`,
      title,
      artists,
      albumTitle: null,
      imageUrl,
      provider: "SPOTIFY",
      externalId: ref.id,
      isDemo: false,
    };
    return { type: "track", meta };
  }

  if (ref.type === "album") {
    const artists: MusicArtistRef[] =
      ogArtists.length > 0
        ? ogArtists
        : author
          ? [{ id: `name:${author.toLowerCase()}`, name: author }]
          : [{ id: "unknown", name: "Unknown artist" }];

    const meta: MusicAlbumMeta = {
      id: `spotify:album:${ref.id}`,
      title,
      artists,
      imageUrl,
      provider: "SPOTIFY",
      externalId: ref.id,
      isDemo: false,
    };
    return { type: "album", meta };
  }

  const meta: MusicArtistMeta = {
    id: `spotify:artist:${ref.id}`,
    name: title,
    imageUrl,
    genres: [],
    provider: "SPOTIFY",
    externalId: ref.id,
    isDemo: false,
  };
  return { type: "artist", meta };
}
