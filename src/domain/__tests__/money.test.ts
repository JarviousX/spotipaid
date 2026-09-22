import { describe, expect, it } from "vitest";
import {
  add,
  subtract,
  multiply,
  splitAmount,
  parseMoney,
  formatUsd,
  formatCompact,
  MoneyError,
  compare,
  isZero,
} from "@/domain/money";

describe("money", () => {
  it("parses and adds without floating point drift", () => {
    expect(add("0.1", "0.2")).toBe("0.300000");
    expect(add("10.50", "0.25", "1.25")).toBe("12.000000");
  });

  it("subtracts and multiplies deterministically", () => {
    expect(subtract("100.00", "33.33")).toBe("66.670000");
    expect(multiply("12.5", "2")).toBe("25.000000");
  });

  it("splits 80/20 with remainder to protocol", () => {
    const split = splitAmount("100.000000", 8000, 2000);
    expect(split.artistAmount).toBe("80.000000");
    expect(split.protocolAmount).toBe("20.000000");
    expect(add(split.artistAmount, split.protocolAmount)).toBe(split.total);
  });

  it("assigns rounding remainder to protocol so parts sum to total", () => {
    const split = splitAmount("1.000000", 8000, 2000);
    expect(split.artistAmount).toBe("0.800000");
    expect(split.protocolAmount).toBe("0.200000");

    // Amount that does not divide evenly in 6dp artist share
    const odd = splitAmount("0.000001", 8000, 2000);
    expect(add(odd.artistAmount, odd.protocolAmount)).toBe(odd.total);
    expect(parseMoney(odd.artistAmount).plus(parseMoney(odd.protocolAmount)).toFixed(6)).toBe(
      "0.000001",
    );
  });

  it("rejects invalid bps and negative totals", () => {
    expect(() => splitAmount("10", 7000, 2000)).toThrow(MoneyError);
    expect(() => splitAmount("-1", 8000, 2000)).toThrow(MoneyError);
    expect(() => splitAmount("10", 8000.5, 2000)).toThrow(MoneyError);
  });

  it("formats USD and compact", () => {
    expect(formatUsd("1234.5")).toBe("$1,234.50");
    expect(formatUsd("-99.1")).toBe("-$99.10");
    expect(formatCompact("1500")).toBe("$1.50K");
    expect(formatCompact("2500000")).toBe("$2.50M");
    expect(formatCompact("1100000000")).toBe("$1.10B");
  });

  it("compare and isZero", () => {
    expect(compare("1.0", "1.00")).toBe(0);
    expect(compare("2", "1")).toBe(1);
    expect(isZero("0.000000")).toBe(true);
    expect(() => parseMoney("")).toThrow(MoneyError);
  });
});
