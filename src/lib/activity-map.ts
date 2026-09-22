import { formatUsd } from "@/domain/money";
import type { ActivityFeedItem } from "@/types/domain";

export type ActivityKind =
  | "trade"
  | "mint"
  | "claim"
  | "launch"
  | "payment";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  label: string;
  detail: string;
  amount?: string;
}

function mapFeedType(type: ActivityFeedItem["type"]): ActivityKind {
  switch (type) {
    case "TRADE":
      return "trade";
    case "TOKEN_LAUNCH":
      return "launch";
    case "FEE_CLAIM":
    case "CLAIM":
    case "VERIFICATION":
      return "claim";
    case "PAYOUT":
      return "payment";
    default:
      return "mint";
  }
}

function mapFeedLabel(type: ActivityFeedItem["type"]): string {
  switch (type) {
    case "TRADE":
      return "Trade";
    case "TOKEN_LAUNCH":
      return "Launch";
    case "FEE_CLAIM":
      return "Fees";
    case "CLAIM":
      return "Claim";
    case "VERIFICATION":
      return "Verified";
    case "PAYOUT":
      return "Payout";
    default:
      return "Activity";
  }
}

/** Server-safe mapper — keep out of client components. */
export function activityFromDemoFeed(
  items: ActivityFeedItem[],
): ActivityItem[] {
  return items.map((item) => ({
    id: item.id,
    kind: mapFeedType(item.type),
    label: mapFeedLabel(item.type),
    detail: item.subtitle ?? item.title,
    amount: item.amount
      ? formatUsd(item.amount, { compact: true })
      : undefined,
  }));
}
