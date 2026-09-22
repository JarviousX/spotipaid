"use client";

import { Artwork } from "@/components/ui/artwork";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  canClaimProfile,
  claimStateLabel,
  claimStateTone,
  isArtistVerified,
} from "@/lib/claim-labels";
import { compare } from "@/domain/money";
import { formatCompact, formatUsd } from "@/lib/utils";
import type { DemoArtist } from "@/types/domain";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "all" | "verified" | "unclaimed";

export type ArtistsDirectoryProps = {
  artists: DemoArtist[];
};

export function ArtistsDirectory({ artists }: ArtistsDirectoryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const verified = artists.filter((a) => isArtistVerified(a.claimState)).length;
    const unclaimed = artists.filter((a) => a.claimState === "UNCLAIMED").length;
    const pending = artists.filter(
      (a) =>
        a.claimState === "CLAIM_SUBMITTED" || a.claimState === "UNDER_REVIEW",
    ).length;
    return { total: artists.length, verified, unclaimed, pending };
  }, [artists]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artists
      .filter((a) => {
        if (filter === "verified") return isArtistVerified(a.claimState);
        if (filter === "unclaimed") return a.claimState === "UNCLAIMED";
        return true;
      })
      .filter((a) => {
        if (!q) return true;
        return (
          a.displayName.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => compare(b.totalFeesUsd, a.totalFeesUsd));
  }, [artists, filter, query]);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "verified", label: "Verified" },
    { id: "unclaimed", label: "Unclaimed" },
  ];

  return (
    <div>
      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Artists", value: String(stats.total) },
          { label: "Verified", value: String(stats.verified) },
          { label: "Unclaimed", value: String(stats.unclaimed) },
          { label: "In review", value: String(stats.pending) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-border bg-bg-elevated/40 p-4"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {s.label}
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="inline-flex gap-1 rounded-md border border-border bg-bg-elevated/50 p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "rounded-sm bg-fg px-3 py-1.5 text-sm font-semibold text-bg"
                  : "rounded-sm px-3 py-1.5 text-sm font-semibold text-fg-muted hover:text-fg"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:max-w-xs">
          <Input
            name="artist-search"
            placeholder="Search artists…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search artists"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No artists match"
          description="Try another filter or clear the search."
          action={
            <button
              type="button"
              className="text-sm font-semibold text-accent hover:underline"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((artist) => {
            const tone = claimStateTone(artist.claimState);
            const claimable = canClaimProfile(artist.claimState);
            return (
              <li key={artist.id}>
                <div className="flex h-full flex-col rounded-md border border-border bg-bg-elevated/40 p-4">
                  <Link
                    href={`/artist/${artist.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <Artwork
                      src={artist.imageUrl}
                      alt={artist.displayName}
                      size={64}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold tracking-tight text-fg group-hover:text-white">
                          {artist.displayName}
                        </p>
                      </div>
                      <Badge tone={tone} className="mt-1.5">
                        {claimStateLabel(artist.claimState)}
                      </Badge>
                    </div>
                  </Link>

                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                        Generated
                      </dt>
                      <dd className="mt-0.5 font-mono font-semibold tabular-nums">
                        {formatCompact(artist.totalFeesUsd)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                        Pending
                      </dt>
                      <dd className="mt-0.5 font-mono font-semibold tabular-nums text-accent">
                        {formatUsd(artist.balanceUsd)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                        Tokens
                      </dt>
                      <dd className="mt-0.5 font-mono font-semibold tabular-nums">
                        {artist.tokenCount}
                      </dd>
                    </div>
                  </dl>

                  {claimable ? (
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="text-xs text-fg-muted">
                        {formatUsd(artist.totalFeesUsd)} generated for this
                        artist — not an endorsement.
                      </p>
                      <Link
                        href={`/artist/${artist.slug}/claim`}
                        className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
                      >
                        Claim Artist Profile
                      </Link>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
