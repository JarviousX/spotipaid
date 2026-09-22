"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PaymentAdminActions({
  paymentId,
  canPayout,
}: {
  paymentId: string;
  canPayout: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(path: "retry" | "pause") {
    if (!canPayout) return;
    setBusy(path);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/${path}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `${path} failed`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  if (!canPayout) {
    return (
      <span className="text-xs text-fg-muted">Read-only for your role</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="accent"
        disabled={!!busy}
        onClick={() => void call("retry")}
      >
        Retry
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={!!busy}
        onClick={() => void call("pause")}
      >
        Pause
      </Button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
