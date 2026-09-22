import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { retryAdminPayment } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const session = await requireAdminSession("finance:payout");
    const { id } = await context.params;
    const payment = await retryAdminPayment(
      session,
      decodeURIComponent(id),
    );
    return jsonOk({ payment });
  } catch (err) {
    return handleRouteError(err);
  }
}
