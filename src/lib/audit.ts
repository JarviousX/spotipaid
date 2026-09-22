import { prisma } from "@/lib/db";

export interface AuditEntry {
  action: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  actorAdminId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Persist an audit log row. Failures are swallowed (logged) so audit
 * never blocks the primary operation path.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorUserId: entry.actorUserId,
        actorAdminId: entry.actorAdminId,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress: entry.ipAddress,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}

/** Synchronous / in-memory audit helper for tests and offline paths */
export function formatAuditLine(entry: AuditEntry): string {
  const meta = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";
  const actor = entry.actorAdminId ?? entry.actorUserId ?? "system";
  const entity =
    entry.entityType && entry.entityId
      ? ` ${entry.entityType}:${entry.entityId}`
      : "";
  return `[audit] ${entry.action}${entity} by=${actor}${meta}`;
}
