import { z } from "zod";
import {
  clientIp,
  enforceRateLimit,
  handleRouteError,
  jsonCreated,
  jsonError,
} from "@/lib/api";
import { getConfig } from "@/lib/config";
import { submitClaim } from "@/services/claims";
import { assertNotMaintenance } from "@/services/protocol-config";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  evidenceUrl: z.string().url().optional(),
  evidenceNotes: z.string().trim().max(2000).optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request, context: Ctx) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "artist-claim", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    if (!getConfig().features.enableArtistClaims) {
      return jsonError(403, "Artist claims are disabled", {
        code: "FEATURE_DISABLED",
      });
    }

    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());
    const claim = await submitClaim({
      artistId: decodeURIComponent(id),
      evidenceUrl: body.evidenceUrl,
      evidenceNotes: body.evidenceNotes,
      userId: body.userId,
    });

    void clientIp(request);
    return jsonCreated({ claim, isDemo: claim.isDemo });
  } catch (err) {
    return handleRouteError(err);
  }
}
