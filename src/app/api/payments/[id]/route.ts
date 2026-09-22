import {
  enforceRateLimit,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api";
import { getPaymentById } from "@/services/catalog";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  try {
    const limited = enforceRateLimit(request, "payments-id", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const { id } = await context.params;
    const payment = await getPaymentById(decodeURIComponent(id));
    if (!payment) {
      return jsonError(404, "Payment not found", { code: "NOT_FOUND" });
    }
    return jsonOk({ payment, isDemo: payment.isDemo });
  } catch (err) {
    return handleRouteError(err);
  }
}
