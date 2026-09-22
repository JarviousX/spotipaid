import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, type RateLimitOptions } from "@/lib/rate-limit";
import { AdminAuthError } from "@/lib/auth/admin";

export type ApiErrorBody = {
  error: string;
  code?: string;
  details?: unknown;
};

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 201, ...init });
}

export function jsonError(
  status: number,
  error: string,
  options?: { code?: string; details?: unknown; headers?: HeadersInit },
): NextResponse {
  const body: ApiErrorBody = { error };
  if (options?.code) body.code = options.code;
  if (options?.details !== undefined) body.details = options.details;
  return NextResponse.json(body, {
    status,
    headers: options?.headers,
  });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function enforceRateLimit(
  request: Request,
  bucket: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60_000 },
): NextResponse | null {
  const key = `${bucket}:${clientIp(request)}`;
  const result = checkRateLimit(key, options);
  if (result.allowed) return null;
  return jsonError(429, "Too many requests. Try again later.", {
    code: "RATE_LIMITED",
    headers: {
      "Retry-After": String(
        Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
      ),
    },
  });
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof AdminAuthError) {
    const status =
      err.code === "RATE_LIMITED" || err.code === "LOCKED"
        ? 429
        : err.code === "FORBIDDEN"
          ? 403
          : err.code === "INVALID_TOKEN"
            ? 401
            : 401;
    return jsonError(status, err.message, { code: err.code });
  }
  if (err instanceof ZodError) {
    return jsonError(400, "Validation failed", {
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    });
  }
  if (err instanceof Error) {
    const name = err.name;
    if (name === "CsrfError") {
      return jsonError(403, "Request rejected", { code: "CSRF" });
    }
    if (name === "MaintenanceFreezeError") {
      return jsonError(503, err.message, { code: "MAINTENANCE" });
    }
    if (name === "ProtocolConfigError") {
      return jsonError(400, err.message, { code: "PROTOCOL_CONFIG" });
    }
    if (
      name === "ClaimError" ||
      name === "MoneyError" ||
      name === "AccountingError" ||
      name === "WalletError" ||
      name === "SpotifyUrlError" ||
      name === "LaunchError"
    ) {
      return jsonError(400, err.message, { code: name });
    }
    console.error("[api]", err);
    return jsonError(500, "Internal server error", { code: "INTERNAL" });
  }
  console.error("[api] unknown error", err);
  return jsonError(500, "Internal server error", { code: "INTERNAL" });
}
