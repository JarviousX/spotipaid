import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdminSession("audit:read");
    const url = new URL(request.url);
    const limit = Math.min(
      200,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50),
    );

    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const logs = rows.map((row) => {
      let meta: Record<string, unknown> | null = null;
      if (row.metadata) {
        try {
          meta = JSON.parse(row.metadata) as Record<string, unknown>;
        } catch {
          meta = null;
        }
      }
      // Strip any accidental secret-looking keys
      if (meta) {
        for (const key of Object.keys(meta)) {
          if (/password|passphrase|secret|seed|private|token|hash/i.test(key)) {
            delete meta[key];
          }
        }
      }
      return {
        id: row.id,
        timestamp: row.createdAt.toISOString(),
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        actorAdminId: row.actorAdminId,
        ipAddress: row.ipAddress,
        previous: meta?.previous ?? null,
        next: meta?.next ?? null,
        success: meta?.success ?? true,
        sessionId: meta?.sessionId ?? null,
        actor: meta?.actor ?? null,
      };
    });

    return jsonOk({ logs });
  } catch (err) {
    return handleRouteError(err);
  }
}
