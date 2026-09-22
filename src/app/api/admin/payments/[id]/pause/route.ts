import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { pauseAdminPayment } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const session = await requireAdminSession("finance:payout");
    const { id } = await context.params;
    const payment = await pauseAdminPayment(
      session,
      decodeURIComponent(id),
    );
    return jsonOk({ payment });
  } catch (err) {
    return handleRouteError(err);
  }
}
