import {
  enforceRateLimit,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api";
import {
  getArtistByIdOrSlug,
  getArtistPayments,
  getArtistTokens,
} from "@/services/catalog";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  try {
    const limited = enforceRateLimit(request, "artists-id", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const { id } = await context.params;
    const artist = await getArtistByIdOrSlug(decodeURIComponent(id));
    if (!artist) {
      return jsonError(404, "Artist not found", { code: "NOT_FOUND" });
    }

    const [tokens, payments] = await Promise.all([
      getArtistTokens(artist.id),
      getArtistPayments(artist.id),
    ]);

    return jsonOk({
      artist,
      tokens,
      payments,
      isDemo: artist.isDemo,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
