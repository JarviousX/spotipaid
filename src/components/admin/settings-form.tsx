"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "fee.artist_bps", label: "Artist % (bps)", hint: "Must sum with protocol to 10000" },
  { key: "fee.protocol_bps", label: "Protocol % (bps)" },
  { key: "payout.min_claim_usd", label: "Min claim (USD)" },
  { key: "payout.min_payout_usd", label: "Min payout (USD)" },
  { key: "treasury.address", label: "Treasury address" },
  { key: "chains.enabled", label: "Enabled chains", hint: "Comma-separated" },
  { key: "launchpads.enabled", label: "Launchpads", hint: "Comma-separated" },
  { key: "maintenance.mode", label: "Maintenance mode", hint: "true | false" },
];

export function SettingsForm({
  initial,
}: {
  initial: Record<string, string | number | boolean>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of FIELDS) {
      out[f.key] = String(initial[f.key] ?? "");
    }
    return out;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Save failed");
        return;
      }
      setMessage("Settings saved.");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      {FIELDS.map((f) => (
        <Input
          key={f.key}
          label={f.label}
          name={f.key}
          hint={f.hint}
          value={values[f.key] ?? ""}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
          }
        />
      ))}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <Button type="submit" variant="accent" disabled={loading}>
        {loading ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
