import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { config } from "@/lib/config";

export const ADMIN_CSRF_COOKIE = "sp_adm1n_csrf";
export const CSRF_HEADER = "x-csrf-token";

function csrfSecret(): string {
  return config.admin.jwtSecret;
}

export function mintCsrfToken(): string {
  const nonce = randomBytes(24).toString("base64url");
  const sig = createHash("sha256")
    .update(`${nonce}.${csrfSecret()}`)
    .digest("base64url");
  return `${nonce}.${sig}`;
}

export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [nonce, sig] = parts;
  if (!nonce || !sig) return false;
  const expected = createHash("sha256")
    .update(`${nonce}.${csrfSecret()}`)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setCsrfCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: config.admin.sessionTtlSeconds,
  });
}

export async function clearCsrfCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_CSRF_COOKIE);
}

export async function getCsrfCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ADMIN_CSRF_COOKIE)?.value ?? null;
}

/**
 * Validate double-submit CSRF for mutating admin requests.
 * Also requires Origin/Referer to match the request host when present.
 */
export function assertCsrf(
  request: Request,
  cookieToken: string | null,
): void {
  const headerToken = request.headers.get(CSRF_HEADER);
  if (
    !cookieToken ||
    !headerToken ||
    !verifyCsrfToken(cookieToken) ||
    !verifyCsrfToken(headerToken) ||
    cookieToken !== headerToken
  ) {
    const err = new Error("Invalid CSRF token");
    err.name = "CsrfError";
    throw err;
  }

  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        const err = new Error("Invalid origin");
        err.name = "CsrfError";
        throw err;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "CsrfError") throw e;
      const err = new Error("Invalid origin");
      err.name = "CsrfError";
      throw err;
    }
  } else if (referer && host) {
    try {
      const refHost = new URL(referer).host;
      if (refHost !== host) {
        const err = new Error("Invalid referer");
        err.name = "CsrfError";
        throw err;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "CsrfError") throw e;
    }
  }
}
