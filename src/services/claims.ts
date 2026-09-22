import { z } from "zod";
import { nanoid } from "nanoid";
import {
  assertClaimTransition,
  formatVerificationDecision,
  normalizeReviewDecision,
  type VerificationLogEntry,
} from "@/domain/claims";
import { writeAuditLog, formatAuditLine } from "@/lib/audit";
import { prisma } from "@/lib/db";
import type { ClaimState } from "@/types/domain";

export class ClaimsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimError";
  }
}

const submitSchema = z.object({
  artistId: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
  evidenceNotes: z.string().trim().max(2000).optional(),
  userId: z.string().optional(),
});

const reviewSchema = z.object({
  claimId: z.string().min(1),
  decision: z.enum(["approve", "reject", "review", "suspend"]),
  reviewerNotes: z.string().trim().max(2000).optional(),
  reviewerId: z.string().min(1),
});

export type ClaimRecord = {
  id: string;
  artistId: string;
  userId: string | null;
  status: ClaimState;
  evidenceUrl: string | null;
  evidenceNotes: string | null;
  reviewerNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  artistName?: string;
};

/** In-memory claim store + verification log for demo / offline */
const memoryClaims = new Map<string, ClaimRecord>();
const verificationLog: VerificationLogEntry[] = [];

function logDecision(entry: VerificationLogEntry): void {
  verificationLog.unshift(entry);
  console.info(formatVerificationDecision(entry));
}

export function getVerificationLog(): VerificationLogEntry[] {
  return [...verificationLog];
}

export function resetClaimsMemory(): void {
  memoryClaims.clear();
  verificationLog.length = 0;
}

export async function submitClaim(input: {
  artistId: string;
  evidenceUrl?: string;
  evidenceNotes?: string;
  userId?: string;
}): Promise<ClaimRecord> {
  const parsed = submitSchema.parse(input);

  try {
    const artist = await prisma.artist.findFirst({
      where: {
        OR: [{ id: parsed.artistId }, { slug: parsed.artistId }],
      },
    });
    if (!artist) {
      throw new ClaimsServiceError("Artist not found");
    }

    const from = artist.claimState as ClaimState;
    assertClaimTransition(from, "CLAIM_SUBMITTED");

    const claim = await prisma.artistClaim.create({
      data: {
        artistId: artist.id,
        userId: parsed.userId,
        status: "CLAIM_SUBMITTED",
        evidenceUrl: parsed.evidenceUrl,
        evidenceNotes: parsed.evidenceNotes,
        isDemo: artist.isDemo,
      },
    });

    await prisma.artist.update({
      where: { id: artist.id },
      data: { claimState: "CLAIM_SUBMITTED" },
    });

    const entry: VerificationLogEntry = {
      claimId: claim.id,
      artistId: artist.id,
      fromStatus: from,
      toStatus: "CLAIM_SUBMITTED",
      notes: parsed.evidenceNotes,
      at: new Date().toISOString(),
    };
    logDecision(entry);

    await writeAuditLog({
      action: "claim.submit",
      entityType: "ArtistClaim",
      entityId: claim.id,
      actorUserId: parsed.userId,
      metadata: {
        artistId: artist.id,
        from,
        to: "CLAIM_SUBMITTED",
      },
    });

    return {
      id: claim.id,
      artistId: artist.id,
      userId: claim.userId,
      status: "CLAIM_SUBMITTED",
      evidenceUrl: claim.evidenceUrl,
      evidenceNotes: claim.evidenceNotes,
      reviewerNotes: claim.reviewerNotes,
      reviewedBy: claim.reviewedBy,
      reviewedAt: claim.reviewedAt?.toISOString() ?? null,
      isDemo: claim.isDemo,
      createdAt: claim.createdAt.toISOString(),
      updatedAt: claim.updatedAt.toISOString(),
      artistName: artist.displayName,
    };
  } catch (err) {
    if (err instanceof ClaimsServiceError) throw err;
    if (err && typeof err === "object" && "name" in err && err.name === "ClaimError") {
      throw err;
    }

    // Demo / offline path
    const id = `claim_${nanoid(10)}`;
    const now = new Date().toISOString();
    const record: ClaimRecord = {
      id,
      artistId: parsed.artistId,
      userId: parsed.userId ?? null,
      status: "CLAIM_SUBMITTED",
      evidenceUrl: parsed.evidenceUrl ?? null,
      evidenceNotes: parsed.evidenceNotes ?? null,
      reviewerNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    };
    memoryClaims.set(id, record);
    logDecision({
      claimId: id,
      artistId: parsed.artistId,
      fromStatus: "UNCLAIMED",
      toStatus: "CLAIM_SUBMITTED",
      notes: parsed.evidenceNotes,
      at: now,
    });
    console.info(
      formatAuditLine({
        action: "claim.submit",
        entityType: "ArtistClaim",
        entityId: id,
        metadata: { offline: true },
      }),
    );
    return record;
  }
}

