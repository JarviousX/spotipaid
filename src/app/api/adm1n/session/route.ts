import { handleRouteError, jsonOk } from "@/lib/api";
import { getAdminSession } from "@/lib/auth/session";
import {
  getCsrfCookie,
  mintCsrfToken,
  setCsrfCookie,
  verifyCsrfToken,
} from "@/lib/auth/csrf";

export async function GET() {
  try {
    const session = await getAdminSession();
    let csrf = await getCsrfCookie();
    if (session && (!csrf || !verifyCsrfToken(csrf))) {
      csrf = mintCsrfToken();
      await setCsrfCookie(csrf);
    }

    if (!session) {
      return jsonOk({ authenticated: false });
    }

    return jsonOk({
      authenticated: true,
      role: session.role,
      sessionId: session.sub,
      csrfToken: csrf,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
