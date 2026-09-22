import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { validateSolanaAddress } from "@/domain/wallet";
import type { AdminSessionClaims } from "@/lib/auth/admin";
import { cookies } from "next/headers";

export const PROTOCOL_KEYS = {
  contractAddress: "protocol.contract_address",
  feeWallet: "protocol.fee_wallet",
  xAccount: "protocol.x_account",
  maintenance: "maintenance.mode",
} as const;

export const MAINTENANCE_COOKIE = "sp_maint";

export type ProtocolPublicConfig = {
  contractAddress: string | null;
  feeWallet: string | null;
  xAccount: string | null;
  xUrl: string | null;
  maintenance: boolean;
};

export type ProtocolAdminConfig = ProtocolPublicConfig & {
  updatedAt: Record<string, string | null>;
};

export class ProtocolConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolConfigError";
  }
}

const xHandleSchema = z
  .string()
  .trim()
  .min(1)
  .max(15)
  .regex(/^[A-Za-z0-9_]+$/, "Invalid X handle");

let maintenanceCache: { value: boolean; at: number } | null = null;
const CACHE_MS = 2_000;

async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.protocolSetting.findUnique({ where: { key } });
    if (row?.value) return row.value;
  } catch {
    /* fall through to env */
  }
  return envFallbackForProtocolKey(key);
}

async function getSettingMeta(
  key: string,
): Promise<{ value: string | null; updatedAt: string | null }> {
  try {
    const row = await prisma.protocolSetting.findUnique({ where: { key } });
    if (row?.value) {
      return {
        value: row.value,
        updatedAt: row.updatedAt?.toISOString() ?? null,
      };
    }
  } catch {
    /* fall through */
  }
  const fallback = envFallbackForProtocolKey(key);
  return { value: fallback, updatedAt: null };
}

function envFallbackForProtocolKey(key: string): string | null {
  const map: Record<string, string> = {
    [PROTOCOL_KEYS.contractAddress]: "PROTOCOL_CONTRACT_ADDRESS",
    [PROTOCOL_KEYS.feeWallet]: "PROTOCOL_FEE_WALLET",
    [PROTOCOL_KEYS.xAccount]: "PROTOCOL_X_ACCOUNT",
    [PROTOCOL_KEYS.maintenance]: "PROTOCOL_MAINTENANCE",
  };
  const envKey = map[key];
  if (!envKey) return null;
  const v = process.env[envKey]?.trim();
  return v && v.length > 0 ? v : null;
}

