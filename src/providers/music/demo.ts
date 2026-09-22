import { tryParseSpotifyUrl } from "@/domain/spotify-url";
import {
  SPOTIFY_CATALOG_ARTISTS,
  SPOTIFY_CATALOG_TOKENS,
} from "@/data/spotify-catalog";
import { resolveSpotifyOEmbed } from "@/providers/music/oembed";
import type { MusicProvider } from "@/providers/types";
import type {
  MusicAlbumMeta,
  MusicArtistMeta,
  MusicTrackMeta,
} from "@/types/domain";

/**
 * Local catalog fallback when Spotify Web API credentials are unset.
 * URL resolve uses public oEmbed so pasted track links return the real song.
 */

const CATALOG_ARTISTS: MusicArtistMeta[] = SPOTIFY_CATALOG_ARTISTS.map((a) => ({
  id: `spotify:artist:${a.spotifyId}`,
  name: a.displayName,
  imageUrl: a.imageUrl,
  genres: [],
  followers: Math.round(Number(a.totalFeesUsd) * 40),
  provider: "SPOTIFY" as const,
  externalId: a.spotifyId,
  claimState: a.claimState,
  isDemo: false,
}));

const CATALOG_TRACKS: MusicTrackMeta[] = SPOTIFY_CATALOG_TOKENS.slice(0, 20).map(
  (t, i) => {
    const artist = SPOTIFY_CATALOG_ARTISTS.find((a) => a.id === t.artistId)!;
    return {
      id: `spotify:track:catalog:${artist.spotifyId}:${i}`,
      title: t.musicTitle,
      artists: [
        {
          id: artist.spotifyId,
          name: artist.displayName,
          imageUrl: artist.imageUrl,
          claimState: artist.claimState,
        },
      ],
      albumTitle: `${artist.displayName} — SpotiPaid`,
      imageUrl: t.imageUrl,
      durationMs: 180_000 + i * 1_000,
      releaseDate: "2024-01-01",
      provider: "SPOTIFY" as const,
      externalId: `catalog_${artist.spotifyId}_${i}`,
      isDemo: false,
    };
  },
);

function findArtistByQuery(query: string): MusicArtistMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG_ARTISTS.slice(0, 8);
  return CATALOG_ARTISTS.filter((a) => a.name.toLowerCase().includes(q)).slice(
    0,
    12,
  );
}

function findArtistExact(externalId: string): MusicArtistMeta | null {
  return CATALOG_ARTISTS.find((a) => a.externalId === externalId) ?? null;
}

function findTrackExact(externalId: string): MusicTrackMeta | null {
  return CATALOG_TRACKS.find((t) => t.externalId === externalId) ?? null;
}

export const demoMusicProvider: MusicProvider = {
  name: "catalog-oembed",
  isDemo: false,

  async searchArtists(query: string, limit = 8) {
    return findArtistByQuery(query).slice(0, limit);
  },

  async searchTracks(query: string, limit = 8) {
    const q = query.trim().toLowerCase();
    const pool = !q
      ? CATALOG_TRACKS
      : CATALOG_TRACKS.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.artists.some((a) => a.name.toLowerCase().includes(q)),
        );
    return pool.slice(0, limit);
  },

  async getArtist(externalId: string) {
    const hit = findArtistExact(externalId);
    if (hit) return hit;
    const oembed = await resolveSpotifyOEmbed(
      `https://open.spotify.com/artist/${externalId}`,
    );
    return oembed?.type === "artist" ? (oembed.meta as MusicArtistMeta) : null;
  },

  async getTrack(externalId: string) {
    const hit = findTrackExact(externalId);
    if (hit) return hit;
    const oembed = await resolveSpotifyOEmbed(
      `https://open.spotify.com/track/${externalId}`,
    );
    return oembed?.type === "track" ? (oembed.meta as MusicTrackMeta) : null;
  },

  async getAlbum(externalId: string) {
    const oembed = await resolveSpotifyOEmbed(
      `https://open.spotify.com/album/${externalId}`,
    );
    return oembed?.type === "album" ? (oembed.meta as MusicAlbumMeta) : null;
  },

  async resolveUrl(url: string) {
    const parsed = tryParseSpotifyUrl(url);

    // Prefer oEmbed for real Spotify URLs — always the entity in the link
    if (parsed) {
      const oembed = await resolveSpotifyOEmbed(url);
      if (oembed) return oembed;

      if (parsed.type === "artist") {
        const artist = findArtistExact(parsed.id);
        if (artist) return { type: "artist" as const, meta: artist };
      }
      return null;
    }

    // Free-text fallback: match catalog artist by name
    const q = url.toLowerCase();
    const hit = CATALOG_ARTISTS.find((a) => q.includes(a.name.toLowerCase()));
    return hit ? { type: "artist" as const, meta: hit } : null;
  },
};
