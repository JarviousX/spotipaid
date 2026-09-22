import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import {
  authenticateAdmin,
  type AdminSessionClaims,
} from "@/lib/auth/admin";
import { issueAdminSession } from "@/lib/auth/session";
import type { AdminRole, TokenStatus } from "@/types/domain";
import { getProtocolFeeConfig } from "@/services/launch";
import { getClaimHistory, reviewClaim } from "@/services/claims";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const settingsPatchSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

const tokenPatchSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED", "HIDDEN", "MALICIOUS"]).optional(),
  discoveryDisabled: z.boolean().optional(),
  flaggedMaliciousMeta: z.boolean().optional(),
});

export async function adminLogin(input: {
  email: string;
  password: string;
  ip?: string;
}): Promise<{ email: string; role: AdminRole; adminId: string }> {
  const parsed = loginSchema.parse(input);

  let admin = await prisma.adminUser.findUnique({
    where: { email: parsed.email.toLowerCase() },
  });

  // Demo fallback when DB has no admin row yet — bootstrap env only (no hardcoded password)
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (
    !admin &&
    bootstrapEmail &&
    bootstrapPassword &&
    parsed.email.toLowerCase() === bootstrapEmail
  ) {
    const { hashPassword } = await import("@/lib/auth/admin");
    try {
      const hash = await hashPassword(bootstrapPassword);
      admin = await prisma.adminUser.create({
        data: {
          email: bootstrapEmail,
          passwordHash: hash,
          role: "SUPER_ADMIN",
          displayName: "Bootstrap Admin",
          isActive: true,
        },
      });
    } catch {
      /* ignore create race */
      admin = await prisma.adminUser.findUnique({
        where: { email: bootstrapEmail },
      });
    }
  }

  if (!admin) {
    const { AdminAuthError } = await import("@/lib/auth/admin");
    throw new AdminAuthError("Invalid credentials", "INVALID_CREDENTIALS");
  }

  const { token, role } = await authenticateAdmin({
    email: parsed.email,
    password: parsed.password,
    passwordHash: admin.passwordHash,
    role: admin.role as AdminRole,
    adminId: admin.id,
    isActive: admin.isActive,
    ip: input.ip,
  });

  await issueAdminSession({
    adminId: admin.id,
    email: admin.email,
    role,
  });

  try {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    /* ignore */
  }

  await writeAuditLog({
    action: "admin.login",
    entityType: "AdminUser",
    entityId: admin.id,
    actorAdminId: admin.id,
    ipAddress: input.ip,
  });

  void token;
  return { email: admin.email, role, adminId: admin.id };
}

export async function getPublicSafeSettings(): Promise<
  Record<string, string | number | boolean>
> {
  const fees = await getProtocolFeeConfig();
  const out: Record<string, string | number | boolean> = {
    "fee.artist_bps": fees.artistBps,
    "fee.protocol_bps": fees.protocolBps,
    demo_mode: true,
  };

  try {
    const rows = await prisma.protocolSetting.findMany();
    for (const row of rows) {
      // Never expose secret-looking keys
      if (/secret|password|token|key|private/i.test(row.key)) continue;
      out[row.key] = row.value;
    }
  } catch {
    /* defaults only */
  }

  return out;
}

export async function patchSettings(
  session: AdminSessionClaims,
  body: unknown,
): Promise<Record<string, string | number | boolean>> {
  const parsed = settingsPatchSchema.parse(body);

  for (const [key, value] of Object.entries(parsed.settings)) {
    if (/secret|password|token|private/i.test(key)) {
      continue;
    }
    await prisma.protocolSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    if (key === "fee.artist_bps" || key === "fee.protocol_bps") {
      const artist =
        key === "fee.artist_bps"
          ? Number.parseInt(value, 10)
          : Number.parseInt(
              parsed.settings["fee.artist_bps"] ??
                String((await getProtocolFeeConfig()).artistBps),
              10,
            );
      const protocol =
        key === "fee.protocol_bps"
          ? Number.parseInt(value, 10)
          : Number.parseInt(
              parsed.settings["fee.protocol_bps"] ??
                String((await getProtocolFeeConfig()).protocolBps),
              10,
            );
      if (
        Number.isFinite(artist) &&
        Number.isFinite(protocol) &&
        artist + protocol === 10_000
      ) {
        await prisma.feeConfig.upsert({
          where: { name: "default" },
          create: {
            name: "default",
            artistBps: artist,
            protocolBps: protocol,
            isDefault: true,
          },
          update: { artistBps: artist, protocolBps: protocol },
        });
      }
    }
  }

  await writeAuditLog({
    action: "settings.patch",
    entityType: "ProtocolSetting",
    actorAdminId: session.sub,
    metadata: { keys: Object.keys(parsed.settings) },
  });

  return getPublicSafeSettings();
}

