import { Artwork } from "@/components/ui/artwork";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPercent, formatCompact } from "@/lib/utils";
import type { ClaimState, DemoArtist } from "@/types/domain";
import Link from "next/link";

function claimLabel(state: ClaimState): { label: string; tone: "success" | "warning" | "neutral" | "accent" } {
  switch (state) {
    case "VERIFIED":
      return { label: "Verified", tone: "success" };
    case "CLAIM_SUBMITTED":
    case "UNDER_REVIEW":
      return { label: "Claim pending", tone: "warning" };
    case "UNCLAIMED":
      return { label: "Unclaimed", tone: "neutral" };
    case "REJECTED":
      return { label: "Rejected", tone: "neutral" };
    case "SUSPENDED":
      return { label: "Suspended", tone: "neutral" };
    default:
      return { label: state, tone: "neutral" };
  }
}

export interface TopArtistsProps {
  artists: DemoArtist[];
}

export function TopArtists({ artists }: TopArtistsProps) {
  if (artists.length === 0) {
    return (
      <EmptyState
        title="No artists yet"
        description="Artists linked to music tokens will appear here once fees begin accruing."
      />
    );
  }

  return (
    <section aria-labelledby="top-artists-heading">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="top-artists-heading"
              className="text-2xl font-bold tracking-tight text-fg sm:text-3xl"
            >
              Top Artists
            </h2>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            Ranked by total fees generated across linked tokens.
          </p>
        </div>
        <Link
          href="/artists"
          className="hidden text-sm font-semibold text-accent hover:underline sm:inline"
        >
          View all
        </Link>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {artists.map((artist) => {
          const claim = claimLabel(artist.claimState);
          return (
            <li key={artist.id}>
              <Link
                href={`/artist/${artist.id}`}
                className="group flex h-full flex-col gap-4 rounded-md border border-border bg-bg-elevated/40 p-4 transition-colors hover:border-[#3a3a3a] hover:bg-bg-elevated/70"
              >
                <div className="flex items-start gap-3">
                  <Artwork
                    src={artist.imageUrl}
                    alt={artist.displayName}
                    size={56}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold tracking-tight text-fg group-hover:text-white">
                      {artist.displayName}
                    </p>
                    <Badge tone={claim.tone} className="mt-1.5">
                      {claim.label}
                    </Badge>
                  </div>
                </div>
                <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                      Tokens
                    </dt>
                    <dd className="mt-0.5 font-mono font-semibold tabular-nums">
                      {artist.tokenCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                      Allocation
                    </dt>
                    <dd className="mt-0.5 font-mono font-semibold tabular-nums text-accent">
                      {formatPercent(artist.artistAllocationBps)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                      Total fees
                    </dt>
                    <dd className="mt-0.5 font-mono font-semibold tabular-nums">
                      {formatCompact(artist.totalFeesUsd)}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
