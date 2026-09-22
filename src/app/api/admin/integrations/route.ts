import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { listIntegrations } from "@/services/admin";
import { getConfig } from "@/lib/config";

export async function GET() {
  try {
    await requireAdminSession("admin:read");
    const events = await listIntegrations(100);
    const cfg = getConfig();

    // Status only — never expose secrets
    return jsonOk({
      events,
      integrations: {
        spotify: { configured: cfg.spotify.configured },
        solana: { configured: Boolean(cfg.solana.rpcUrl) },
        demoMode: cfg.isDemoMode,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
