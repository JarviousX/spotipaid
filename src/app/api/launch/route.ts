import { z } from "zod";
import {
  enforceRateLimit,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
} from "@/lib/api";
import {
  getLaunchQuote,
  getProtocolFeeConfig,
  LaunchError,
  registerToken,
} from "@/services/launch";
import { assertNotMaintenance } from "@/services/protocol-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bodySchema = z.object({
  symbol: z.string().trim().min(2).max(12),
  name: z.string().trim().min(1).max(80),
  mint: z.string().trim().min(32).max(44).optional(),
  imageUrl: z.string().url().nullable().optional(),
  musicUrl: z.string().trim().min(1).optional(),
  musicExternalId: z.string().trim().min(1).optional(),
  musicType: z.enum(["track", "album", "artist", "playlist"]).optional(),
  artistNames: z.array(z.string().trim().min(1)).max(8).optional(),
  musicTitle: z.string().trim().min(1).max(120).optional(),
  paymentSignature: z.string().trim().min(64).max(128).optional(),
  walletAddress: z.string().trim().min(32).max(64).optional(),
  authMode: z.enum(["wallet", "walletless", "register"]).optional(),
});

export async function GET() {
  try {
    await assertNotMaintenance();
    const quote = await getLaunchQuote();
    return jsonOk(quote, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    await assertNotMaintenance();
    const limited = enforceRateLimit(request, "launch", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const raw = (await request.json()) as Record<string, unknown>;
    // Strip any client-supplied fee/accounting fields — server computes splits
    const {
      artistBps: _a,
      protocolBps: _p,
      artistAmount: _aa,
      protocolAmount: _pa,
      grossAmount: _g,
      ...safe
    } = raw;
    void _a;
    void _p;
    void _aa;
    void _pa;
    void _g;

    const body = bodySchema.parse(safe);

    if (body.authMode === "walletless") {
      return jsonError(
        400,
        "Walletless launch is configured on pump.fun fee sharing — no on-site payment.",
        { code: "WALLETLESS_GUIDE" },
      );
    }

    const token = await registerToken(body);
    const feeConfig = await getProtocolFeeConfig();
    const quote = await getLaunchQuote();

    return jsonCreated({
      token: {
        ...token,
        feeArtistBps: feeConfig.artistBps,
        feeProtocolBps: feeConfig.protocolBps,
      },
      feeConfig,
      launchFeeSol: quote.launchFeeSol,
      paymentSignature: body.paymentSignature ?? null,
      isDemo: token.isDemo,
    });
  } catch (err) {
    if (err instanceof LaunchError) {
      return jsonError(400, err.message, { code: "LAUNCH_FAILED" });
    }
    return handleRouteError(err);
  }
}
