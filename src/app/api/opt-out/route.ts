import { z } from "zod";
import {
  clientIp,
  enforceRateLimit,
  handleRouteError,
  jsonCreated,
  jsonError,
} from "@/lib/api";
import { submitOptOut } from "@/services/admin";
import { assertNotMaintenance } from "@/services/protocol-config";

const bodySchema = z.object({
  artistId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  reason: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "opt-out", {
      limit: 5,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = bodySchema.parse(await request.json());
    if (!body.artistId && !body.email) {
      return jsonError(400, "artistId or email is required", {
        code: "VALIDATION_ERROR",
      });
    }

    const result = await submitOptOut({
      ...body,
      ip: clientIp(request),
    });
    return jsonCreated({ optOut: result });
  } catch (err) {
    return handleRouteError(err);
  }
}
