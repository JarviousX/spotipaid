import { z } from "zod";
import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { searchAll } from "@/services/catalog";

const querySchema = z.object({
  q: z.string().max(120).optional().default(""),
});

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "search", {
      limit: 40,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      q: url.searchParams.get("q") ?? "",
    });
    const result = await searchAll(parsed.q);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