export async function listAdminClaims(limit = 50) {
  return getClaimHistory({ limit });
}

export async function adminReviewClaim(
  session: AdminSessionClaims,
  claimId: string,
  body: unknown,
) {
  const schema = z.object({
    decision: z.enum(["approve", "reject", "review", "suspend"]),
    reviewerNotes: z.string().trim().max(2000).optional(),
  });
  const parsed = schema.parse(body);
  return reviewClaim({
    claimId,
    decision: parsed.decision,
    reviewerNotes: parsed.reviewerNotes,
    reviewerId: session.sub,
  });
}

export async function listAdminTokens(limit = 100) {
  try {
    return await prisma.token.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        mint: true,
        symbol: true,
        name: true,
        status: true,
        discoveryDisabled: true,
        flaggedMaliciousMeta: true,
        isDemo: true,
        createdAt: true,
        // never select secrets — none on token
      },
    });
  } catch {
    return [];
  }
}

export async function patchAdminToken(
  session: AdminSessionClaims,
  tokenId: string,
  body: unknown,
) {
  const parsed = tokenPatchSchema.parse(body);
  const updated = await prisma.token.update({
    where: { id: tokenId },
    data: {
      status: parsed.status as TokenStatus | undefined,
      discoveryDisabled: parsed.discoveryDisabled,
      flaggedMaliciousMeta: parsed.flaggedMaliciousMeta,
    },
    select: {
      id: true,
      mint: true,
      symbol: true,
      status: true,
      discoveryDisabled: true,
      flaggedMaliciousMeta: true,
      isDemo: true,
    },
  });

  await writeAuditLog({
    action: "token.moderate",
    entityType: "Token",
    entityId: tokenId,
    actorAdminId: session.sub,
    metadata: parsed,
  });

  return updated;
}

export async function listAdminPayments(limit = 100) {
  try {
    return await prisma.feeClaim.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        mint: true,
        grossAmount: true,
        artistAmount: true,
        protocolAmount: true,
        status: true,
        isDemo: true,
        createdAt: true,
        processedAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function retryAdminPayment(
  session: AdminSessionClaims,
  paymentId: string,
) {
  const claim = await prisma.feeClaim.findUnique({ where: { id: paymentId } });
  if (!claim) {
    throw new Error("Payment not found");
  }

  // Server recomputes — do not trust client amounts
  const fees = await getProtocolFeeConfig();
  const { splitAmount } = await import("@/domain/money");
  const split = splitAmount(claim.grossAmount, fees.artistBps, fees.protocolBps);

  const updated = await prisma.feeClaim.update({
    where: { id: paymentId },
    data: {
      status: "PROCESSED",
      artistBps: fees.artistBps,
      protocolBps: fees.protocolBps,
      artistAmount: split.artistAmount,
      protocolAmount: split.protocolAmount,
      processedAt: new Date(),
    },
    select: {
      id: true,
      mint: true,
      grossAmount: true,
      artistAmount: true,
      protocolAmount: true,
      status: true,
      isDemo: true,
    },
  });

  await writeAuditLog({
    action: "payment.retry",
    entityType: "FeeClaim",
    entityId: paymentId,
    actorAdminId: session.sub,
    metadata: {
      artistBps: fees.artistBps,
      protocolBps: fees.protocolBps,
    },
  });

  return updated;
}

export async function pauseAdminPayment(
  session: AdminSessionClaims,
  paymentId: string,
) {
  const claim = await prisma.feeClaim.findUnique({ where: { id: paymentId } });
  if (!claim) {
    throw new Error("Payment not found");
  }

  const updated = await prisma.feeClaim.update({
    where: { id: paymentId },
    data: {
      status: "PENDING",
      processedAt: null,
    },
    select: {
      id: true,
      mint: true,
      grossAmount: true,
      artistAmount: true,
      protocolAmount: true,
      status: true,
      isDemo: true,
    },
  });

  await writeAuditLog({
    action: "payment.pause",
    entityType: "FeeClaim",
    entityId: paymentId,
    actorAdminId: session.sub,
    metadata: { previousStatus: claim.status },
  });

  return updated;
}

export async function listAuditLogs(limit = 100) {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actorAdminId: true,
        actorUserId: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function listIntegrations(limit = 50) {
  try {
    return await prisma.integrationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        source: true,
        eventType: true,
        status: true,
        externalId: true,
        isDemo: true,
        createdAt: true,
        processedAt: true,
        errorMessage: true,
        // omit payload to avoid leaking secrets
      },
    });
  } catch {
    return [];
  }
}

