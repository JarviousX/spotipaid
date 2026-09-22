import { z } from "zod";
import {
  clientIp,
  enforceRateLimit,
  handleRouteError,
  jsonOk,
} from "@/lib/api";
import { adminLogin } from "@/services/admin";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "admin-login", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = bodySchema.parse(await request.json());
    const session = await adminLogin({
      email: body.email,
      password: body.password,
      ip: clientIp(request),
    });

    // Never return password hash or JWT in body — cookie only
    return jsonOk({
      authenticated: true,
      email: session.email,
      role: session.role,
      adminId: session.adminId,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
