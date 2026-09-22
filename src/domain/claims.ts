import type { ClaimState } from "@/types/domain";

export class ClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimError";
  }
}

/** Allowed claim lifecycle transitions for artist identity verification. */
const TRANSITIONS: Record<ClaimState, readonly ClaimState[]> = {
  UNCLAIMED: ["CLAIM_SUBMITTED"],
  CLAIM_SUBMITTED: ["UNDER_REVIEW", "REJECTED", "VERIFIED"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED", "UNDER_REVIEW"],
  VERIFIED: ["SUSPENDED", "UNDER_REVIEW"],
  REJECTED: ["CLAIM_SUBMITTED", "UNDER_REVIEW"],
  SUSPENDED: ["UNDER_REVIEW", "VERIFIED", "REJECTED"],
};

export function canTransitionClaim(
  from: ClaimState,
  to: ClaimState,
): boolean {
  if (from === to) return true;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function assertClaimTransition(
  from: ClaimState,
  to: ClaimState,
): void {
  if (!canTransitionClaim(from, to)) {
    throw new ClaimError(
      `Invalid claim transition: ${from} → ${to}`,
    );
  }
}

export function isTerminalClaimState(state: ClaimState): boolean {
  return state === "VERIFIED" || state === "SUSPENDED";
}

export function normalizeReviewDecision(
  decision: "approve" | "reject" | "review" | "suspend",
): ClaimState {
  switch (decision) {
    case "approve":
      return "VERIFIED";
    case "reject":
      return "REJECTED";
    case "review":
      return "UNDER_REVIEW";
    case "suspend":
      return "SUSPENDED";
    default:
      throw new ClaimError(`Unknown review decision: ${decision}`);
  }
}

export type VerificationLogEntry = {
  claimId: string;
  artistId: string;
  fromStatus: ClaimState;
  toStatus: ClaimState;
  reviewerId?: string;
  notes?: string;
  at: string;
};

/** Build a structured verification decision log line (no secrets). */
export function formatVerificationDecision(
  entry: VerificationLogEntry,
): string {
  const reviewer = entry.reviewerId ?? "system";
  const notes = entry.notes ? ` notes=${JSON.stringify(entry.notes)}` : "";
  return `[verification] claim=${entry.claimId} artist=${entry.artistId} ${entry.fromStatus}→${entry.toStatus} by=${reviewer}${notes} at=${entry.at}`;
}
