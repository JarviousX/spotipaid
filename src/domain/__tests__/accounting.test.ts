import { beforeEach, describe, expect, it } from "vitest";
import {
  AccountingError,
  createAccountingStore,
  createPayout,
  getAvailableArtistBalance,
  processFeeClaim,
  resetAccountingStore,
} from "@/domain/accounting";
import { add } from "@/domain/money";

describe("accounting", () => {
  const store = createAccountingStore();

  beforeEach(() => {
    resetAccountingStore(store);
  });

  it("processes a fee claim into artist + protocol obligations", () => {
    const result = processFeeClaim(
      {
        idempotencyKey: "fee-1",
        mint: "MintABC",
        grossAmount: "100.000000",
        artistBps: 8000,
        protocolBps: 2000,
        artistId: "artist_1",
      },
      store,
    );

    expect(result.alreadyProcessed).toBe(false);
    expect(result.artistAmount).toBe("80.000000");
    expect(result.protocolAmount).toBe("20.000000");
    expect(result.artistBalanceId).toBeTruthy();
    expect(result.status).toBe("PROCESSED");
    expect(getAvailableArtistBalance("artist_1", store)).toBe("80.000000");
  });

  it("is idempotent on the same idempotency key", () => {
    const first = processFeeClaim(
      {
        idempotencyKey: "same-key",
        mint: "MintABC",
        grossAmount: "50.000000",
        artistBps: 8000,
        protocolBps: 2000,
        artistId: "artist_1",
      },
      store,
    );

    const second = processFeeClaim(
      {
        idempotencyKey: "same-key",
        mint: "MintABC",
        grossAmount: "999.000000",
        artistBps: 8000,
        protocolBps: 2000,
        artistId: "artist_1",
      },
      store,
    );

    expect(second.alreadyProcessed).toBe(true);
    expect(second.feeClaimId).toBe(first.feeClaimId);
    expect(second.grossAmount).toBe("50.000000");
    expect(getAvailableArtistBalance("artist_1", store)).toBe("40.000000");
    expect(store.feeClaims.size).toBe(1);
    expect(store.artistBalances.size).toBe(1);
  });

  it("creates a payout from obligations with duplicate prevention", () => {
    const a = processFeeClaim(
      {
        idempotencyKey: "fee-a",
        mint: "M1",
        grossAmount: "10.000000",
        artistBps: 8000,
        protocolBps: 2000,
        artistId: "artist_1",
      },
      store,
    );
    const b = processFeeClaim(
      {
        idempotencyKey: "fee-b",
        mint: "M1",
        grossAmount: "20.000000",
        artistBps: 8000,
        protocolBps: 2000,
        artistId: "artist_1",
      },
      store,
    );

    const payout = createPayout(
      {
        idempotencyKey: "payout-1",
        destinationAddr: "DestWallet111111111111111111111111111",
        artistBalanceIds: [a.artistBalanceId!, b.artistBalanceId!],
      },
      store,
    );

    expect(payout.alreadyExists).toBe(false);
    expect(payout.totalAmount).toBe(add("8.000000", "16.000000"));
    expect(payout.itemCount).toBe(2);
    expect(getAvailableArtistBalance("artist_1", store)).toBe("0.000000");

    const again = createPayout(
      {
        idempotencyKey: "payout-1",
        destinationAddr: "DestWallet111111111111111111111111111",
        artistBalanceIds: [a.artistBalanceId!],
      },
      store,
    );
    expect(again.alreadyExists).toBe(true);
    expect(again.payoutId).toBe(payout.payoutId);
  });

  it("rejects payout of already reserved balances", () => {
    const claim = processFeeClaim(
      {
        idempotencyKey: "fee-x",
        mint: "M1",
        grossAmount: "10.000000",
        artistBps: 8000,
        protocolBps: 2000,
        artistId: "artist_1",
      },
      store,
    );

    createPayout(
      {
        idempotencyKey: "payout-x",
        destinationAddr: "DestWallet111111111111111111111111111",
        artistBalanceIds: [claim.artistBalanceId!],
      },
      store,
    );

    expect(() =>
      createPayout(
        {
          idempotencyKey: "payout-y",
          destinationAddr: "DestWallet111111111111111111111111111",
          artistBalanceIds: [claim.artistBalanceId!],
        },
        store,
      ),
    ).toThrow(AccountingError);
  });

  it("requires idempotency key and mint", () => {
    expect(() =>
      processFeeClaim(
        {
          idempotencyKey: "",
          mint: "M",
          grossAmount: "1",
          artistBps: 8000,
          protocolBps: 2000,
        },
        store,
      ),
    ).toThrow(AccountingError);
  });
});
