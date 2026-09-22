import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getAnalytics } from "@/services/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "SpotiPaid on-chain activity — fees, allocations, payments, and launches. Not Spotify listenership.",
};

export default async function AnalyticsPage() {
  const analytics = await getAnalytics("7d");

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-4xl bg-[radial-gradient(ellipse_at_top,_rgba(29,185,84,0.16),_transparent_70%)]"
      />

      <section className="relative overflow-hidden rounded-3xl border border-[#1f1f1f] bg-[#0c0c0c]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="analytics-scanline pointer-events-none absolute inset-0 opacity-[0.035]"
        />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Protocol telemetry
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Analytics.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9a9a9a] sm:text-base">
            High-resolution view of fee routing, artist allocations, payments,
            and launches — SpotiPaid / on-chain activity only.
          </p>
        </div>
      </section>

      <div className="relative mt-8">
        <AnalyticsDashboard initial={analytics} />
      </div>
    </div>
  );
}
