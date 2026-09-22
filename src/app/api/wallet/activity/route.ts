import { z } from "zod";
import {
  clientIp,
  enforceRateLimit,
  handleRouteError,
  jsonCreated,
  jsonOk,
} from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { isValidSolanaAddress } from "@/domain/wallet";
import { assertNotMaintenance } from "@/services/protocol-config";
import {
  createWalletConnectionEvent,
  listWalletConnectionEvents,
} from "@/services/wallet-activity";

const eventSchema = z.object({
  address: z.string().min(32).max(64),
  chain: z.string().max(32).default("solana"),
  network: z.string().max(64).optional(),
  event: z.enum([
    "connect",
    "disconnect",
    "account_change",
    "network_change",
    "reconnect",
  ]),
});

/** Public: record wallet connection activity (public address only). */
export async function POST(request: Request) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "wallet-activity", {
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = eventSchema.parse(await request.json());
    if (!isValidSolanaAddress(body.address)) {
      return jsonOk({ recorded: false });
    }

    const ua = request.headers.get("user-agent")?.slice(0, 240) ?? null;

    const recorded = await createWalletConnectionEvent({
      address: body.address,
      chain: body.chain,
      network: body.network ?? null,
      event: body.event,
      userAgent: ua,
      ipAddress: clientIp(request),
    });

    return jsonCreated({ recorded });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** Admin: list wallet connection events */
export async function GET(request: Request) {
  try {
    await requireAdminSession("audit:read");
    const url = new URL(request.url);
    const limit = Math.min(
      200,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50),
    );

    const rows = await listWalletConnectionEvents(limit);

    return jsonOk({
      events: rows.map((r) => ({
        id: r.id,
        address: r.address,
        chain: r.chain,
        network: r.network,
        event: r.event,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
