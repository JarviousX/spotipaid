import { z } from "zod";
import type { SpotifyEntityType, SpotifyRef } from "@/types/domain";

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;
const ENTITY_TYPES = ["track", "album", "artist", "playlist"] as const;

export class SpotifyUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyUrlError";
  }
}

const spotifyIdSchema = z
  .string()
  .regex(SPOTIFY_ID_RE, "Spotify ID must be 22 alphanumeric characters");

const entityTypeSchema = z.enum(ENTITY_TYPES);

export function isValidSpotifyId(id: string): boolean {
  return spotifyIdSchema.safeParse(id).success;
}

export function isValidEntityType(type: string): type is SpotifyEntityType {
  return entityTypeSchema.safeParse(type).success;
}

/**
 * Build canonical open.spotify.com URL and spotify: URI from type + id.
 */
export function toSpotifyRef(type: SpotifyEntityType, id: string): SpotifyRef {
  if (!isValidEntityType(type)) {
    throw new SpotifyUrlError(`Invalid Spotify entity type: ${type}`);
  }
  const parsedId = spotifyIdSchema.safeParse(id);
  if (!parsedId.success) {
    throw new SpotifyUrlError(`Invalid Spotify ID: ${id}`);
  }
  return {
    type,
    id: parsedId.data,
    uri: `spotify:${type}:${parsedId.data}`,
    url: `https://open.spotify.com/${type}/${parsedId.data}`,
  };
}

/**
 * Parse Spotify track/artist/album/playlist URLs and spotify: URIs.
 * Accepts:
 * - https://open.spotify.com/track/{id}
 * - https://open.spotify.com/intl-xx/track/{id}
 * - https://open.spotify.com/track/{id}?si=...
 * - spotify:track:{id}
 */
export function parseSpotifyUrl(input: string): SpotifyRef {
  const raw = input?.trim();
  if (!raw) {
    throw new SpotifyUrlError("Spotify URL or URI is required");
  }

  // spotify:type:id
  const uriMatch = raw.match(
    /^spotify:(track|album|artist|playlist):([A-Za-z0-9]{22})$/i,
  );
  if (uriMatch) {
    return toSpotifyRef(
      uriMatch[1].toLowerCase() as SpotifyEntityType,
      uriMatch[2],
    );
  }

  // open.spotify.com URL (with optional intl locale prefix and query/hash)
  let url: URL;
  try {
    // Allow bare open.spotify.com without scheme
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    url = new URL(withScheme);
  } catch {
    throw new SpotifyUrlError(`Invalid Spotify URL: ${input}`);
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "open.spotify.com" && host !== "play.spotify.com") {
    throw new SpotifyUrlError(`Not a Spotify URL: ${input}`);
  }

  // pathname: /track/ID or /intl-en/track/ID or /embed/track/ID
  const segments = url.pathname.split("/").filter(Boolean);
  let typeIdx = 0;
  if (segments[0]?.toLowerCase().startsWith("intl-")) {
    typeIdx = 1;
  } else if (segments[0]?.toLowerCase() === "embed") {
    typeIdx = 1;
  }

  const typeSeg = segments[typeIdx]?.toLowerCase();
  const idSeg = segments[typeIdx + 1];

  if (!typeSeg || !idSeg) {
    throw new SpotifyUrlError(`Could not extract type and id from: ${input}`);
  }

  if (!isValidEntityType(typeSeg)) {
    throw new SpotifyUrlError(`Unsupported Spotify entity type: ${typeSeg}`);
  }

  // Strip query junk from id if somehow attached
  const id = idSeg.split("?")[0].split("#")[0];
  return toSpotifyRef(typeSeg, id);
}

/**
 * Soft validation — returns null instead of throwing.
 */
export function tryParseSpotifyUrl(input: string): SpotifyRef | null {
  try {
    return parseSpotifyUrl(input);
  } catch {
    return null;
  }
}
