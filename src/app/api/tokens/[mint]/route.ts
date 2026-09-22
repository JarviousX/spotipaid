import {
  enforceRateLimit,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api";
import {
  getFeeHistoryForToken,
  getPaymentsForToken,
  getTokenByMint,
  getTradesForToken,
} from "@/services/catalog";

type Ctx = { params: Promise<{ mint: string }> };

export async function GET(request: Request, context: Ctx) {
  try {
    const limited = enforceRateLimit(request, "tokens-mint", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const { mint } = await context.params;
    const token = await getTokenByMint(decodeURIComponent(mint));
    if (!token) {
      return jsonError(404, "Token not found", { code: "NOT_FOUND" });
    }

    const [trades, feeHistory, payments] = await Promise.all([
      getTradesForToken(token.mint),
      getFeeHistoryForToken(token.mint),
      getPaymentsForToken(token.mint),
    ]);

    return jsonOk({
      token,
      trades,
      feeHistory,
      payments,
      isDemo: token.isDemo,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
