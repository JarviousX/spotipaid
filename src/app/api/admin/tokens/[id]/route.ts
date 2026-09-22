import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { patchAdminToken } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const session = await requireAdminSession("tokens:moderate");
    const { id } = await context.params;
    const body = await request.json();
    const token = await patchAdminToken(
      session,
      decodeURIComponent(id),
      body,
    );
    return jsonOk({ token });
  } catch (err) {
    return handleRouteError(err);
  }
}
