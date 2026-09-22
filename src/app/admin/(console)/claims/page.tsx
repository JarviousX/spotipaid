import { ClaimReviewActions } from "@/components/admin/claim-actions";
import { roleCan } from "@/components/admin/rbac";
import { Badge } from "@/components/ui/badge";
import { getAdminSession } from "@/lib/auth/session";
import { listAdminClaims } from "@/services/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Claims" };

export default async function AdminClaimsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleCan(session.role, "claims:review")) redirect("/admin");

  const claims = await listAdminClaims(50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Artists / claims</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Review artist verification submissions. Approvals update claim state
          server-side.
        </p>
      </header>

      <ul className="divide-y divide-border rounded-md border border-border">
        {claims.length === 0 ? (
          <li className="px-4 py-8 text-sm text-fg-muted">No claims yet.</li>
        ) : (
          claims.map((claim) => (
            <li
              key={claim.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">
                  {claim.artistName ?? claim.artistId}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  {claim.id} · {new Date(claim.createdAt).toLocaleString()}
                </p>
                <Badge tone="neutral" className="mt-2">
                  {claim.status}
                </Badge>
              </div>
              <ClaimReviewActions claimId={claim.id} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
