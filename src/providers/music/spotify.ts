import { demoMusicProvider } from "@/providers/music/demo";
import { resolveSpotifyOEmbed } from "@/providers/music/oembed";
import type { MusicProvider } from "@/providers/types";
import type {
  MusicAlbumMeta,
  MusicArtistMeta,
  MusicArtistRef,
  MusicTrackMeta,
  ProviderName,
  SpotifyEntityType,
} from "@/types/domain";
import { parseSpotifyUrl } from "@/domain/spotify-url";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

interface SpotifyTokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: SpotifyTokenCache | null = null;

function requireCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  const creds = requireCredentials();
  if (!creds) {
    throw new Error("Spotify credentials not configured");
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.accessToken;
  }

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify token error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

async function spotifyFetch<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Metadata only — never request audio streams
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}

interface SpotifyArtistLite {
  id: string;
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  album?: {
    name: string;
    images?: SpotifyImage[];
    release_date?: string;
  };
  artists: SpotifyArtistLite[];
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images?: SpotifyImage[];
  release_date?: string;
  total_tracks?: number;
  artists: SpotifyArtistLite[];
}

interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
  followers?: { total: number };
}

function pickImage(images?: SpotifyImage[]): string | null {
  if (!images?.length) return null;
  return images[0]?.url ?? null;
}

function mapArtists(artists: SpotifyArtistLite[]): MusicArtistRef[] {
  return artists.map((a) => ({
    id: a.id,
    name: a.name,
    providerIds: { SPOTIFY: a.id },
  }));
}

function mapTrack(t: SpotifyTrack): MusicTrackMeta {
  return {
    id: `spotify:track:${t.id}`,
    title: t.name,
    artists: mapArtists(t.artists),
    albumTitle: t.album?.name ?? null,
    imageUrl: pickImage(t.album?.images),
    durationMs: t.duration_ms,
    releaseDate: t.album?.release_date ?? null,
    provider: "SPOTIFY" as ProviderName,
    externalId: t.id,
    isDemo: false,
  };
}

function mapAlbum(a: SpotifyAlbum): MusicAlbumMeta {
  return {
    id: `spotify:album:${a.id}`,
    title: a.name,
    artists: mapArtists(a.artists),
    imageUrl: pickImage(a.images),
    releaseDate: a.release_date ?? null,
    trackCount: a.total_tracks ?? null,
    provider: "SPOTIFY",
    externalId: a.id,
    isDemo: false,
  };
}

function mapArtist(a: SpotifyArtist): MusicArtistMeta {
  return {
    id: `spotify:artist:${a.id}`,
    name: a.name,
    imageUrl: pickImage(a.images),
    genres: a.genres ?? [],
    followers: a.followers?.total ?? null,
    provider: "SPOTIFY",
    externalId: a.id,
    isDemo: false,
  };
}

export const spotifyMusicProvider: MusicProvider = {
  name: "spotify",
  isDemo: false,

  async getTrack(externalId) {
    const data = await spotifyFetch<SpotifyTrack>(`/tracks/${externalId}`);
    return data ? mapTrack(data) : null;
  },

  async getAlbum(externalId) {
    const data = await spotifyFetch<SpotifyAlbum>(`/albums/${externalId}`);
    return data ? mapAlbum(data) : null;
  },

  async getArtist(externalId) {
    const data = await spotifyFetch<SpotifyArtist>(`/artists/${externalId}`);
    return data ? mapArtist(data) : null;
  },

  async searchTracks(query, limit = 10) {
    const q = encodeURIComponent(query);
    const data = await spotifyFetch<{ tracks: { items: SpotifyTrack[] } }>(
      `/search?type=track&q=${q}&limit=${Math.min(limit, 50)}`,
    );
    return (data?.tracks.items ?? []).map(mapTrack);
  },

  async searchArtists(query, limit = 10) {
    const q = encodeURIComponent(query);
    const data = await spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
      `/search?type=artist&q=${q}&limit=${Math.min(limit, 50)}`,
    );
    return (data?.artists.items ?? []).map(mapArtist);
  },

  async resolveUrl(urlOrUri) {
    const ref = parseSpotifyUrl(urlOrUri);
    if (ref.type === "track") {
      const meta = await this.getTrack(ref.id);
      return meta ? { type: "track" as SpotifyEntityType, meta } : null;
    }
    if (ref.type === "album") {
      const meta = await this.getAlbum(ref.id);
      return meta ? { type: "album" as SpotifyEntityType, meta } : null;
    }
    if (ref.type === "artist") {
      const meta = await this.getArtist(ref.id);
      return meta ? { type: "artist" as SpotifyEntityType, meta } : null;
    }
    // Playlists not fully mapped in MusicProvider yet
    return null;
  },
};

/**
 * Spotify Web API provider with oEmbed fallback (never maps to a wrong catalog song).
 */
export function createSpotifyMusicProvider(): MusicProvider {
  if (!requireCredentials()) {
    return demoMusicProvider;
  }

  return {
    ...spotifyMusicProvider,
    async getTrack(id) {
      try {
        const meta = await spotifyMusicProvider.getTrack(id);
        if (meta) return meta;
      } catch {
        /* fall through */
      }
      const oembed = await resolveSpotifyOEmbed(
        `https://open.spotify.com/track/${id}`,
      );
      return oembed?.type === "track" ? (oembed.meta as MusicTrackMeta) : null;
    },
    async getAlbum(id) {
      try {
        const meta = await spotifyMusicProvider.getAlbum(id);
        if (meta) return meta;
      } catch {
        /* fall through */
      }
      const oembed = await resolveSpotifyOEmbed(
        `https://open.spotify.com/album/${id}`,
      );
      return oembed?.type === "album" ? (oembed.meta as MusicAlbumMeta) : null;
    },
    async getArtist(id) {
      try {
        const meta = await spotifyMusicProvider.getArtist(id);
        if (meta) return meta;
      } catch {
        /* fall through */
      }
      const oembed = await resolveSpotifyOEmbed(
        `https://open.spotify.com/artist/${id}`,
      );
      return oembed?.type === "artist" ? (oembed.meta as MusicArtistMeta) : null;
    },
    async searchTracks(q, limit) {
      try {
        return await spotifyMusicProvider.searchTracks(q, limit);
      } catch {
        return demoMusicProvider.searchTracks(q, limit);
      }
    },
    async searchArtists(q, limit) {
      try {
        return await spotifyMusicProvider.searchArtists(q, limit);
      } catch {
        return demoMusicProvider.searchArtists(q, limit);
      }
    },
    async resolveUrl(url) {
      try {
        const resolved = await spotifyMusicProvider.resolveUrl(url);
        if (resolved) return resolved;
      } catch {
        /* fall through */
      }
      const oembed = await resolveSpotifyOEmbed(url);
      if (oembed) return oembed;
      return demoMusicProvider.resolveUrl(url);
    },
  };
}
