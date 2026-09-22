"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type FormEvent } from "react";

export function OptOutForm() {
  const [artistId, setArtistId] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage(null);
    try {
      const res = await fetch("/api/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artistId.trim() || undefined,
          email: email.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        optOut?: { id: string };
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(body.error ?? "Request failed");
        return;
      }
      setStatus("ok");
      setMessage(
        `Request received${body.optOut?.id ? ` (ref ${body.optOut.id})` : ""}. We will review on a commercially reasonable timeline.`,
      );
      setArtistId("");
      setEmail("");
      setReason("");
    } catch {
      setStatus("error");
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
      <Input
        label="Artist ID or slug"
        name="artistId"
        hint="Optional if email is provided"
        value={artistId}
        onChange={(e) => setArtistId(e.target.value)}
      />
      <Input
        label="Contact email"
        type="email"
        name="email"
        hint="Optional if artist ID is provided — used for follow-up"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label className="flex w-full flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-fg-muted">
          Reason
        </span>
        <textarea
          name="reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
          placeholder="Describe the rightsholder relationship and requested action"
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
        {loading ? "Submitting…" : "Submit opt-out request"}
      </Button>
    </form>
  );
}
