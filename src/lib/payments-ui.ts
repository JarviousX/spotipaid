import type { PaymentStatus } from "@/components/ui/status-badge";

export type PaymentFilter =
  | "all"
  | "pending"
  | "processing"
  | "paid"
  | "failed";

export function toPaymentStatus(status: string): PaymentStatus {
  const s = status.toUpperCase();
  switch (s) {
    case "PENDING":
      return "pending";
    case "SUBMITTED":
    case "PROCESSING":
      return "processing";
    case "CONFIRMED":
    case "PROCESSED":
    case "PAID":
      return "paid";
    case "FAILED":
    case "REVERSED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

export function matchesPaymentFilter(
  status: string,
  filter: PaymentFilter,
): boolean {
  if (filter === "all") return true;
  return toPaymentStatus(status) === filter;
}
