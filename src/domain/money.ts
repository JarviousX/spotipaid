import Decimal from "decimal.js";
import type { BasisPoints, MoneySplit, MoneyString } from "@/types/domain";

/** Configure Decimal for financial math: no floating-point drift */
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 9,
});

const ZERO = new Decimal(0);
const BPS_DENOMINATOR = new Decimal(10_000);

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/**
 * Parse a money string into a Decimal. Rejects NaN, Infinity, and empty input.
 */
export function parseMoney(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) {
    if (!value.isFinite()) {
      throw new MoneyError("Money value must be finite");
    }
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new MoneyError("Money value must be finite");
    }
    return new Decimal(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new MoneyError("Money value cannot be empty");
  }

  try {
    const d = new Decimal(trimmed);
    if (!d.isFinite()) {
      throw new MoneyError("Money value must be finite");
    }
    return d;
  } catch (err) {
    if (err instanceof MoneyError) throw err;
    throw new MoneyError(`Invalid money value: ${value}`);
  }
}

export function toMoneyString(value: Decimal, decimals = 6): MoneyString {
  return value.toFixed(decimals);
}

export function add(...values: Array<string | number | Decimal>): MoneyString {
  const sum = values.reduce<Decimal>(
    (acc, v) => acc.plus(parseMoney(v)),
    ZERO,
  );
  return toMoneyString(sum);
}

export function subtract(
  minuend: string | number | Decimal,
  subtrahend: string | number | Decimal,
): MoneyString {
  return toMoneyString(parseMoney(minuend).minus(parseMoney(subtrahend)));
}

export function multiply(
  a: string | number | Decimal,
  b: string | number | Decimal,
): MoneyString {
  return toMoneyString(parseMoney(a).times(parseMoney(b)));
}

/**
 * Split a total amount by artist / protocol basis points.
 * Remainder from rounding goes to protocol so artist + protocol === total.
 * Both bps must be non-negative and sum to 10000.
 */
export function splitAmount(
  total: string | number | Decimal,
  artistBps: BasisPoints,
  protocolBps: BasisPoints,
): MoneySplit {
  if (!Number.isInteger(artistBps) || !Number.isInteger(protocolBps)) {
    throw new MoneyError("Basis points must be integers");
  }
  if (artistBps < 0 || protocolBps < 0) {
    throw new MoneyError("Basis points cannot be negative");
  }
  if (artistBps + protocolBps !== 10_000) {
    throw new MoneyError(
      `Basis points must sum to 10000 (got ${artistBps + protocolBps})`,
    );
  }

  const totalDec = parseMoney(total);
  if (totalDec.isNegative()) {
    throw new MoneyError("Total amount cannot be negative");
  }

  const artistAmount = totalDec
    .times(artistBps)
    .dividedBy(BPS_DENOMINATOR)
    .toDecimalPlaces(6, Decimal.ROUND_DOWN);

  const protocolAmount = totalDec.minus(artistAmount);

  return {
    artistAmount: toMoneyString(artistAmount),
    protocolAmount: toMoneyString(protocolAmount),
    total: toMoneyString(totalDec),
    artistBps,
    protocolBps,
  };
}

/**
 * Format as USD with $ and thousands separators.
 * @example formatUsd("1234.5") → "$1,234.50"
 */
export function formatUsd(
  value: string | number | Decimal,
  options?: { compact?: boolean; showSign?: boolean },
): string {
  if (options?.compact) {
    return formatCompact(value, { currency: true });
  }

  const d = parseMoney(value);
  const negative = d.isNegative();
  const abs = d.abs();
  const fixed = abs.toFixed(2);
  const [whole, frac = "00"] = fixed.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = negative ? "-" : options?.showSign && !d.isZero() ? "+" : "";
  return `${sign}$${withCommas}.${frac}`;
}

/**
 * Compact human-readable amount: $1.2K, $3.4M, $1.1B
 */
export function formatCompact(
  value: string | number | Decimal,
  options?: { currency?: boolean },
): string {
  const d = parseMoney(value);
  const negative = d.isNegative();
  const abs = d.abs();
  const prefix = options?.currency === false ? "" : "$";
  const sign = negative ? "-" : "";

  const thresholds: Array<{ min: Decimal; suffix: string; div: Decimal }> = [
    { min: new Decimal("1e9"), suffix: "B", div: new Decimal("1e9") },
    { min: new Decimal("1e6"), suffix: "M", div: new Decimal("1e6") },
    { min: new Decimal("1e3"), suffix: "K", div: new Decimal("1e3") },
  ];

  for (const t of thresholds) {
    if (abs.gte(t.min)) {
      const scaled = abs.dividedBy(t.div);
      const digits = scaled.gte(100) ? 0 : scaled.gte(10) ? 1 : 2;
      return `${sign}${prefix}${scaled.toFixed(digits)}${t.suffix}`;
    }
  }

  return `${sign}${prefix}${abs.toFixed(2)}`;
}

export function isZero(value: string | number | Decimal): boolean {
  return parseMoney(value).isZero();
}

export function compare(
  a: string | number | Decimal,
  b: string | number | Decimal,
): number {
  return parseMoney(a).comparedTo(parseMoney(b));
}

export { Decimal };
