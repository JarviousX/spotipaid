import { CapitalFlowExperience } from "@/components/capital-flow/capital-flow-experience";
import { getConfig } from "@/lib/config";
import { listArtists, listRecentPayments } from "@/services/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capital flow",
  description:
    "How SpotiPaid claims creator fees from launchpads, splits 80/20, and routes artist allocations.",
};

export default function CapitalFlowPage() {
  const fees = getConfig().fees;
  const payments = listRecentPayments(16);
  const artists = listArtists();

  return (
    <CapitalFlowExperience
      artistBps={fees.artistBps}
      protocolBps={fees.protocolBps}
      payments={payments}
      artists={artists}
    />
  );
}
