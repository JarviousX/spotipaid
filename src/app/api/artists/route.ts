import { z } from "zod";
import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { getTopArtists, listArtistsAsync } from "@/services/catalog";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "artists", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const artists = parsed.limit
      ? await getTopArtists(parsed.limit)
      : await listArtistsAsync(50);
    return jsonOk({ artists, isDemo: artists.every((a) => a.isDemo) });
  } catch (err) {
    return handleRouteError(err);
  }
}
