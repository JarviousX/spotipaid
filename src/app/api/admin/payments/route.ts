import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { listAdminPayments } from "@/services/admin";

export async function GET() {
  try {
    await requireAdminSession("finance:read");
    const payments = await listAdminPayments(200);
    return jsonOk({ payments });
  } catch (err) {
    return handleRouteError(err);
  }
}
