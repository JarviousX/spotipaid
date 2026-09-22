import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "available"
  | "claimed"
  | "failed"
  | "cancelled";

const statusConfig: Record<
  PaymentStatus,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: "Pending", tone: "warning" },
  processing: { label: "Processing", tone: "accent" },
  paid: { label: "Paid", tone: "success" },
  available: { label: "Available", tone: "accent" },
  claimed: { label: "Claimed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export interface StatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge tone={config.tone} className={cn(className)}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "paid" || status === "claimed"
            ? "bg-success"
            : status === "failed"
              ? "bg-danger"
              : status === "pending"
                ? "bg-warning"
                : status === "cancelled"
                  ? "bg-fg-muted"
                  : "bg-accent",
        )}
        aria-hidden
      />
      {config.label}
    </Badge>
  );
}
