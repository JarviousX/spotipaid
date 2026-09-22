import {
  add,
  parseMoney,
  splitAmount,
  toMoneyString,
} from "@/domain/money";
import type {
  CreatePayoutInput,
  FeeClaimInput,
  FeeClaimResult,
  PayoutResult,
} from "@/types/domain";

export class AccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountingError";
  }
}

/** In-memory ledger used when no Prisma client is injected (tests / pure domain). */
export interface FeeClaimRecord {
  id: string;
  idempotencyKey: string;
  mint: string;
  grossAmount: string;
  artistBps: number;
  protocolBps: number;
  artistAmount: string;
  protocolAmount: string;
  status: "PENDING" | "PROCESSED" | "FAILED" | "REVERSED";
  artistId: string | null;
  tokenId: string | null;
  sourceTxSig: string | null;
  processedAt: Date | null;
  isDemo: boolean;
  createdAt: Date;
}

export interface ArtistBalanceRecord {
  id: string;
  artistId: string;
  feeClaimId: string;
  amount: string;
  status: "AVAILABLE" | "RESERVED" | "PAID" | "REVERSED";
  currency: string;
  payoutItemId: string | null;
  isDemo: boolean;
  createdAt: Date;
}

export interface ProtocolBalanceRecord {
  id: string;
  feeClaimId: string;
  amount: string;
  status: "AVAILABLE" | "RESERVED" | "SWEPT" | "REVERSED";
  currency: string;
  isDemo: boolean;
  createdAt: Date;
}

export interface PayoutRecord {
  id: string;
  idempotencyKey: string;
  destinationAddr: string;
  walletId: string | null;
  chain: string;
  totalAmount: string;
  currency: string;
  status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED" | "CANCELLED";
  isDemo: boolean;
  createdAt: Date;
  items: PayoutItemRecord[];
}

export interface PayoutItemRecord {
  id: string;
  payoutId: string;
  artistId: string | null;
  feeClaimId: string | null;
  artistBalanceId: string;
  amount: string;
}

