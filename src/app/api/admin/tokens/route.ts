import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { listAdminTokens } from "@/services/admin";

export async function GET() {
  try {
    await requireAdminSession("tokens:moderate");
    const tokens = await listAdminTokens(200);
    return jsonOk({ tokens });
  } catch (err) {
    return handleRouteError(err);
  }
}
