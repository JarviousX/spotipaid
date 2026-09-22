import { z } from "zod";
import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { getTopTokens, listTokens } from "@/services/catalog";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "tokens", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const tokens = parsed.limit
      ? await getTopTokens(parsed.limit)
      : await listTokens(50);
    return jsonOk({ tokens, isDemo: tokens.every((t) => t.isDemo) });
  } catch (err) {
    return handleRouteError(err);
  }
}
