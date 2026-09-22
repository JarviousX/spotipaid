import { cookies } from "next/headers";
import {
  assertPermission,
  createAdminSessionToken,
  verifyAdminSessionToken,
  type AdminSessionClaims,
} from "@/lib/auth/admin";
import type { Permission } from "@/types/domain";
import { config } from "@/lib/config";

export const ADMIN_SESSION_COOKIE = "sp_adm1n_session";
/** Legacy cookie name — cleared on logout for migration */
export const LEGACY_ADMIN_SESSION_COOKIE = "sp_admin_session";

export async function setAdminSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: config.admin.sessionTtlSeconds,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete(LEGACY_ADMIN_SESSION_COOKIE);
}

export async function getAdminSessionTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return (
    jar.get(ADMIN_SESSION_COOKIE)?.value ??
    jar.get(LEGACY_ADMIN_SESSION_COOKIE)?.value ??
    null
  );
}

export async function getAdminSession(): Promise<AdminSessionClaims | null> {
  const token = await getAdminSessionTokenFromCookies();
  if (!token) return null;
  try {
    return await verifyAdminSessionToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession(
  permission?: Permission,
): Promise<AdminSessionClaims> {
  const session = await getAdminSession();
  if (!session) {
    const { AdminAuthError } = await import("@/lib/auth/admin");
    throw new AdminAuthError("Admin session required", "INVALID_TOKEN");
  }
  if (permission) {
    assertPermission(session.role, permission);
  }
  return session;
}

export async function issueAdminSession(input: {
  adminId: string;
  email: string;
  role: AdminSessionClaims["role"];
}): Promise<string> {
  const token = await createAdminSessionToken(input);
  await setAdminSessionCookie(token);
  return token;
}
