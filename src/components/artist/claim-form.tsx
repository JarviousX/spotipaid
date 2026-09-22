"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimStateLabel } from "@/lib/claim-labels";
import type { ClaimState } from "@/types/domain";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const METHODS = [
  {
    id: "website",
    title: "Official website / domain",
    description:
      "Control of the artist’s primary domain or a DNS TXT record pointing to SpotiPaid.",
  },
  {
    id: "social",
    title: "Verified social account",
    description:
      "A platform-verified account (or long-standing official handle) posting a signed claim code.",
  },
  {
    id: "label",
    title: "Label or rights holder",
    description:
      "Written confirmation from a label, manager, or rights administrator on letterhead or domain email.",
  },
  {
    id: "manual",
    title: "Manual review",
    description:
      "Human review of documentation when automated signals are incomplete.",
  },
  {
    id: "signed",
    title: "Signed cryptographic proof",
    description:
      "A message signed by a wallet or key previously published by the artist for verification.",
  },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

export type ClaimFormProps = {
  artistId: string;
  displayName: string;
  claimState: ClaimState;
  profileHref: string;
};

export function ClaimForm({
  artistId,
  displayName,
  claimState,
  profileHref,
}: ClaimFormProps) {
  const [method, setMethod] = useState<MethodId>("website");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(
    claimState === "CLAIM_SUBMITTED" ||
      claimState === "UNDER_REVIEW" ||
      claimState === "VERIFIED",
  );
  const [resultState, setResultState] = useState<ClaimState | null>(
    claimState !== "UNCLAIMED" && claimState !== "REJECTED"
      ? claimState
      : null,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const methodMeta = METHODS.find((m) => m.id === method)!;
    const evidenceNotes = [
      `Method: ${methodMeta.title}`,
      notes.trim() || null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch(
        `/api/artists/${encodeURIComponent(artistId)}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evidenceUrl: evidenceUrl.trim() || undefined,
            evidenceNotes,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        message?: string;
        claim?: { status?: ClaimState };
      } | null;

      if (!res.ok) {
        setError(
          data?.error ??
            data?.message ??
            "Could not submit claim. Try again shortly.",
        );
        return;
      }

      setSubmitted(true);
      setResultState(data?.claim?.status ?? "CLAIM_SUBMITTED");
    } catch {
      setError("Network error while submitting claim.");
    } finally {
      setSubmitting(false);
    }
  }

  if (claimState === "VERIFIED" || resultState === "VERIFIED") {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-success">
          Verified
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          {displayName} is verified on SpotiPaid
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          This profile has completed verification. No further claim is required.
        </p>
        <Link
          href={profileHref}
          className="mt-5 inline-flex text-sm font-semibold text-accent hover:underline"
        >
          Back to profile
        </Link>
      </div>
    );
  }

  if (submitted) {
    const state = resultState ?? "CLAIM_SUBMITTED";
    return (
      <div className="rounded-md border border-warning/30 bg-warning/10 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-warning">
          {claimStateLabel(state)}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Claim received for {displayName}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          Status moved from Unclaimed → {claimStateLabel(state)}. Our team will
          review evidence. Verification is not granted by owning a Spotify URL
          alone.
        </p>
        <Link
          href={profileHref}
          className="mt-5 inline-flex text-sm font-semibold text-accent hover:underline"
        >
          Back to profile
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-md border border-border bg-bg-elevated/30 p-5">
        <h2 className="text-lg font-bold tracking-tight">
          Verification is not Spotify URL possession
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Anyone can paste a Spotify link. SpotiPaid verifies that you control
          the artist identity through website/domain, verified social, label
          confirmation, manual review, or signed proof — not by copying a public
          catalog URL.
        </p>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-muted">
          Verification method
        </legend>
        <ul className="mt-3 grid gap-2">
          {METHODS.map((m) => {
            const selected = method === m.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={
                    selected
                      ? "w-full rounded-md border border-accent/40 bg-accent-dim px-4 py-3 text-left"
                      : "w-full rounded-md border border-border bg-bg-elevated/40 px-4 py-3 text-left hover:border-[#3a3a3a]"
                  }
                >
                  <p className="text-sm font-semibold text-fg">{m.title}</p>
                  <p className="mt-1 text-xs text-fg-muted">{m.description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <Input
        label="Evidence URL"
        name="evidenceUrl"
        type="url"
        placeholder="https://…"
        value={evidenceUrl}
        onChange={(e) => setEvidenceUrl(e.target.value)}
        hint="Optional link to a post, domain page, or document that supports your claim."
      />

      <label className="flex w-full flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-fg-muted">
          Notes
        </span>
        <textarea
          name="evidenceNotes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe how this evidence proves control of the artist identity."
          className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/40"
          maxLength={2000}
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" size="lg" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit claim"}
        </Button>
        <Link
          href={profileHref}
          className="text-sm font-semibold text-fg-muted hover:text-fg hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
