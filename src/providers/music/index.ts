import { demoMusicProvider } from "@/providers/music/demo";
import { createSpotifyMusicProvider } from "@/providers/music/spotify";
import type { MusicProvider } from "@/providers/types";

/**
 * Factory: Spotify Web API when credentials are set, otherwise catalog + oEmbed.
 */
export function getMusicProvider(): MusicProvider {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (clientId && clientSecret) {
    return createSpotifyMusicProvider();
  }

  return demoMusicProvider;
}

export { demoMusicProvider } from "@/providers/music/demo";
export { createSpotifyMusicProvider, spotifyMusicProvider } from "@/providers/music/spotify";
