/**
 * Escalating login lockout / cooldown.
 * In-memory — replace with Redis for multi-instance production.
 */

export interface LockoutStatus {
  locked: boolean;
  retryAfterMs: number;
  failures: number;
}

interface LockoutEntry {
  failures: number;
  lockedUntil: number;
}

const entries = new Map<string, LockoutEntry>();
const MAX_KEYS = 20_000;

/** Escalating cooldowns after N failures within the failure window. */
const COOLDOWNS_MS: Array<{ afterFailures: number; cooldownMs: number }> = [
  { afterFailures: 5, cooldownMs: 30_000 },
  { afterFailures: 8, cooldownMs: 120_000 },
  { afterFailures: 12, cooldownMs: 900_000 },
  { afterFailures: 20, cooldownMs: 3_600_000 },
];

function prune(): void {
  if (entries.size <= MAX_KEYS) return;
  const overflow = entries.size - MAX_KEYS;
  const keys = entries.keys();
  for (let i = 0; i < overflow; i++) {
    const next = keys.next();
    if (next.done) break;
    entries.delete(next.value);
  }
}

function cooldownFor(failures: number): number {
  let ms = 0;
  for (const rule of COOLDOWNS_MS) {
    if (failures >= rule.afterFailures) ms = rule.cooldownMs;
  }
  return ms;
}

export function getLockoutStatus(key: string): LockoutStatus {
  const now = Date.now();
  const entry = entries.get(key);
  if (!entry) {
    return { locked: false, retryAfterMs: 0, failures: 0 };
  }
  if (entry.lockedUntil > now) {
    return {
      locked: true,
      retryAfterMs: entry.lockedUntil - now,
      failures: entry.failures,
    };
  }
  return { locked: false, retryAfterMs: 0, failures: entry.failures };
}

export function recordAuthFailure(key: string): LockoutStatus {
  const now = Date.now();
  const prev = entries.get(key);
  const failures = (prev?.failures ?? 0) + 1;
  const cooldownMs = cooldownFor(failures);
  const lockedUntil = cooldownMs > 0 ? now + cooldownMs : 0;
  entries.set(key, { failures, lockedUntil });
  prune();
  return {
    locked: lockedUntil > now,
    retryAfterMs: Math.max(0, lockedUntil - now),
    failures,
  };
}

export function clearAuthFailures(key: string): void {
  entries.delete(key);
}

/** Test helper */
export function resetLockouts(): void {
  entries.clear();
}
