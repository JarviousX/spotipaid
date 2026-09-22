import { ArtistsDirectory } from "@/components/artists/artists-directory";
import { listArtists } from "@/services/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Browse verified and unclaimed artists linked to music tokens on SpotiPaid.",
};

export default function ArtistsPage() {
  const artists = listArtists();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Roster
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          Artists
        </h1>
        <p className="mt-3 text-base text-fg-muted">
          Filter by verification status, search the roster, and claim unclaimed
          profiles. Fee totals do not imply endorsement.
        </p>
      </header>
      <ArtistsDirectory artists={artists} />
    </div>
  );
}
