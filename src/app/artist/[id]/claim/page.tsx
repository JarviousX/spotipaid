import { ClaimForm } from "@/components/artist/claim-form";
import { Artwork } from "@/components/ui/artwork";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  claimStateLabel,
  claimStateTone,
} from "@/lib/claim-labels";
import { formatUsd } from "@/lib/utils";
import { getArtistByIdOrSlug } from "@/services/catalog";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtistByIdOrSlug(id);
  return {
    title: artist ? `Claim ${artist.displayName}` : "Claim artist",
  };
}

export default async function ArtistClaimPage({ params }: Props) {
  const { id } = await params;
  const artist = await getArtistByIdOrSlug(id);

  if (!artist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Artist not found"
          description="Cannot start a claim for an unknown artist."
          action={
            <Link
              href="/artists"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Browse artists
            </Link>
          }
        />
      </div>
    );
  }

  const profileHref = `/artist/${artist.slug}`;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <Link
        href={profileHref}
        className="text-sm font-semibold text-fg-muted hover:text-fg hover:underline"
      >
        ← {artist.displayName}
      </Link>

      <header className="mt-6 flex items-center gap-4">
        <Artwork
          src={artist.imageUrl}
          alt={artist.displayName}
          size={72}
          priority
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={claimStateTone(artist.claimState)}>
              {claimStateLabel(artist.claimState)}
            </Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Claim {artist.displayName}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {formatUsd(artist.totalFeesUsd)} generated ·{" "}
            {formatUsd(artist.balanceUsd)} pending
          </p>
        </div>
      </header>

      <div className="mt-10">
        <ClaimForm
          artistId={artist.id}
          displayName={artist.displayName}
          claimState={artist.claimState}
          profileHref={profileHref}
        />
      </div>
    </div>
  );
}
