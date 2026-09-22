import { prisma } from "@/lib/db";

export type WalletConnectionEventRow = {
  id: string;
  address: string;
  chain: string;
  network: string | null;
  event: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
};

/**
 * List wallet connection events.
 * Uses the Prisma delegate when available; falls back to raw SQL if the
 * client is stale (e.g. generate locked by a running Next process).
 */
export async function listWalletConnectionEvents(
  limit = 30,
): Promise<WalletConnectionEventRow[]> {
  const take = Math.min(200, Math.max(1, limit));
  const delegate = (
    prisma as unknown as {
      walletConnectionEvent?: {
        findMany: (args: unknown) => Promise<WalletConnectionEventRow[]>;
      };
    }
  ).walletConnectionEvent;

  if (delegate?.findMany) {
    try {
      return await delegate.findMany({
        orderBy: { createdAt: "desc" },
        take,
      });
    } catch {
      return [];
    }
  }

  try {
    return await prisma.$queryRaw<WalletConnectionEventRow[]>`
      SELECT id, address, chain, network, event, userAgent, ipAddress, createdAt
      FROM wallet_connection_events
      ORDER BY createdAt DESC
      LIMIT ${take}
    `;
  } catch {
    return [];
  }
}

export async function createWalletConnectionEvent(input: {
  address: string;
  chain: string;
  network?: string | null;
  event: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<boolean> {
  const delegate = (
    prisma as unknown as {
      walletConnectionEvent?: {
        create: (args: unknown) => Promise<unknown>;
      };
    }
  ).walletConnectionEvent;

  if (delegate?.create) {
    await delegate.create({
      data: {
        address: input.address,
        chain: input.chain,
        network: input.network ?? null,
        event: input.event,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    });
    return true;
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO wallet_connection_events (id, address, chain, network, event, userAgent, ipAddress, createdAt)
      VALUES (
        ${`wce_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`},
        ${input.address},
        ${input.chain},
        ${input.network ?? null},
        ${input.event},
        ${input.userAgent ?? null},
        ${input.ipAddress ?? null},
        ${new Date().toISOString()}
      )
    `;
    return true;
  } catch {
    return false;
  }
}
