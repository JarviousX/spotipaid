import { z } from "zod";
import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { getExplore, type ExploreView } from "@/services/catalog";

const querySchema = z.object({
  view: z
    .enum(["trending", "new", "top-fees", "top-artists", "recently-paid"])
    .default("trending"),
  q: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "explore", {
      limit: 40,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      view: url.searchParams.get("view") ?? "trending",
      q: url.searchParams.get("q") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const data = await getExplore(parsed.view as ExploreView, {
      q: parsed.q,
      limit: parsed.limit,
    });
    return jsonOk(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
