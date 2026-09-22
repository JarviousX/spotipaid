import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/session";
import {
  getPublicSafeSettings,
  listAdminClaims,
  listAdminPayments,
  listAdminTokens,
  listAuditLogs,
  listIntegrations,
} from "@/services/admin";
import { ROLE_PERMISSIONS } from "@/types/domain";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const permissions = ROLE_PERMISSIONS[session.role] ?? [];
  const [settings, claims, tokens, payments, integrations, audit] =
    await Promise.all([
      getPublicSafeSettings(),
      permissions.includes("claims:review")
        ? listAdminClaims(5)
        : Promise.resolve([]),
      permissions.includes("tokens:moderate")
        ? listAdminTokens(5)
        : Promise.resolve([]),
      permissions.includes("finance:read")
        ? listAdminPayments(5)
        : Promise.resolve([]),
      permissions.includes("admin:read")
        ? listIntegrations(5)
        : Promise.resolve([]),
      permissions.includes("audit:read")
        ? listAuditLogs(5)
        : Promise.resolve([]),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Control plane
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Role-gated console. UI sections appear only when your role includes
          the required permission.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {permissions.map((p) => (
          <Badge key={p} tone="neutral">
            {p}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Protocol</CardTitle>
          </CardHeader>
          <CardBody className="space-y-1 text-sm text-fg-muted">
            <p>
              Artist bps:{" "}
              <span className="font-mono text-fg">
                {String(settings["fee.artist_bps"] ?? "—")}
              </span>
            </p>
            <p>
              Protocol bps:{" "}
              <span className="font-mono text-fg">
                {String(settings["fee.protocol_bps"] ?? "—")}
              </span>
            </p>
            <p>
              Maintenance:{" "}
              <span className="font-mono text-fg">
                {String(settings["maintenance.mode"] ?? "false")}
              </span>
            </p>
            {permissions.includes("settings:write") ? (
              <Link
                href="/admin/settings"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Edit settings →
              </Link>
            ) : null}
          </CardBody>
        </Card>

        {permissions.includes("claims:review") ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent claims</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-fg-muted">
              <p>{claims.length} latest rows</p>
              <Link
                href="/admin/claims"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Review queue →
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {permissions.includes("tokens:moderate") ? (
          <Card>
            <CardHeader>
              <CardTitle>Tokens</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-fg-muted">
              <p>{tokens.length} sample rows</p>
              <Link
                href="/admin/tokens"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Moderate →
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {permissions.includes("finance:read") ? (
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-fg-muted">
              <p>{payments.length} fee claims</p>
              <Link
                href="/admin/payments"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Inspect →
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {permissions.includes("admin:read") ? (
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-fg-muted">
              <p>{integrations.length} recent events</p>
              <Link
                href="/admin/integrations"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Status →
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {permissions.includes("audit:read") ? (
          <Card>
            <CardHeader>
              <CardTitle>Audit</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-fg-muted">
              <p>{audit.length} recent entries</p>
              <Link
                href="/admin/audit"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Open log →
              </Link>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