export async function reviewClaim(input: {
  claimId: string;
  decision: "approve" | "reject" | "review" | "suspend";
  reviewerNotes?: string;
  reviewerId: string;
}): Promise<ClaimRecord> {
  const parsed = reviewSchema.parse(input);
  const toStatus = normalizeReviewDecision(parsed.decision);

  try {
    const claim = await prisma.artistClaim.findUnique({
      where: { id: parsed.claimId },
      include: { artist: true },
    });
    if (!claim) {
      throw new ClaimsServiceError("Claim not found");
    }

    const from = claim.status as ClaimState;
    assertClaimTransition(from, toStatus);

    const updated = await prisma.artistClaim.update({
      where: { id: claim.id },
      data: {
        status: toStatus,
        reviewerNotes: parsed.reviewerNotes,
        reviewedBy: parsed.reviewerId,
        reviewedAt: new Date(),
      },
      include: { artist: true },
    });

    await prisma.artist.update({
      where: { id: claim.artistId },
      data: {
        claimState: toStatus,
        verifiedAt: toStatus === "VERIFIED" ? new Date() : undefined,
      },
    });

    const entry: VerificationLogEntry = {
      claimId: claim.id,
      artistId: claim.artistId,
      fromStatus: from,
      toStatus,
      reviewerId: parsed.reviewerId,
      notes: parsed.reviewerNotes,
      at: new Date().toISOString(),
    };
    logDecision(entry);

    await writeAuditLog({
      action: "claim.review",
      entityType: "ArtistClaim",
      entityId: claim.id,
      actorAdminId: parsed.reviewerId,
      metadata: { from, to: toStatus, decision: parsed.decision },
    });

    return {
      id: updated.id,
      artistId: updated.artistId,
      userId: updated.userId,
      status: toStatus,
      evidenceUrl: updated.evidenceUrl,
      evidenceNotes: updated.evidenceNotes,
      reviewerNotes: updated.reviewerNotes,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      isDemo: updated.isDemo,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      artistName: updated.artist.displayName,
    };
  } catch (err) {
    if (err instanceof ClaimsServiceError) throw err;
    if (err && typeof err === "object" && "name" in err && err.name === "ClaimError") {
      throw err;
    }

    const mem = memoryClaims.get(parsed.claimId);
    if (!mem) {
      throw new ClaimsServiceError("Claim not found");
    }
    assertClaimTransition(mem.status, toStatus);
    const now = new Date().toISOString();
    const updated: ClaimRecord = {
      ...mem,
      status: toStatus,
      reviewerNotes: parsed.reviewerNotes ?? null,
      reviewedBy: parsed.reviewerId,
      reviewedAt: now,
      updatedAt: now,
    };
    memoryClaims.set(parsed.claimId, updated);
    logDecision({
      claimId: parsed.claimId,
      artistId: mem.artistId,
      fromStatus: mem.status,
      toStatus,
      reviewerId: parsed.reviewerId,
      notes: parsed.reviewerNotes,
      at: now,
    });
    return updated;
  }
}

export async function getClaimHistory(options?: {
  artistId?: string;
  limit?: number;
}): Promise<ClaimRecord[]> {
  const limit = options?.limit ?? 50;

  try {
    const rows = await prisma.artistClaim.findMany({
      where: options?.artistId ? { artistId: options.artistId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { artist: true },
    });
    if (rows.length) {
      return rows.map((c) => ({
        id: c.id,
        artistId: c.artistId,
        userId: c.userId,
        status: c.status as ClaimState,
        evidenceUrl: c.evidenceUrl,
        evidenceNotes: c.evidenceNotes,
        reviewerNotes: c.reviewerNotes,
        reviewedBy: c.reviewedBy,
        reviewedAt: c.reviewedAt?.toISOString() ?? null,
        isDemo: c.isDemo,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        artistName: c.artist.displayName,
      }));
    }
  } catch {
    /* fall through */
  }

  let mem = [...memoryClaims.values()];
  if (options?.artistId) {
    mem = mem.filter((c) => c.artistId === options.artistId);
  }
  return mem
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}
