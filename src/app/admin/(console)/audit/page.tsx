import { roleCan } from "@/components/admin/rbac";
import { getAdminSession } from "@/lib/auth/session";
import { listAuditLogs } from "@/services/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleCan(session.role, "audit:read")) redirect("/admin");

  const logs = await listAuditLogs(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Immutable-ish operational trail for admin actions, claims, moderation,
          and privacy requests.
        </p>
      </header>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-border bg-bg-elevated/80 text-fg-muted">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
                When
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
                Action
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
                Entity
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
                Actor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-fg-muted">
                  No audit entries.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-fg-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {log.entityType ?? "—"}
                    {log.entityId ? ` · ${log.entityId.slice(0, 12)}` : ""}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                    {log.actorAdminId?.slice(0, 10) ??
                      log.actorUserId?.slice(0, 10) ??
                      "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
