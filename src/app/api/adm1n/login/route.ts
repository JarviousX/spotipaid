import { z } from "zod";
import {
  clientIp,
  enforceRateLimit,
  handleRouteError,
  jsonOk,
} from "@/lib/api";
import {
  authenticateAdminPassphrase,
} from "@/lib/auth/admin";
import { issueAdminSession } from "@/lib/auth/session";
import {
  mintCsrfToken,
  setCsrfCookie,
} from "@/lib/auth/csrf";
import { writeAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  passphrase: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "adm1n-login", {
      limit: 15,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = bodySchema.parse(await request.json());
    const ip = clientIp(request);

    const result = await authenticateAdminPassphrase({
      passphrase: body.passphrase,
      ip,
    });

    await issueAdminSession({
      adminId: result.adminId,
      email: "operator@adm1n.local",
      role: result.role,
    });

    const csrf = mintCsrfToken();
    await setCsrfCookie(csrf);

    await writeAuditLog({
      action: "adm1n.login",
      entityType: "AdminSession",
      entityId: result.adminId,
      ipAddress: ip,
      metadata: { success: true, sessionId: result.adminId },
    });

    // Never return passphrase, hash, or JWT
    return jsonOk({
      authenticated: true,
      csrfToken: csrf,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
