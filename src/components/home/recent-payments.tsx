import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type PaymentStatus } from "@/components/ui/status-badge";
import {
  MobileTable,
  MobileTableCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { formatRelativeTime, formatUsd, truncateAddress } from "@/lib/utils";
import type { DemoPayment, PayoutStatus } from "@/types/domain";
import Link from "next/link";

function toPaymentStatus(status: PayoutStatus): PaymentStatus {
  switch (status) {
    case "PENDING":
      return "pending";
    case "SUBMITTED":
      return "processing";
    case "CONFIRMED":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

export interface RecentPaymentsProps {
  payments: DemoPayment[];
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        description="Artist payouts will show here once fee claims settle."
      />
    );
  }

  return (
    <section aria-labelledby="recent-payments-heading">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="recent-payments-heading"
              className="text-2xl font-bold tracking-tight text-fg sm:text-3xl"
            >
              Recent Payments
            </h2>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            On-chain artist payouts from creator fee routing.
          </p>
        </div>
        <Link
          href="/payments"
          className="hidden text-sm font-semibold text-accent hover:underline sm:inline"
        >
          View all
        </Link>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Amount</TH>
            <TH>Artist</TH>
            <TH>Token</TH>
            <TH>When</TH>
            <TH>Receipt</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {payments.map((payment) => (
            <TR key={payment.id}>
              <TD className="font-mono font-semibold">
                {formatUsd(payment.amount)}
              </TD>
              <TD>
                {payment.artistId ? (
                  <Link
                    href={`/artist/${payment.artistId}`}
                    className="font-medium hover:text-accent"
                  >
                    {payment.artistName}
                  </Link>
                ) : (
                  payment.artistName
                )}
              </TD>
              <TD>
                <Link
                  href={`/token/${payment.mint}`}
                  className="font-mono text-fg-muted hover:text-fg"
                >
                  ${payment.symbol}
                </Link>
              </TD>
              <TD className="text-fg-muted">
                {formatRelativeTime(payment.timestamp)}
              </TD>
              <TD>
                {payment.txSignature ? (
                  <span
                    className="font-mono text-xs text-fg-muted"
                    title={payment.txSignature}
                  >
                    {truncateAddress(payment.txSignature, 6)}
                  </span>
                ) : (
                  <span className="text-fg-muted">—</span>
                )}
              </TD>
              <TD>
                <StatusBadge status={toPaymentStatus(payment.status)} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <MobileTable>
        {payments.map((payment) => (
          <MobileTableCard
            key={payment.id}
            title={
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono">{formatUsd(payment.amount)}</span>
                <StatusBadge status={toPaymentStatus(payment.status)} />
              </span>
            }
            rows={[
              { label: "Artist", value: payment.artistName },
              { label: "Token", value: `$${payment.symbol}` },
              {
                label: "When",
                value: formatRelativeTime(payment.timestamp),
              },
              {
                label: "Receipt",
                value: payment.txSignature
                  ? truncateAddress(payment.txSignature, 6)
                  : "—",
              },
            ]}
          />
        ))}
      </MobileTable>

      <div className="mt-4 md:hidden">
        <Link
          href="/payments"
          className="text-sm font-semibold text-accent hover:underline"
        >
          View all payments
        </Link>
      </div>
    </section>
  );
}
