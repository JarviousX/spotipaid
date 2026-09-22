import { z } from "zod";
import {
  enforceRateLimit,
  handleRouteError,
  jsonOk,
} from "@/lib/api";
import { searchMusicCatalog } from "@/services/launch";
import { assertNotMaintenance } from "@/services/protocol-config";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export async function GET(request: Request) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "music-search", {
      limit: 40,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      q: url.searchParams.get("q") ?? "",
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const results = await searchMusicCatalog(parsed.q, parsed.limit ?? 8);
    return jsonOk(results);
  } catch (err) {
    return handleRouteError(err);
  }
}
