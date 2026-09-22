import { createHmac, timingSafeEqual } from "node:crypto";

/** Default replay window for webhook timestamps (5 minutes). */
export const DEFAULT_WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

export class WebhookError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_SIGNATURE"
      | "STALE_TIMESTAMP"
      | "INVALID_TIMESTAMP" = "INVALID_SIGNATURE",
  ) {
    super(message);
    this.name = "WebhookError";
  }
}

function toTimestampSeconds(timestamp: string | number): number {
  const value =
    typeof timestamp === "number" ? timestamp : Number.parseInt(timestamp, 10);
  if (!Number.isFinite(value)) {
    throw new WebhookError("Invalid webhook timestamp", "INVALID_TIMESTAMP");
  }
  // Accept ms or seconds; treat large values as milliseconds.
  return value > 1_000_000_000_000 ? Math.floor(value / 1000) : value;
}

/** HMAC-SHA256 hex digest over `${timestamp}.${payload}` (Stripe-style). */
export function computeWebhookSignature(
  secret: string,
  payload: string,
  timestamp: string | number,
): string {
  const ts = toTimestampSeconds(timestamp);
  const signedPayload = `${ts}.${payload}`;
  return createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
}

/**
 * Timing-safe compare of provided signature against expected HMAC.
 * Accepts raw hex or `sha256=<hex>` / `v1=<hex>` prefixes.
 */
export function verifyWebhookSignature(input: {
  secret: string;
  payload: string;
  timestamp: string | number;
  signature: string;
}): boolean {
  const provided = normalizeSignature(input.signature);
  if (!provided) return false;

  const expected = computeWebhookSignature(
    input.secret,
    input.payload,
    input.timestamp,
  );

  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length === 0 || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function normalizeSignature(signature: string): string | null {
  const raw = signature.trim();
  if (!raw) return null;
  const stripped = raw.replace(/^(sha256|v1)=/i, "");
  if (!/^[0-9a-f]+$/i.test(stripped)) return null;
  return stripped.toLowerCase();
}

/** True when timestamp is within tolerance of now (replay protection). */
export function isTimestampFresh(
  timestamp: string | number,
  options?: { nowMs?: number; toleranceMs?: number },
): boolean {
  try {
    const tsSec = toTimestampSeconds(timestamp);
    const nowMs = options?.nowMs ?? Date.now();
    const toleranceMs =
      options?.toleranceMs ?? DEFAULT_WEBHOOK_TOLERANCE_MS;
    const ageMs = Math.abs(nowMs - tsSec * 1000);
    return ageMs <= toleranceMs;
  } catch {
    return false;
  }
}

/**
 * Rejects bad signatures and stale timestamps.
 * Call from webhook route handlers before processing the body.
 */
export function assertWebhookAuthentic(input: {
  secret: string;
  payload: string;
  timestamp: string | number;
  signature: string;
  nowMs?: number;
  toleranceMs?: number;
}): void {
  if (
    !isTimestampFresh(input.timestamp, {
      nowMs: input.nowMs,
      toleranceMs: input.toleranceMs,
    })
  ) {
    throw new WebhookError(
      "Webhook timestamp outside allowed tolerance",
      "STALE_TIMESTAMP",
    );
  }

  if (
    !verifyWebhookSignature({
      secret: input.secret,
      payload: input.payload,
      timestamp: input.timestamp,
      signature: input.signature,
    })
  ) {
    throw new WebhookError(
      "Webhook signature verification failed",
      "INVALID_SIGNATURE",
    );
  }
}
