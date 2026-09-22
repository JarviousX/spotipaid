import { describe, expect, it } from "vitest";
import {
  assertClaimTransition,
  canTransitionClaim,
  ClaimError,
  formatVerificationDecision,
  normalizeReviewDecision,
} from "@/domain/claims";

describe("claims domain", () => {
  it("allows UNCLAIMED → CLAIM_SUBMITTED", () => {
    expect(canTransitionClaim("UNCLAIMED", "CLAIM_SUBMITTED")).toBe(true);
  });

  it("rejects UNCLAIMED → VERIFIED", () => {
    expect(canTransitionClaim("UNCLAIMED", "VERIFIED")).toBe(false);
    expect(() => assertClaimTransition("UNCLAIMED", "VERIFIED")).toThrow(
      ClaimError,
    );
  });

  it("maps review decisions to claim states", () => {
    expect(normalizeReviewDecision("approve")).toBe("VERIFIED");
    expect(normalizeReviewDecision("reject")).toBe("REJECTED");
    expect(normalizeReviewDecision("review")).toBe("UNDER_REVIEW");
    expect(normalizeReviewDecision("suspend")).toBe("SUSPENDED");
  });

  it("formats verification decision logs without secrets", () => {
    const line = formatVerificationDecision({
      claimId: "c1",
      artistId: "a1",
      fromStatus: "UNDER_REVIEW",
      toStatus: "VERIFIED",
      reviewerId: "admin1",
      notes: "ok",
      at: "2026-01-01T00:00:00.000Z",
    });
    expect(line).toContain("UNDER_REVIEW→VERIFIED");
    expect(line).toContain("admin1");
    expect(line).not.toContain("password");
  });
});
