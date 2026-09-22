import { roleCan } from "@/components/admin/rbac";
import { TokenModerationActions } from "@/components/admin/token-actions";
import { Badge } from "@/components/ui/badge";
import { getAdminSession } from "@/lib/auth/session";
import { listAdminTokens } from "@/services/admin";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Tokens" };

export default async function AdminTokensPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleCan(session.role, "tokens:moderate")) redirect("/admin");

  const tokens = await listAdminTokens(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Token moderation</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Disable discovery or flag impersonation / malicious metadata. Actions
          are audit-logged.
        </p>
      </header>

      <ul className="divide-y divide-border rounded-md border border-border">
        {tokens.length === 0 ? (
          <li className="px-4 py-8 text-sm text-fg-muted">No tokens.</li>
        ) : (
          tokens.map((token) => (
            <li
              key={token.id}
              className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <Link
                  href={`/token/${token.mint}`}
                  className="font-semibold hover:text-accent"
                >
                  ${token.symbol}
                </Link>
                <p className="mt-1 text-sm text-fg-muted">{token.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="neutral">{token.status}</Badge>
                  {token.discoveryDisabled ? (
                    <Badge tone="warning">Discovery off</Badge>
                  ) : null}
                  {token.flaggedMaliciousMeta ? (
                    <Badge tone="danger">Flagged</Badge>
                  ) : null}
                  {token.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                </div>
              </div>
              <TokenModerationActions
                tokenId={token.id}
                discoveryDisabled={token.discoveryDisabled}
                flaggedMaliciousMeta={token.flaggedMaliciousMeta}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
