import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Security headers + maintenance gate + admin cache control.
 * Auth for /adm1n pages is enforced in server layouts/APIs — path obscurity is not security.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const maintenance =
    request.cookies.get("sp_maint")?.value === "1";
  const isExempt =
    pathname.startsWith("/adm1n") ||
    pathname.startsWith("/api/adm1n") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/maintenance" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/protocol");

  if (maintenance && !isExempt && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  // Block public write APIs during maintenance (defense in depth; handlers also check)
  if (
    maintenance &&
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/adm1n") &&
    !pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/protocol")
  ) {
    return NextResponse.json(
      { error: "Service is under maintenance", code: "MAINTENANCE" },
      { status: 503 },
    );
  }

  const response = NextResponse.next();

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  if (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/adm1n") ||
    pathname.startsWith("/adm1n")
  ) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
