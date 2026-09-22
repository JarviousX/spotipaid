import { roleCan } from "@/components/admin/rbac";
import { Badge } from "@/components/ui/badge";
import { getAdminSession } from "@/lib/auth/session";
import { listIntegrations } from "@/services/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Integrations" };

export default async function AdminIntegrationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleCan(session.role, "admin:read")) redirect("/admin");

  const events = await listIntegrations(50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Launchpad ingest, moderation reports, opt-outs, and webhook-style
          events. Payloads with secrets are omitted from this view.
        </p>
      </header>

      <ul className="divide-y divide-border rounded-md border border-border">
        {events.length === 0 ? (
          <li className="px-4 py-8 text-sm text-fg-muted">No events.</li>
        ) : (
          events.map((e) => (
            <li key={e.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{e.source}</span>
                <span className="text-fg-muted">·</span>
                <span className="font-mono text-sm">{e.eventType}</span>
                <Badge tone="neutral">{e.status}</Badge>
                {e.isDemo ? <Badge tone="warning">Demo</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {new Date(e.createdAt).toLocaleString()}
                {e.externalId ? ` · ext ${e.externalId}` : ""}
                {e.errorMessage ? ` · ${e.errorMessage}` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
