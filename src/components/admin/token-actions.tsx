"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TokenModerationActions({
  tokenId,
  discoveryDisabled,
  flaggedMaliciousMeta,
}: {
  tokenId: string;
  discoveryDisabled: boolean;
  flaggedMaliciousMeta: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tokens/${tokenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() =>
          void patch({ discoveryDisabled: !discoveryDisabled })
        }
      >
        {discoveryDisabled ? "Enable discovery" : "Disable discovery"}
      </Button>
      <Button
        size="sm"
        variant={flaggedMaliciousMeta ? "ghost" : "danger"}
        disabled={busy}
        onClick={() =>
          void patch({
            flaggedMaliciousMeta: !flaggedMaliciousMeta,
            status: !flaggedMaliciousMeta ? "MALICIOUS" : "ACTIVE",
          })
        }
      >
        {flaggedMaliciousMeta ? "Clear flag" : "Flag impersonation / malicious"}
      </Button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
