import { getConfig } from "@/lib/config";
import { getPublicProtocolConfig } from "@/services/protocol-config";
import { handleRouteError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const config = await getPublicProtocolConfig();
    return jsonOk(
      {
        contractAddress: config.contractAddress,
        feeWallet: config.feeWallet,
        xAccount: config.xAccount,
        xUrl: config.xUrl,
        maintenance: config.maintenance,
        launchFeeSol: getConfig().fees.launchFeeSol,
        artistBps: getConfig().fees.artistBps,
        protocolBps: getConfig().fees.protocolBps,
        updatedAt: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
