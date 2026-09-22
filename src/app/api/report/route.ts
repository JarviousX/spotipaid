import { z } from "zod";
import {
  clientIp,
  enforceRateLimit,
  handleRouteError,
  jsonCreated,
} from "@/lib/api";
import { submitModerationReport } from "@/services/admin";
import { assertNotMaintenance } from "@/services/protocol-config";

const bodySchema = z.object({
  targetType: z.enum(["token", "artist", "music", "other"]),
  targetId: z.string().min(1).max(120),
  reason: z.string().trim().min(3).max(200),
  details: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "report", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = bodySchema.parse(await request.json());
    const report = await submitModerationReport({
      ...body,
      ip: clientIp(request),
    });
    return jsonCreated({ report });
  } catch (err) {
    return handleRouteError(err);
  }
}
