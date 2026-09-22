import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

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
 * Ensure SQLite tables exist (Vercel /tmp starts empty each cold start).
 * No-op when schema is already present.
 */
export async function ensureDatabase(): Promise<void> {
  if (!globalForPrisma.spotipaidDbReady) {
    globalForPrisma.spotipaidDbReady = (async () => {
      try {
        await prisma.$queryRaw`SELECT 1 FROM protocol_settings LIMIT 1`;
        return;
      } catch {
        /* schema missing — push below */
      }

      try {
        const prismaCli = require.resolve("prisma/build/index.js");
        await execFileAsync(
          process.execPath,
          [prismaCli, "db", "push", "--skip-generate", "--accept-data-loss"],
          {
            env: process.env,
            timeout: 90_000,
            windowsHide: true,
          },
        );
      } catch (err) {
        console.error("[db] ensureDatabase prisma db push failed", err);
      }
    })();
  }
  await globalForPrisma.spotipaidDbReady;
}

export default prisma;
