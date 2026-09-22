import { DocsExperience } from "@/components/docs/docs-experience";
import { getConfig } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How SpotiPaid works — fee routing from launchpads to artist allocations, the split, claims, and withdrawals.",
};

export default function DocsPage() {
  const fees = getConfig().fees;
  const artistPct = `${(fees.artistBps / 100).toFixed(0)}%`;
  const protocolPct = `${(fees.protocolBps / 100).toFixed(0)}%`;

  return (
    <DocsExperience artistPct={artistPct} protocolPct={protocolPct} />
  );
}