export interface AccountingStore {
  feeClaims: Map<string, FeeClaimRecord>;
  artistBalances: Map<string, ArtistBalanceRecord>;
  protocolBalances: Map<string, ProtocolBalanceRecord>;
  payouts: Map<string, PayoutRecord>;
  /** Secondary index: feeClaimId+artistId → balance id */
  artistBalanceByClaim: Map<string, string>;
}

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}_${Date.now().toString(36)}`;
}

export function createAccountingStore(): AccountingStore {
  return {
    feeClaims: new Map(),
    artistBalances: new Map(),
    protocolBalances: new Map(),
    payouts: new Map(),
    artistBalanceByClaim: new Map(),
  };
}

/** Module-level default store for simple callers / demos */
const defaultStore = createAccountingStore();

export function resetAccountingStore(store: AccountingStore = defaultStore): void {
  store.feeClaims.clear();
  store.artistBalances.clear();
  store.protocolBalances.clear();
  store.payouts.clear();
  store.artistBalanceByClaim.clear();
}

/**
 * Idempotent fee claim processing.
 * Same idempotencyKey always returns the original result — never double-credits.
 */
export function processFeeClaim(
  input: FeeClaimInput,
  store: AccountingStore = defaultStore,
): FeeClaimResult {
  const key = input.idempotencyKey?.trim();
  if (!key) {
    throw new AccountingError("idempotencyKey is required");
  }
  if (!input.mint?.trim()) {
    throw new AccountingError("mint is required");
  }

  const existing = store.feeClaims.get(key);
  if (existing) {
    const artistBalId =
      existing.artistId != null
        ? store.artistBalanceByClaim.get(`${existing.id}:${existing.artistId}`) ??
          null
        : null;
    const protocolBal = [...store.protocolBalances.values()].find(
      (b) => b.feeClaimId === existing.id,
    );

    return {
      feeClaimId: existing.id,
      idempotencyKey: existing.idempotencyKey,
      mint: existing.mint,
      grossAmount: existing.grossAmount,
      artistAmount: existing.artistAmount,
      protocolAmount: existing.protocolAmount,
      artistBalanceId: artistBalId,
      protocolBalanceId: protocolBal?.id ?? "",
      alreadyProcessed: true,
      status: existing.status,
    };
  }

  const split = splitAmount(
    input.grossAmount,
    input.artistBps,
    input.protocolBps,
  );

  const feeClaimId = nextId("fc");
  const now = new Date();

  const claim: FeeClaimRecord = {
    id: feeClaimId,
    idempotencyKey: key,
    mint: input.mint.trim(),
    grossAmount: split.total,
    artistBps: input.artistBps,
    protocolBps: input.protocolBps,
    artistAmount: split.artistAmount,
    protocolAmount: split.protocolAmount,
    status: "PROCESSED",
    artistId: input.artistId ?? null,
    tokenId: input.tokenId ?? null,
    sourceTxSig: input.sourceTxSig ?? null,
    processedAt: now,
    isDemo: input.isDemo ?? false,
    createdAt: now,
  };
  store.feeClaims.set(key, claim);

  let artistBalanceId: string | null = null;
  if (input.artistId && parseMoney(split.artistAmount).gt(0)) {
    artistBalanceId = nextId("ab");
    const balance: ArtistBalanceRecord = {
      id: artistBalanceId,
      artistId: input.artistId,
      feeClaimId,
      amount: split.artistAmount,
      status: "AVAILABLE",
      currency: "USDC",
      payoutItemId: null,
      isDemo: input.isDemo ?? false,
      createdAt: now,
    };
    store.artistBalances.set(artistBalanceId, balance);
    store.artistBalanceByClaim.set(`${feeClaimId}:${input.artistId}`, artistBalanceId);
  }

  const protocolBalanceId = nextId("pb");
  const protocolBalance: ProtocolBalanceRecord = {
    id: protocolBalanceId,
    feeClaimId,
    amount: split.protocolAmount,
    status: "AVAILABLE",
    currency: "USDC",
    isDemo: input.isDemo ?? false,
    createdAt: now,
  };
  store.protocolBalances.set(protocolBalanceId, protocolBalance);

  return {
    feeClaimId,
    idempotencyKey: key,
    mint: claim.mint,
    grossAmount: claim.grossAmount,
    artistAmount: claim.artistAmount,
    protocolAmount: claim.protocolAmount,
    artistBalanceId,
    protocolBalanceId,
    alreadyProcessed: false,
    status: "PROCESSED",
  };
}

/**
 * Create a payout from available artist obligations.
 * Duplicate prevention via idempotencyKey.
 * Marks included balances as RESERVED.
 */
export function createPayout(
  input: CreatePayoutInput,
  store: AccountingStore = defaultStore,
): PayoutResult {
  const key = input.idempotencyKey?.trim();
  if (!key) {
    throw new AccountingError("idempotencyKey is required");
  }
  if (!input.destinationAddr?.trim()) {
    throw new AccountingError("destinationAddr is required");
  }
  if (!input.artistBalanceIds?.length) {
    throw new AccountingError("artistBalanceIds must be non-empty");
  }

  const existing = store.payouts.get(key);
  if (existing) {
    return {
      payoutId: existing.id,
      idempotencyKey: existing.idempotencyKey,
      totalAmount: existing.totalAmount,
      status: existing.status,
      itemCount: existing.items.length,
      alreadyExists: true,
    };
  }

  const balances: ArtistBalanceRecord[] = [];
  for (const balanceId of input.artistBalanceIds) {
    const bal = store.artistBalances.get(balanceId);
    if (!bal) {
      throw new AccountingError(`Artist balance not found: ${balanceId}`);
    }
    if (bal.status !== "AVAILABLE") {
      throw new AccountingError(
        `Artist balance ${balanceId} is not AVAILABLE (status=${bal.status})`,
      );
    }
    // Prevent the same obligation from appearing twice in one payout
    if (balances.some((b) => b.id === bal.id)) {
      throw new AccountingError(`Duplicate artist balance in payout: ${balanceId}`);
    }
    balances.push(bal);
  }

  // Also prevent any of these balances from already being on another payout
  for (const payout of store.payouts.values()) {
    for (const item of payout.items) {
      if (balances.some((b) => b.id === item.artistBalanceId)) {
        throw new AccountingError(
          `Artist balance ${item.artistBalanceId} already included in payout ${payout.id}`,
        );
      }
    }
  }

  const total = balances.reduce(
    (acc, b) => add(acc, b.amount),
    toMoneyString(parseMoney("0")),
  );

  const payoutId = nextId("po");
  const now = new Date();
  const items: PayoutItemRecord[] = balances.map((b) => {
    const itemId = nextId("pi");
    return {
      id: itemId,
      payoutId,
      artistId: b.artistId,
      feeClaimId: b.feeClaimId,
      artistBalanceId: b.id,
      amount: b.amount,
    };
  });

  const payout: PayoutRecord = {
    id: payoutId,
    idempotencyKey: key,
    destinationAddr: input.destinationAddr.trim(),
    walletId: input.walletId ?? null,
    chain: input.chain ?? "solana",
    totalAmount: total,
    currency: input.currency ?? "USDC",
    status: "PENDING",
    isDemo: input.isDemo ?? false,
    createdAt: now,
    items,
  };

  store.payouts.set(key, payout);

  for (const b of balances) {
    b.status = "RESERVED";
    const item = items.find((i) => i.artistBalanceId === b.id);
    b.payoutItemId = item?.id ?? null;
  }

  return {
    payoutId,
    idempotencyKey: key,
    totalAmount: total,
    status: "PENDING",
    itemCount: items.length,
    alreadyExists: false,
  };
}

export function getAvailableArtistBalance(
  artistId: string,
  store: AccountingStore = defaultStore,
): string {
  let total = parseMoney("0");
  for (const bal of store.artistBalances.values()) {
    if (bal.artistId === artistId && bal.status === "AVAILABLE") {
      total = total.plus(parseMoney(bal.amount));
    }
  }
  return toMoneyString(total);
}
