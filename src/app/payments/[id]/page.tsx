import { StatusBadge } from "@/components/ui/status-badge";
import { toPaymentStatus } from "@/lib/payments-ui";
import { formatPercent, formatUsd, truncateAddress } from "@/lib/utils";
import { getPaymentById } from "@/services/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentById(decodeURIComponent(id));
  if (!payment) return { title: "Payment" };
  return {
    title: `Payment · ${payment.artistName}`,
    description: `Settlement detail for ${payment.artistName} on SpotiPaid.`,
  };
}

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  const payment = await getPaymentById(decodeURIComponent(id));
  if (!payment) notFound();

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Artist", value: payment.artistName },
    {
      label: "Amount (artist)",
      value: (
        <span className="font-mono">
          {payment.amountFormatted ?? formatUsd(payment.amount)}
        </span>
      ),
    },
    {
      label: "Gross fee claim",
      value: (
        <span className="font-mono">
          {payment.grossAmount ? formatUsd(payment.grossAmount) : "—"}
        </span>
      ),
    },
    {
      label: "Artist allocation",
      value: (
        <span className="font-mono">
          {payment.artistAmount ? formatUsd(payment.artistAmount) : "—"}
          {payment.artistBps != null
            ? ` (${formatPercent(payment.artistBps)})`
            : ""}
        </span>
      ),
    },
    {
      label: "Protocol allocation",
      value: (
        <span className="font-mono">
          {payment.protocolAmount ? formatUsd(payment.protocolAmount) : "—"}
          {payment.protocolBps != null
            ? ` (${formatPercent(payment.protocolBps)})`
            : ""}
        </span>
      ),
    },
    {
      label: "Originating token",
      value: (
        <Link
          href={`/token/${payment.mint}`}
          className="font-mono text-accent hover:underline"
        >
          ${payment.symbol}
        </Link>
      ),
    },
    { label: "Method", value: payment.method ?? "Fee claim settlement" },
    { label: "Chain", value: payment.chain ?? "solana" },
    {
      label: "Date",
      value: new Date(payment.timestamp).toLocaleString(),
    },
    {
      label: "Chain tx / receipt",
      value: payment.txSignature ? (
        <span className="font-mono text-sm" title={payment.txSignature}>
          {truncateAddress(payment.txSignature, 10)}
        </span>
      ) : (
        "Not broadcast yet"
      ),
    },
    {
      label: "Source tx",
      value: payment.sourceTxSig ? (
        <span className="font-mono text-sm" title={payment.sourceTxSig}>
          {truncateAddress(payment.sourceTxSig, 10)}
        </span>
      ) : (
        "—"
      ),
    },
    {
      label: "External ref",
      value: payment.externalRef ?? "—",
    },
    {
      label: "Idempotency key",
      value: (
        <span className="font-mono text-sm">
          {payment.idempotencyKey ?? "—"}
        </span>
      ),
    },
    {
      label: "Fee claim id",
      value: (
        <span className="font-mono text-sm">{payment.feeClaimId ?? payment.id}</span>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
        <Link href="/payments" className="hover:text-fg">
          Payments
        </Link>{" "}
        / receipt
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {payment.amountFormatted ?? formatUsd(payment.amount)}
        </h1>
        <StatusBadge status={toPaymentStatus(payment.status)} />
      </div>
      <p className="mt-2 text-base text-fg-muted">
        Settlement for{" "}
        {payment.artistId ? (
          <Link
            href={`/artist/${payment.artistId}`}
            className="font-medium text-fg hover:text-accent"
          >
            {payment.artistName}
          </Link>
        ) : (
          payment.artistName
        )}
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-md border border-border p-4"
          >
            <dt className="text-xs uppercase tracking-[0.12em] text-fg-muted">
              {row.label}
            </dt>
            <dd className="mt-2 text-sm font-medium text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>

      <aside className="mt-8 rounded-md border border-border bg-bg-elevated/40 px-4 py-3 text-sm text-fg-muted">
        <p className="font-medium text-fg">Idempotency</p>
        <p className="mt-1">
          This receipt is keyed for safe retries. Submitting the same
          idempotency key again returns this ledger outcome and will not create
          a second artist or protocol obligation.
        </p>
      </aside>
    </div>
  );
}