export async function submitModerationReport(input: {
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  ip?: string;
}) {
  const schema = z.object({
    targetType: z.enum(["token", "artist", "music", "other"]),
    targetId: z.string().min(1).max(120),
    reason: z.string().trim().min(3).max(200),
    details: z.string().trim().max(2000).optional(),
  });
  const parsed = schema.parse(input);

  try {
    const event = await prisma.integrationEvent.create({
      data: {
        source: "moderation",
        eventType: "report.submitted",
        externalId: parsed.targetId,
        idempotencyKey: `report_${parsed.targetType}_${parsed.targetId}_${Date.now()}`,
        payload: JSON.stringify({
          ...parsed,
          // never store secrets from client
        }),
        status: "PENDING",
        isDemo: true,
      },
    });
    await writeAuditLog({
      action: "moderation.report",
      entityType: parsed.targetType,
      entityId: parsed.targetId,
      ipAddress: input.ip,
      metadata: { reason: parsed.reason, eventId: event.id },
    });
    return { id: event.id, status: "PENDING" as const, isDemo: true };
  } catch {
    const id = `report_mem_${Date.now()}`;
    await writeAuditLog({
      action: "moderation.report",
      entityType: parsed.targetType,
      entityId: parsed.targetId,
      ipAddress: input.ip,
      metadata: { reason: parsed.reason, offline: true },
    });
    return { id, status: "PENDING" as const, isDemo: true };
  }
}

export async function submitOptOut(input: {
  artistId?: string;
  email?: string;
  reason?: string;
  ip?: string;
}) {
  const schema = z.object({
    artistId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    reason: z.string().trim().max(1000).optional(),
  });
  const parsed = schema.parse(input);
  if (!parsed.artistId && !parsed.email) {
    throw new Error("artistId or email is required");
  }

  try {
    if (parsed.artistId) {
      const artist = await prisma.artist.findFirst({
        where: {
          OR: [{ id: parsed.artistId }, { slug: parsed.artistId }],
        },
      });
      if (artist) {
        await prisma.tokenArtistAllocation.updateMany({
          where: { artistId: artist.id },
          data: { isActive: false },
        });
        const tokenIds = (
          await prisma.tokenArtistAllocation.findMany({
            where: { artistId: artist.id },
            select: { tokenId: true },
          })
        ).map((t) => t.tokenId);
        if (tokenIds.length) {
          await prisma.token.updateMany({
            where: { id: { in: tokenIds } },
            data: { discoveryDisabled: true },
          });
        }
      }
    }

    const event = await prisma.integrationEvent.create({
      data: {
        source: "privacy",
        eventType: "opt_out.requested",
        idempotencyKey: `optout_${parsed.artistId ?? parsed.email}_${Date.now()}`,
        payload: JSON.stringify({
          artistId: parsed.artistId,
          // store email hash hint only in audit — omit raw if possible
          hasEmail: Boolean(parsed.email),
          reason: parsed.reason,
        }),
        status: "PENDING",
        isDemo: true,
      },
    });

    await writeAuditLog({
      action: "privacy.opt_out",
      entityType: "Artist",
      entityId: parsed.artistId,
      ipAddress: input.ip,
      metadata: { eventId: event.id, hasEmail: Boolean(parsed.email) },
    });

    return { id: event.id, status: "PENDING" as const, isDemo: true };
  } catch {
    return {
      id: `optout_mem_${Date.now()}`,
      status: "PENDING" as const,
      isDemo: true,
    };
  }
}
