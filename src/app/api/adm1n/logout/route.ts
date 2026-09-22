import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/lib/api";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/auth/session";
import { clearCsrfCookie, getCsrfCookie, assertCsrf } from "@/lib/auth/csrf";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    const cookieCsrf = await getCsrfCookie();
    if (session) {
      assertCsrf(request, cookieCsrf);
    }

    await clearAdminSessionCookie();
    await clearCsrfCookie();

    if (session) {
      await writeAuditLog({
        action: "adm1n.logout",
        entityType: "AdminSession",
        entityId: session.sub,
        ipAddress: clientIp(request),
        metadata: { success: true, sessionId: session.sub },
      });
    }

    return jsonOk({ authenticated: false });
  } catch (err) {
    return handleRouteError(err);
  }
}
