import { describe, expect, it } from "vitest";
import {
  parseSpotifyUrl,
  tryParseSpotifyUrl,
  toSpotifyRef,
  isValidSpotifyId,
  SpotifyUrlError,
} from "@/domain/spotify-url";

describe("parseSpotifyUrl", () => {
  it("parses open.spotify.com track URLs", () => {
    const ref = parseSpotifyUrl(
      "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    );
    expect(ref.type).toBe("track");
    expect(ref.id).toBe("6rqhFgbbKwnb9MLmUQDhG6");
    expect(ref.uri).toBe("spotify:track:6rqhFgbbKwnb9MLmUQDhG6");
    expect(ref.url).toBe(
      "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    );
  });

  it("parses artist and album URLs with query params", () => {
    const artist = parseSpotifyUrl(
      "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF?si=abc",
    );
    expect(artist.type).toBe("artist");
    expect(artist.id).toBe("0OdUWJ0sBjDrqHygGUXeCF");

    const album = parseSpotifyUrl(
      "https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy#hash",
    );
    expect(album.type).toBe("album");
    expect(album.id).toBe("4aawyAB9vmqN3uQ7FjRGTy");
  });

  it("parses intl locale and embed paths", () => {
    const intl = parseSpotifyUrl(
      "https://open.spotify.com/intl-en/track/11dFghVXANMlKmJXsNCbNl",
    );
    expect(intl.type).toBe("track");
    expect(intl.id).toBe("11dFghVXANMlKmJXsNCbNl");

    const embed = parseSpotifyUrl(
      "https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl",
    );
    expect(embed.id).toBe("11dFghVXANMlKmJXsNCbNl");
  });

  it("parses spotify: URIs", () => {
    const ref = parseSpotifyUrl("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M");
    expect(ref.type).toBe("playlist");
    expect(ref.id).toBe("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("accepts URLs without scheme", () => {
    const ref = parseSpotifyUrl(
      "open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    );
    expect(ref.type).toBe("track");
  });

  it("rejects invalid hosts and ids", () => {
    expect(() => parseSpotifyUrl("https://example.com/track/abc")).toThrow(
      SpotifyUrlError,
    );
    expect(() =>
      parseSpotifyUrl("https://open.spotify.com/track/short"),
    ).toThrow(SpotifyUrlError);
    expect(() => parseSpotifyUrl("")).toThrow(SpotifyUrlError);
  });

  it("tryParse returns null on failure", () => {
    expect(tryParseSpotifyUrl("not-a-url")).toBeNull();
  });

  it("toSpotifyRef and isValidSpotifyId", () => {
    expect(isValidSpotifyId("6rqhFgbbKwnb9MLmUQDhG6")).toBe(true);
    expect(isValidSpotifyId("nope")).toBe(false);
    const ref = toSpotifyRef("track", "6rqhFgbbKwnb9MLmUQDhG6");
    expect(ref.uri).toContain("spotify:track:");
  });
});
