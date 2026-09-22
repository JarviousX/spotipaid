import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { z } from "zod";
import { config } from "@/lib/config";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  clearAuthFailures,
  getLockoutStatus,
  recordAuthFailure,
} from "@/lib/auth/lockout";
import {
  ROLE_PERMISSIONS,
  type AdminRole,
  type Permission,
} from "@/types/domain";

const SALT_ROUNDS = 12;

/** Dummy bcrypt hash used for constant-time compares when no real hash exists */
const DUMMY_HASH =
  "$2b$12$KjvhwOV/ooA5IHYQo9q1Xeoefc2bHaXZyn37xG4Fv6S1nbZOkaFAW";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_CREDENTIALS"
      | "INACTIVE"
      | "FORBIDDEN"
      | "RATE_LIMITED"
      | "INVALID_TOKEN"
      | "LOCKED" = "INVALID_CREDENTIALS",
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const passphraseSchema = z.object({
  passphrase: z.string().min(1).max(256),
});

export interface AdminSessionClaims extends JWTPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

function getJwtSecret(): Uint8Array {
  const secret = config.admin.jwtSecret;
  if (!secret || secret === "dev-only-change-me") {
    if (process.env.NODE_ENV === "production") {
      throw new AdminAuthError(
        "ADMIN_JWT_SECRET must be set in production",
        "FORBIDDEN",
      );
    }
  }
  return new TextEncoder().encode(secret);
}

/** Hash a passphrase for storage. Never send plaintext to the client. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function roleHasPermission(
  role: AdminRole,
  permission: Permission,
): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function assertPermission(
  role: AdminRole,
  permission: Permission,
): void {
  if (!roleHasPermission(role, permission)) {
    throw new AdminAuthError(
      `Role ${role} lacks permission ${permission}`,
      "FORBIDDEN",
    );
  }
}

export async function createAdminSessionToken(input: {
  adminId: string;
  email: string;
  role: AdminRole;
}): Promise<string> {
  const ttl = config.admin.sessionTtlSeconds;
  return new SignJWT({
    email: input.email,
    role: input.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.adminId)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getJwtSecret());
}

export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSessionClaims> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = payload.role as AdminRole | undefined;
    const email = payload.email as string | undefined;
    const sub = payload.sub;
    if (!sub || !email || !role) {
      throw new AdminAuthError("Invalid session token", "INVALID_TOKEN");
    }
    if (!ROLE_PERMISSIONS[role]) {
      throw new AdminAuthError("Invalid role in token", "INVALID_TOKEN");
    }
    return { ...payload, sub, email, role };
  } catch (err) {
    if (err instanceof AdminAuthError) throw err;
    throw new AdminAuthError("Invalid or expired session", "INVALID_TOKEN");
  }
}

/**
 * Authenticate admin with rate limiting.
 * Callers supply the looked-up user (hash never travels to the frontend).
 */
export async function authenticateAdmin(input: {
  email: string;
  password: string;
  passwordHash: string | null;
  role: AdminRole;
  adminId: string;
  isActive: boolean;
  ip?: string;
}): Promise<{ token: string; role: AdminRole }> {
  const parsed = credentialsSchema.safeParse({
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    throw new AdminAuthError("Invalid credentials", "INVALID_CREDENTIALS");
  }

  const rateKey = `admin-login:${(input.ip ?? "unknown").toLowerCase()}:${parsed.data.email.toLowerCase()}`;
  const limited = checkRateLimit(rateKey, { limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    throw new AdminAuthError(
      "Too many login attempts. Try again later.",
      "RATE_LIMITED",
    );
  }

  if (!input.isActive || !input.passwordHash) {
    await verifyPassword(parsed.data.password, DUMMY_HASH);
    throw new AdminAuthError("Invalid credentials", "INVALID_CREDENTIALS");
  }

  const ok = await verifyPassword(parsed.data.password, input.passwordHash);
  if (!ok) {
    throw new AdminAuthError("Invalid credentials", "INVALID_CREDENTIALS");
  }

  const token = await createAdminSessionToken({
    adminId: input.adminId,
    email: parsed.data.email,
    role: input.role,
  });

  return { token, role: input.role };
}

/**
 * Passphrase login against ADMIN_PASSPHRASE_HASH.
 * Never reveals whether the passphrase was “close” or if a hash is configured.
 */
export async function authenticateAdminPassphrase(input: {
  passphrase: string;
  ip?: string;
}): Promise<{ token: string; adminId: string; role: AdminRole }> {
  const parsed = passphraseSchema.safeParse({
    passphrase: input.passphrase,
  });
  if (!parsed.success) {
    throw new AdminAuthError("Authentication failed", "INVALID_CREDENTIALS");
  }

  const ip = (input.ip ?? "unknown").toLowerCase();
  const lockKey = `adm1n-pass:${ip}`;

  const lock = getLockoutStatus(lockKey);
  if (lock.locked) {
    throw new AdminAuthError(
      "Too many login attempts. Try again later.",
      "LOCKED",
    );
  }

  const rate = checkRateLimit(`adm1n-pass-rate:${ip}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    recordAuthFailure(lockKey);
    throw new AdminAuthError(
      "Too many login attempts. Try again later.",
      "RATE_LIMITED",
    );
  }

  const hash = config.admin.passphraseHash;
  let ok = false;
  if (hash) {
    ok = await verifyPassword(parsed.data.passphrase, hash);
  } else {
    await verifyPassword(parsed.data.passphrase, DUMMY_HASH);
    ok = false;
  }

  if (!ok) {
    recordAuthFailure(lockKey);
    throw new AdminAuthError("Authentication failed", "INVALID_CREDENTIALS");
  }

  clearAuthFailures(lockKey);

  const adminId = "adm1n-operator";
  const role: AdminRole = "SUPER_ADMIN";
  const token = await createAdminSessionToken({
    adminId,
    email: "operator@adm1n.local",
    role,
  });

  return { token, adminId, role };
}

export { ROLE_PERMISSIONS };
