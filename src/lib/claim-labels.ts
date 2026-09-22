import type { BadgeTone } from "@/components/ui/badge";
import type { ClaimState } from "@/types/domain";

export function claimStateLabel(state: ClaimState): string {
  switch (state) {
    case "VERIFIED":
      return "Verified";
    case "CLAIM_SUBMITTED":
      return "Claim submitted";
    case "UNDER_REVIEW":
      return "Under review";
    case "UNCLAIMED":
      return "Unclaimed";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    default:
      return state;
  }
}

export function claimStateTone(state: ClaimState): BadgeTone {
  switch (state) {
    case "VERIFIED":
      return "success";
    case "CLAIM_SUBMITTED":
    case "UNDER_REVIEW":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
      return "danger";
    default:
      return "neutral";
  }
}

export function isArtistVerified(state: ClaimState): boolean {
  return state === "VERIFIED";
}

export function canClaimProfile(state: ClaimState): boolean {
  return state === "UNCLAIMED" || state === "REJECTED";
}
