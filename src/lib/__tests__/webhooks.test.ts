import { describe, expect, it } from "vitest";
import {
  assertWebhookAuthentic,
  computeWebhookSignature,
  DEFAULT_WEBHOOK_TOLERANCE_MS,
  isTimestampFresh,
  verifyWebhookSignature,
  WebhookError,
} from "@/lib/webhooks";

const SECRET = "whsec_test_secret";
const PAYLOAD = JSON.stringify({ event: "token.created", id: "tok_1" });

describe("webhooks", () => {
  it("accepts a valid HMAC signature", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeWebhookSignature(SECRET, PAYLOAD, timestamp);

    expect(
      verifyWebhookSignature({
        secret: SECRET,
        payload: PAYLOAD,
        timestamp,
        signature,
      }),
    ).toBe(true);

    expect(
      verifyWebhookSignature({
        secret: SECRET,
        payload: PAYLOAD,
        timestamp,
        signature: `sha256=${signature}`,
      }),
    ).toBe(true);
  });

  it("rejects a bad or tampered signature", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeWebhookSignature(SECRET, PAYLOAD, timestamp);

    expect(
      verifyWebhookSignature({
        secret: SECRET,
        payload: PAYLOAD,
        timestamp,
        signature: "0".repeat(signature.length),
      }),
    ).toBe(false);

    expect(
      verifyWebhookSignature({
        secret: SECRET,
        payload: PAYLOAD + " ",
        timestamp,
        signature,
      }),
    ).toBe(false);

    expect(
      verifyWebhookSignature({
        secret: "other-secret",
        payload: PAYLOAD,
        timestamp,
        signature,
      }),
    ).toBe(false);
  });

  it("rejects stale timestamps outside the replay window", () => {
    const nowMs = Date.parse("2026-09-19T18:00:00.000Z");
    const freshSec = Math.floor(nowMs / 1000);
    const staleSec =
      freshSec - Math.floor(DEFAULT_WEBHOOK_TOLERANCE_MS / 1000) - 30;

    expect(isTimestampFresh(freshSec, { nowMs })).toBe(true);
    expect(isTimestampFresh(staleSec, { nowMs })).toBe(false);
  });

  it("assertWebhookAuthentic rejects bad signatures and stale timestamps", () => {
    const nowMs = Date.parse("2026-09-19T18:00:00.000Z");
    const timestamp = Math.floor(nowMs / 1000);
    const signature = computeWebhookSignature(SECRET, PAYLOAD, timestamp);

    expect(() =>
      assertWebhookAuthentic({
        secret: SECRET,
        payload: PAYLOAD,
        timestamp,
        signature,
        nowMs,
      }),
    ).not.toThrow();

    expect(() =>
      assertWebhookAuthentic({
        secret: SECRET,
        payload: PAYLOAD,
        timestamp,
        signature: "deadbeef",
        nowMs,
      }),
    ).toThrow(WebhookError);

    try {
      assertWebhookAuthentic({
        secret: SECRET,
        payload: PAYLOAD,
        timestamp: timestamp - 600,
        signature: computeWebhookSignature(SECRET, PAYLOAD, timestamp - 600),
        nowMs,
      });
      expect.unreachable("expected stale timestamp to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(WebhookError);
      expect((err as WebhookError).code).toBe("STALE_TIMESTAMP");
    }
  });
});
