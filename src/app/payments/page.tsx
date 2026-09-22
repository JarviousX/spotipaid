import { PaymentsLedger } from "@/components/payments/payments-ledger";
import { getRecentPayments, listArtists } from "@/services/catalog";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payments",
  description:
    "Artist payout ledger — fee claims, receipts, and settlement status on SpotiPaid.",
};

export default async function PaymentsPage() {
  const payments = await getRecentPayments(100);
  const artists = listArtists();

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-4xl bg-[radial-gradient(ellipse_at_top,_rgba(29,185,84,0.14),_transparent_70%)]"
      />

      <section className="relative overflow-hidden rounded-3xl border border-[#1f1f1f] bg-[#0c0c0c]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8 lg:p-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Ledger
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Payments.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a] sm:text-base">
              Creator fees settle into artist allocations — searchable receipts,
              on-chain trails, and finance-grade idempotency.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[#2a2a2a] px-6 text-sm font-semibold text-white transition-colors hover:border-accent/40 hover:text-accent"
          >
            Explore tokens
          </Link>
        </div>
      </section>

      <div className="relative mt-8">
        <PaymentsLedger payments={payments} artists={artists} />
      </div>
    </div>
  );
}
