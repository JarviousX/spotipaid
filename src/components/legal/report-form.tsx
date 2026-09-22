"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type FormEvent } from "react";

const TARGET_TYPES = ["token", "artist", "music", "other"] as const;

export function ReportForm() {
  const [targetType, setTargetType] =
    useState<(typeof TARGET_TYPES)[number]>("token");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: targetId.trim(),
          reason: reason.trim(),
          details: details.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        report?: { id: string };
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(body.error ?? "Report failed");
        return;
      }
      setStatus("ok");
      setMessage(
        `Report submitted${body.report?.id ? ` (ref ${body.report.id})` : ""}.`,
      );
      setTargetId("");
      setReason("");
      setDetails("");
    } catch {
      setStatus("error");
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
      <label className="flex w-full flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-fg-muted">
          Target type
        </span>
        <select
          name="targetType"
          value={targetType}
          onChange={(e) =>
            setTargetType(e.target.value as (typeof TARGET_TYPES)[number])
          }
          className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm text-fg"
        >
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Target ID"
        name="targetId"
        required
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        hint="Mint, artist id/slug, or other identifier"
      />
      <Input
        label="Reason"
        name="reason"
        required
        minLength={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        hint="e.g. impersonation, malicious metadata"
      />
      <label className="flex w-full flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-fg-muted">
          Details
        </span>
        <textarea
          name="details"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
          placeholder="Optional context for moderators"
        />
      </label>
      {message ? (
        <p
          className={
            status === "error" ? "text-sm text-danger" : "text-sm text-success"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" variant="accent" disabled={loading}>
        {loading ? "Submitting…" : "Submit report"}
      </Button>
    </form>
  );
}
