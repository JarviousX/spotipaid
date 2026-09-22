import { getConfig } from "@/lib/config";
import { getPublicProtocolConfig } from "@/services/protocol-config";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const config = await getPublicProtocolConfig();
    return jsonOk({
      contractAddress: config.contractAddress,
      feeWallet: config.feeWallet,
      xAccount: config.xAccount,
      xUrl: config.xUrl,
      maintenance: config.maintenance,
      launchFeeSol: getConfig().fees.launchFeeSol,
      artistBps: getConfig().fees.artistBps,
      protocolBps: getConfig().fees.protocolBps,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
