import { z } from "zod";
import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { getAnalytics, type AnalyticsPeriod } from "@/services/catalog";

const querySchema = z.object({
  period: z.enum(["1d", "7d", "30d", "90d", "all"]).default("7d"),
});

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "analytics", {
      limit: 30,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      period: url.searchParams.get("period") ?? "7d",
    });
    const analytics = await getAnalytics(parsed.period as AnalyticsPeriod);
    return jsonOk({ analytics });
  } catch (err) {
    return handleRouteError(err);
  }
}
