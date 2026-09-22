import { z } from "zod";
import { enforceRateLimit, handleRouteError, jsonOk } from "@/lib/api";
import { getRecentPayments } from "@/services/catalog";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "payments", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });
    const payments = await getRecentPayments(parsed.limit ?? 20, parsed.status);
    return jsonOk({
      payments,
      isDemo: payments.every((p) => p.isDemo),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