export function sanitizeXHandle(input: string): string {
  let v = input.trim();
  v = v.replace(/^@/, "");
  v = v.replace(/^https?:\/\/(www\.)?x\.com\//i, "");
  v = v.replace(/^https?:\/\/(www\.)?twitter\.com\//i, "");
  v = (v.split(/[/?#]/)[0] ?? "").trim();
  const parsed = xHandleSchema.safeParse(v);
  if (!parsed.success) {
    throw new ProtocolConfigError("Invalid X handle or profile URL");
  }
  return parsed.data;
}

export function xUrlFromHandle(handle: string | null): string | null {
  if (!handle) return null;
  return `https://x.com/${handle}`;
}

export async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.at < CACHE_MS) {
    return maintenanceCache.value;
  }
  const raw = await getSetting(PROTOCOL_KEYS.maintenance);
  const value = raw === "true" || raw === "1";
  maintenanceCache = { value, at: now };
  return value;
}

export function invalidateMaintenanceCache(): void {
  maintenanceCache = null;
}

/** Drop in-memory protocol caches so adm1n writes show on public pages immediately. */
export function invalidateProtocolCaches(): void {
  maintenanceCache = null;
}

/**
 * Canonical launch-fee destination: adm1n fee wallet (DB), then PROTOCOL_FEE_WALLET env.
 * Always call this at payment/verify time — never trust a client-supplied address.
 */
export async function requireLaunchFeeWallet(): Promise<string> {
  const { ensureDatabase } = await import("@/lib/db");
  await ensureDatabase();
  const fee = await getSetting(PROTOCOL_KEYS.feeWallet);
  if (!fee) {
    throw new ProtocolConfigError(
      "Fee wallet is not configured. Set it in /adm1n before launching.",
    );
  }
  return validateSolanaAddress(fee);
}

export async function getPublicProtocolConfig(): Promise<ProtocolPublicConfig> {
  const [ca, fee, x, maint] = await Promise.all([
    getSetting(PROTOCOL_KEYS.contractAddress),
    getSetting(PROTOCOL_KEYS.feeWallet),
    getSetting(PROTOCOL_KEYS.xAccount),
    isMaintenanceMode(),
  ]);
  const handle = x && /^[A-Za-z0-9_]{1,15}$/.test(x) ? x : null;
  return {
    contractAddress: ca && ca.length > 0 ? ca : null,
    feeWallet: fee && fee.length > 0 ? fee : null,
    xAccount: handle,
    xUrl: xUrlFromHandle(handle),
    maintenance: maint,
  };
}

export async function getAdminProtocolConfig(): Promise<ProtocolAdminConfig> {
  const [ca, fee, x, maint] = await Promise.all([
    getSettingMeta(PROTOCOL_KEYS.contractAddress),
    getSettingMeta(PROTOCOL_KEYS.feeWallet),
    getSettingMeta(PROTOCOL_KEYS.xAccount),
    getSettingMeta(PROTOCOL_KEYS.maintenance),
  ]);
  const handle =
    x.value && /^[A-Za-z0-9_]{1,15}$/.test(x.value) ? x.value : null;
  const maintenance = maint.value === "true" || maint.value === "1";
  maintenanceCache = { value: maintenance, at: Date.now() };
  return {
    contractAddress: ca.value && ca.value.length > 0 ? ca.value : null,
    feeWallet: fee.value && fee.value.length > 0 ? fee.value : null,
    xAccount: handle,
    xUrl: xUrlFromHandle(handle),
    maintenance,
    updatedAt: {
      contractAddress: ca.updatedAt,
      feeWallet: fee.updatedAt,
      xAccount: x.updatedAt,
      maintenance: maint.updatedAt,
    },
  };
}

async function upsertSetting(
  key: string,
  value: string,
  description?: string,
): Promise<void> {
  const { ensureDatabase } = await import("@/lib/db");
  await ensureDatabase();
  await prisma.protocolSetting.upsert({
    where: { key },
    create: { key, value, description },
    update: { value, ...(description ? { description } : {}) },
  });
}

async function setMaintenanceCookie(enabled: boolean): Promise<void> {
  const jar = await cookies();
  if (enabled) {
    jar.set(MAINTENANCE_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    jar.delete(MAINTENANCE_COOKIE);
  }
}

export async function updateContractAddress(input: {
  session: AdminSessionClaims;
  address: string;
  confirm: boolean;
  ip?: string;
}): Promise<ProtocolAdminConfig> {
  if (!input.confirm) {
    throw new ProtocolConfigError("Confirmation required to change CA");
  }
  const address = validateSolanaAddress(input.address);
  const prev = await getSetting(PROTOCOL_KEYS.contractAddress);
  await upsertSetting(
    PROTOCOL_KEYS.contractAddress,
    address,
    "Official protocol contract / token mint (CA)",
  );
  invalidateProtocolCaches();
  await writeAuditLog({
    action: "protocol.contract_address.update",
    entityType: "ProtocolSetting",
    entityId: PROTOCOL_KEYS.contractAddress,
    actorAdminId:
      input.session.sub === "adm1n-operator" ? undefined : input.session.sub,
    ipAddress: input.ip,
    metadata: {
      success: true,
      previous: prev,
      next: address,
      sessionId: input.session.sub,
      actor: input.session.email,
    },
  });
  return getAdminProtocolConfig();
}

export async function updateFeeWallet(input: {
  session: AdminSessionClaims;
  address: string;
  confirm: boolean;
  ip?: string;
}): Promise<ProtocolAdminConfig> {
  if (!input.confirm) {
    throw new ProtocolConfigError("Confirmation required to change fee wallet");
  }
  // Reject anything that looks like a private key / seed — validateSolanaAddress
  const address = validateSolanaAddress(input.address);
  const prev = await getSetting(PROTOCOL_KEYS.feeWallet);
  await upsertSetting(
    PROTOCOL_KEYS.feeWallet,
    address,
    "Public fee receiving wallet (never store private keys)",
  );
  // Keep treasury.address in sync for legacy settings UI
  await upsertSetting("treasury.address", address, "Fee / treasury wallet");
  invalidateProtocolCaches();
  await writeAuditLog({
    action: "protocol.fee_wallet.update",
    entityType: "ProtocolSetting",
    entityId: PROTOCOL_KEYS.feeWallet,
    actorAdminId:
      input.session.sub === "adm1n-operator" ? undefined : input.session.sub,
    ipAddress: input.ip,
    metadata: {
      success: true,
      previous: prev,
      next: address,
      sessionId: input.session.sub,
      actor: input.session.email,
    },
  });
  return getAdminProtocolConfig();
}

export async function updateXAccount(input: {
  session: AdminSessionClaims;
  handleOrUrl: string;
  ip?: string;
}): Promise<ProtocolAdminConfig> {
  const handle = sanitizeXHandle(input.handleOrUrl);
  const prev = await getSetting(PROTOCOL_KEYS.xAccount);
  await upsertSetting(
    PROTOCOL_KEYS.xAccount,
    handle,
    "Official X (Twitter) handle",
  );
  invalidateProtocolCaches();
  await writeAuditLog({
    action: "protocol.x_account.update",
    entityType: "ProtocolSetting",
    entityId: PROTOCOL_KEYS.xAccount,
    actorAdminId:
      input.session.sub === "adm1n-operator" ? undefined : input.session.sub,
    ipAddress: input.ip,
    metadata: {
      success: true,
      previous: prev,
      next: handle,
      sessionId: input.session.sub,
      actor: input.session.email,
    },
  });
  return getAdminProtocolConfig();
}

export async function updateMaintenanceMode(input: {
  session: AdminSessionClaims;
  enabled: boolean;
  confirm: boolean;
  ip?: string;
}): Promise<ProtocolAdminConfig> {
  if (!input.confirm) {
    throw new ProtocolConfigError(
      "Confirmation required to change maintenance state",
    );
  }
  const prev = await getSetting(PROTOCOL_KEYS.maintenance);
  const next = input.enabled ? "true" : "false";
  await upsertSetting(
    PROTOCOL_KEYS.maintenance,
    next,
    "Emergency maintenance freeze",
  );
  invalidateProtocolCaches();
  await setMaintenanceCookie(input.enabled);
  await writeAuditLog({
    action: "protocol.maintenance.update",
    entityType: "ProtocolSetting",
    entityId: PROTOCOL_KEYS.maintenance,
    actorAdminId:
      input.session.sub === "adm1n-operator" ? undefined : input.session.sub,
    ipAddress: input.ip,
    metadata: {
      success: true,
      previous: prev,
      next,
      sessionId: input.session.sub,
      actor: input.session.email,
    },
  });
  return getAdminProtocolConfig();
}

export class MaintenanceFreezeError extends Error {
  constructor(message = "Service is under maintenance") {
    super(message);
    this.name = "MaintenanceFreezeError";
  }
}

/** Server-side write gate — call from mutating public APIs */
export async function assertNotMaintenance(): Promise<void> {
  if (await isMaintenanceMode()) {
    throw new MaintenanceFreezeError();
  }
}
