import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { listAdminClaims } from "@/services/admin";

export async function GET() {
  try {
    await requireAdminSession("claims:review");
    const claims = await listAdminClaims(100);
    return jsonOk({ claims });
  } catch (err) {
    return handleRouteError(err);
  }
}
