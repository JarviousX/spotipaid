import { describe, expect, it } from "vitest";
import {
  isValidSolanaAddress,
  looksLikeSeedPhrase,
  validateSolanaAddress,
  WalletError,
} from "@/domain/wallet";

describe("wallet", () => {
  // Well-known System Program id (valid base58, 32 bytes encoded)
  const SYSTEM_PROGRAM = "11111111111111111111111111111111";
  const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

  it("accepts valid Solana base58 addresses", () => {
    expect(validateSolanaAddress(SYSTEM_PROGRAM)).toBe(SYSTEM_PROGRAM);
    expect(validateSolanaAddress(TOKEN_PROGRAM)).toBe(TOKEN_PROGRAM);
    expect(isValidSolanaAddress(TOKEN_PROGRAM)).toBe(true);
  });

  it("rejects invalid length and charset", () => {
    expect(() => validateSolanaAddress("short")).toThrow(WalletError);
    expect(() =>
      validateSolanaAddress("0OIl" + "1".repeat(40)),
    ).toThrow(WalletError);
    expect(() => validateSolanaAddress("")).toThrow(WalletError);
    expect(() =>
      validateSolanaAddress("addr with spaces111111111111111111"),
    ).toThrow(WalletError);
  });

  it("detects and rejects seed phrases", () => {
    const phrase =
      "abandon ability able about above absent absorb abstract absurd abuse access accident";
    expect(looksLikeSeedPhrase(phrase)).toBe(true);
    expect(() => validateSolanaAddress(phrase)).toThrow(/Seed phrases/);
  });

  it("does not false-positive short word lists", () => {
    expect(looksLikeSeedPhrase("abandon ability able")).toBe(false);
  });
});
