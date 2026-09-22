import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { getProtocolStats } from "@/services/catalog";

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "stats", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;
    const stats = await getProtocolStats();
    return jsonOk({ stats });
  } catch (err) {
    return handleRouteError(err);
  }
}
