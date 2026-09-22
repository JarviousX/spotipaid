import { Adm1nConsole } from "@/components/adm1n/console";
import { getAdminSession } from "@/lib/auth/session";
import { ensureDatabase, prisma } from "@/lib/db";
import { getAdminProtocolConfig } from "@/services/protocol-config";
import { listWalletConnectionEvents } from "@/services/wallet-activity";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ADM1N Console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Adm1nPage() {
  const session = await getAdminSession();
  if (!session) redirect("/adm1n/login");

  await ensureDatabase();

  const [config, auditRows, walletRows] = await Promise.all([
    getAdminProtocolConfig(),
    prisma.auditLog
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      })
      .catch(() => []),
    listWalletConnectionEvents(30),
  ]);

  const logs = auditRows.map((row) => {
    let meta: Record<string, unknown> = {};
    if (row.metadata) {
      try {
        meta = JSON.parse(row.metadata) as Record<string, unknown>;
      } catch {
        meta = {};
      }
    }
    return {
      id: row.id,
      timestamp: row.createdAt.toISOString(),
      action: row.action,
      previous: (meta.previous as string | null | undefined) ?? null,
      next: (meta.next as string | null | undefined) ?? null,
      success: Boolean(meta.success ?? true),
      sessionId: (meta.sessionId as string | null | undefined) ?? row.actorAdminId,
      ipAddress: row.ipAddress,
    };
  });

  const walletEvents = walletRows.map((r) => ({
    id: r.id,
    address: r.address,
    event: r.event,
    network: r.network,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
  }));

  return (
    <Adm1nConsole
      sessionId={session.sub}
      role={session.role}
      initialConfig={config}
      initialLogs={logs}
      initialWalletEvents={walletEvents}
    />
  );
}
