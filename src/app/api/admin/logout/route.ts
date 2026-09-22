import { handleRouteError, jsonOk } from "@/lib/api";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getAdminSession();
    await clearAdminSessionCookie();
    if (session) {
      await writeAuditLog({
        action: "admin.logout",
        entityType: "AdminUser",
        entityId: session.sub,
        actorAdminId: session.sub,
      });
    }
    return jsonOk({ authenticated: false });
  } catch (err) {
    return handleRouteError(err);
  }
}
