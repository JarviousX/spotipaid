import { z } from "zod";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { assertCsrf, getCsrfCookie } from "@/lib/auth/csrf";
import {
  getAdminProtocolConfig,
  updateContractAddress,
  updateFeeWallet,
  updateMaintenanceMode,
  updateXAccount,
} from "@/services/protocol-config";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession("settings:write");
    const { ensureDatabase } = await import("@/lib/db");
    await ensureDatabase();
    const config = await getAdminProtocolConfig();
    return jsonOk({ config });
  } catch (err) {
    return handleRouteError(err);
  }
}

const patchSchema = z.discriminatedUnion("field", [
  z.object({
    field: z.literal("contractAddress"),
    value: z.string().min(1).max(64),
    confirm: z.literal(true),
  }),
  z.object({
    field: z.literal("feeWallet"),
    value: z.string().min(1).max(64),
    confirm: z.literal(true),
  }),
  z.object({
    field: z.literal("xAccount"),
    value: z.string().min(1).max(120),
  }),
  z.object({
    field: z.literal("maintenance"),
    value: z.boolean(),
    confirm: z.literal(true),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminSession("settings:write");
    assertCsrf(request, await getCsrfCookie());

    const { ensureDatabase } = await import("@/lib/db");
    await ensureDatabase();

    const body = patchSchema.parse(await request.json());
    const ip = clientIp(request);

    let config;
    switch (body.field) {
      case "contractAddress":
        config = await updateContractAddress({
          session,
          address: body.value,
          confirm: body.confirm,
          ip,
        });
        break;
      case "feeWallet":
        config = await updateFeeWallet({
          session,
          address: body.value,
          confirm: body.confirm,
          ip,
        });
        break;
      case "xAccount":
        config = await updateXAccount({
          session,
          handleOrUrl: body.value,
          ip,
        });
        break;
      case "maintenance":
        config = await updateMaintenanceMode({
          session,
          enabled: body.value,
          confirm: body.confirm,
          ip,
        });
        break;
      default:
        config = await getAdminProtocolConfig();
    }

    // Push config into live pages immediately (CA chip, launch quote, shell).
    revalidatePath("/", "layout");
    revalidatePath("/launch");
    revalidatePath("/docs");
    revalidatePath("/disclosures");

    return jsonOk(
      { config, liveAt: Date.now() },
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
