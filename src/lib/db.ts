import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  spotipaidDbReady?: Promise<void>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Create the adm1n-critical tables if missing.
 * Avoids `prisma db push` (CLI path breaks when bundled on Vercel).
 */
export async function ensureDatabase(): Promise<void> {
  if (!globalForPrisma.spotipaidDbReady) {
    globalForPrisma.spotipaidDbReady = (async () => {
      try {
        await prisma.$queryRaw`SELECT 1 FROM protocol_settings LIMIT 1`;
        return;
      } catch {
        /* create below */
      }

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "protocol_settings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "updatedAt" DATETIME NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "protocol_settings_key_key"
        ON "protocol_settings"("key");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "audit_logs" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "action" TEXT NOT NULL,
          "entityType" TEXT,
          "entityId" TEXT,
          "actorUserId" TEXT,
          "actorAdminId" TEXT,
          "metadata" TEXT,
          "ipAddress" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx"
        ON "audit_logs"("entityType", "entityId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx"
        ON "audit_logs"("createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"
        ON "audit_logs"("action");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "wallet_connection_events" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "address" TEXT NOT NULL,
          "chain" TEXT NOT NULL DEFAULT 'solana',
          "network" TEXT,
          "event" TEXT NOT NULL,
          "userAgent" TEXT,
          "ipAddress" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "wallet_connection_events_address_createdAt_idx"
        ON "wallet_connection_events"("address", "createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "wallet_connection_events_event_createdAt_idx"
        ON "wallet_connection_events"("event", "createdAt");
      `);
    })();
  }
  await globalForPrisma.spotipaidDbReady;
}

export default prisma;
