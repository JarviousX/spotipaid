import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { getPublicSafeSettings, patchSettings } from "@/services/admin";

export async function GET() {
  try {
    await requireAdminSession("admin:read");
    const settings = await getPublicSafeSettings();
    return jsonOk({ settings });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminSession("settings:write");
    const body = await request.json();
    const settings = await patchSettings(session, body);
    return jsonOk({ settings });
  } catch (err) {
    return handleRouteError(err);
  }
}
