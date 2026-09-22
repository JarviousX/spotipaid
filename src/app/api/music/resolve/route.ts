import { z } from "zod";
import {
  enforceRateLimit,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api";
import { buildTokenDraft, resolveMusicFromUrl } from "@/services/launch";
import { assertNotMaintenance } from "@/services/protocol-config";

const bodySchema = z.object({
  url: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "music-resolve", {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = bodySchema.parse(await request.json());
    const music = await resolveMusicFromUrl(body.url);
    const draft = await buildTokenDraft(music);

    return jsonOk({
      type: music.type,
      meta: music.meta,
      spotifyUrl: body.url.trim(),
      attribution: `spotipaid:ref=${music.type}:${music.meta.externalId};v=1`,
      draft: {
        symbol: draft.symbol,
        name: draft.name,
        imageUrl: draft.imageUrl,
        musicTitle: draft.musicTitle,
        artistNames: draft.artistNames,
        suggestedMintLabel: draft.suggestedMintLabel,
        feeConfig: draft.feeConfig,
      },
      music,
      isDemo: music.isDemo,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "LaunchError") {
      return jsonError(400, err.message, { code: "RESOLVE_FAILED" });
    }
    return handleRouteError(err);
  }
}
