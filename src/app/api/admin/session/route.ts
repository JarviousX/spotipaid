import { handleRouteError, jsonOk } from "@/lib/api";
import { getAdminSession } from "@/lib/auth/session";
import { ROLE_PERMISSIONS } from "@/types/domain";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return jsonOk({ authenticated: false });
    }
    return jsonOk({
      authenticated: true,
      adminId: session.sub,
      email: session.email,
      role: session.role,
      permissions: ROLE_PERMISSIONS[session.role] ?? [],
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
