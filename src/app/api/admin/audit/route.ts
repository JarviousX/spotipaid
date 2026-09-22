import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { listAuditLogs } from "@/services/admin";

export async function GET() {
  try {
    await requireAdminSession("audit:read");
    const logs = await listAuditLogs(200);
    return jsonOk({ logs });
  } catch (err) {
    return handleRouteError(err);
  }
}
