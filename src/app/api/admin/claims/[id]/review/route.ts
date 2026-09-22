import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { adminReviewClaim } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const session = await requireAdminSession("claims:review");
    const { id } = await context.params;
    const body = await request.json();
    const claim = await adminReviewClaim(
      session,
      decodeURIComponent(id),
      body,
    );
    return jsonOk({ claim });
  } catch (err) {
    return handleRouteError(err);
  }
}
