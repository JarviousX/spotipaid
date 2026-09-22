import { ArtistPageClient } from "@/components/artist/artist-page-client";
import { Artwork } from "@/components/ui/artwork";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { subtract } from "@/domain/money";
import {
  canClaimProfile,
  claimStateLabel,
  claimStateTone,
  isArtistVerified,
} from "@/lib/claim-labels";
import { spotifySearchUrl } from "@/lib/external-links";
import { formatUsd } from "@/lib/utils";
import {
  getArtistByIdOrSlug,
  getArtistPayments,
  getArtistTokens,
} from "@/services/catalog";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtistByIdOrSlug(id);
  return {
    title: artist?.displayName ?? "Artist",
    description: artist
      ? `${artist.displayName} on SpotiPaid — fees, tokens, and claim status`
      : "Artist not found",
  };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  const artist = await getArtistByIdOrSlug(id);

  if (!artist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Artist not found"
          description="This artist is not in the catalog."
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

  const [tokens, payments] = await Promise.all([
    getArtistTokens(artist.id),
    getArtistPayments(artist.id),
  ]);

  const totalGenerated = artist.totalFeesUsd;
  const pending = artist.balanceUsd;
  const totalPaid = (() => {
    const diff = subtract(totalGenerated, pending);
    return diff.startsWith("-") ? "0.000000" : diff;
  })();

  const verified = isArtistVerified(artist.claimState);
  const claimable = canClaimProfile(artist.claimState);
  const spotifyUrl = spotifySearchUrl(artist.displayName);
  const profilePath = `/artist/${artist.slug}`;

  const aboutBlurb = verified
    ? `${artist.displayName} is verified on SpotiPaid. Linked tokens attribute creator fees to this profile according to each token’s fee split.`
    : claimable
      ? `${artist.displayName} has not claimed this SpotiPaid profile. Tokens may still attribute fees to this name — that does not mean the artist created, approved, or endorsed those tokens.`
      : `${artist.displayName} has a claim in progress (${claimStateLabel(artist.claimState)}). Fee attribution continues while verification is reviewed.`;

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
      >
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-2xl"
          style={{ backgroundImage: `url(${artist.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/80 to-bg" />
      </div>

      <header className="flex flex-col gap-8 sm:flex-row sm:items-end">
        <Artwork
          src={artist.imageUrl}
          alt={artist.displayName}
          size={168}
          priority
          spotifyUrl={spotifyUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={claimStateTone(artist.claimState)}>
              {claimStateLabel(artist.claimState)}
            </Badge>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            {artist.displayName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              Spotify
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            {claimable ? (
              <Link
                href={`${profilePath}/claim`}
                className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold tracking-tight text-[#0a0a0a] hover:bg-[#1ed760]"
              >
                Claim Artist Profile
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {claimable ? (
        <section className="mt-8 rounded-md border border-warning/30 bg-warning/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-warning">
            Unclaimed profile
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {formatUsd(totalGenerated)} generated for this artist
          </p>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Fees attributed to {artist.displayName} are held pending a verified
            claim. This does not imply the artist created, approved, or endorsed
            any linked token.
          </p>
          <Link
            href={`${profilePath}/claim`}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold tracking-tight text-[#0a0a0a] hover:bg-[#1ed760]"
          >
            Claim Artist Profile
          </Link>
        </section>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total generated", value: formatUsd(totalGenerated) },
          { label: "Total paid", value: formatUsd(totalPaid) },
          {
            label: "Pending balance",
            value: formatUsd(pending),
            accent: true,
          },
          { label: "Tokens", value: String(tokens.length || artist.tokenCount) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-border bg-bg-elevated/50 p-4 backdrop-blur-sm"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {s.label}
            </dt>
            <dd
              className={
                s.accent
                  ? "mt-1 font-mono text-2xl font-semibold tabular-nums text-accent"
                  : "mt-1 font-mono text-2xl font-semibold tabular-nums text-fg"
              }
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <ArtistPageClient
        artistId={artist.id}
        displayName={artist.displayName}
        claimState={artist.claimState}
        artistAllocationBps={artist.artistAllocationBps}
        tokens={tokens}
        payments={payments}
        aboutBlurb={aboutBlurb}
      />
    </div>
  );
}
