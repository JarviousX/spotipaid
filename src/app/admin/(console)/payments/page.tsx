import { roleCan } from "@/components/admin/rbac";
import { PaymentAdminActions } from "@/components/admin/payment-actions";
import { Badge } from "@/components/ui/badge";
import { getAdminSession } from "@/lib/auth/session";
import { formatUsd } from "@/lib/utils";
import { listAdminPayments } from "@/services/admin";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleCan(session.role, "finance:read")) redirect("/admin");

  const canPayout = roleCan(session.role, "finance:payout");
  const payments = await listAdminPayments(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Inspect fee claims, retry settlement, or pause processing. Retries are
          idempotent — the same claim key will not double-credit.
        </p>
      </header>

      <ul className="divide-y divide-border rounded-md border border-border">
        {payments.length === 0 ? (
          <li className="px-4 py-8 text-sm text-fg-muted">No fee claims.</li>
        ) : (
          payments.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <Link
                  href={`/payments/${p.id}`}
                  className="font-mono font-semibold hover:text-accent"
                >
                  {formatUsd(p.artistAmount)}
                </Link>
                <p className="mt-1 text-sm text-fg-muted">
                  Gross {formatUsd(p.grossAmount)} · protocol{" "}
                  {formatUsd(p.protocolAmount)} · mint{" "}
                  <span className="font-mono">{p.mint.slice(0, 8)}…</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="neutral">{p.status}</Badge>
                  {p.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                </div>
              </div>
              <PaymentAdminActions paymentId={p.id} canPayout={canPayout} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
