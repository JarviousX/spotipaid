"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClaimReviewActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(decision: "approve" | "reject" | "review" | "suspend") {
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Review failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="accent"
        disabled={!!busy}
        onClick={() => void review("approve")}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={!!busy}
        onClick={() => void review("review")}
      >
        Under review
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={!!busy}
        onClick={() => void review("reject")}
      >
        Reject
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!!busy}
        onClick={() => void review("suspend")}
      >
        Suspend
      </Button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
