/**
 * Prisma seed — loads demo artists, music, tokens, fees, trades, and settings.
 * Run: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { add, multiply, parseMoney, toMoneyString } from "../src/domain/money";
import { hashPassword } from "../src/lib/auth/admin";
import {
  DEMO_ARTISTS,
  DEMO_PAYMENTS,
  DEMO_TOKENS,
  DEMO_TRADES,
  DEMO_PROTOCOL_STATS,
  SPOTIFY_ID_BY_ARTIST_ID,
} from "../src/data/demo-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SpotiPaid catalog (top Spotify artists)…");

  // Clean demo rows (order respects FKs)
  await prisma.payoutItem.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.artistBalance.deleteMany({});
  await prisma.protocolBalance.deleteMany({});
  await prisma.feeClaim.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.tokenArtistAllocation.deleteMany({});
  await prisma.token.deleteMany({});
  await prisma.musicItemArtist.deleteMany({});
  await prisma.providerIdentifier.deleteMany({});
  await prisma.musicItem.deleteMany({});
  await prisma.artistClaim.deleteMany({});
  await prisma.artist.deleteMany({});
  await prisma.feeConfig.deleteMany({});
  await prisma.protocolSetting.deleteMany({});
  await prisma.integrationEvent.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.user.deleteMany({ where: { isDemo: true } });
  // Admin recreated later from ADMIN_BOOTSTRAP_* env
  await prisma.adminUser.deleteMany({});

  await prisma.feeConfig.create({
    data: {
      name: "default",
      artistBps: 8000,
      protocolBps: 2000,
      isDefault: true,
      isDemo: true,
    },
  });

  await prisma.protocolSetting.createMany({
    data: [
      {
        key: "fee.artist_bps",
        value: "8000",
        description: "Default artist share of gross fees (bps)",
      },
      {
        key: "fee.protocol_bps",
        value: "2000",
        description: "Default protocol share of gross fees (bps)",
      },
      {
        key: "payout.min_claim_usd",
        value: "1.00",
        description: "Minimum fee claim amount before settlement",
      },
      {
        key: "payout.min_payout_usd",
        value: "5.00",
        description: "Minimum artist payout batch size",
      },
      {
        key: "treasury.address",
        value: "SpotiPaidDemoTreasury1111111111111111111",
        description: "Protocol treasury address (demo)",
      },
      {
        key: "chains.enabled",
        value: "solana",
        description: "Comma-separated enabled chains",
      },
      {
        key: "launchpads.enabled",
        value: "pumpfun,demo",
        description: "Comma-separated launchpad sources",
      },
      {
        key: "maintenance.mode",
        value: "false",
        description: "Emergency maintenance freeze (enforced server-side)",
      },
      {
        key: "protocol.contract_address",
        value: "",
        description: "Official protocol contract / CA",
      },
      {
        key: "protocol.fee_wallet",
        value: "SpotiPaidDemoTreasury1111111111111111111",
        description: "Public fee receiving wallet",
      },
      {
        key: "protocol.x_account",
        value: "",
        description: "Official X handle (without @)",
      },
      {
        key: "demo_mode",
        value: "true",
        description: "Demo dataset active",
      },
      {
        key: "stats.snapshot",
        value: JSON.stringify(DEMO_PROTOCOL_STATS),
        description: "Cached demo protocol stats",
      },
    ],
  });

  for (const a of DEMO_ARTISTS) {
    const artist = await prisma.artist.create({
      data: {
        id: a.id,
        displayName: a.displayName,
        slug: a.slug,
        imageUrl: a.imageUrl,
        claimState: a.claimState,
        verifiedAt: a.claimState === "VERIFIED" ? new Date() : null,
        isDemo: true,
      },
    });

    await prisma.providerIdentifier.create({
      data: {
        provider: "SPOTIFY",
        entityType: "artist",
        externalId: SPOTIFY_ID_BY_ARTIST_ID[a.id] ?? a.slug,
        artistId: artist.id,
        isDemo: true,
      },
    });

    if (a.claimState !== "UNCLAIMED") {
      await prisma.artistClaim.create({
        data: {
          artistId: artist.id,
          status:
            a.claimState === "VERIFIED"
              ? "VERIFIED"
              : a.claimState === "UNDER_REVIEW"
                ? "UNDER_REVIEW"
                : "CLAIM_SUBMITTED",
          evidenceNotes: "[DEMO] Seeded claim evidence",
          isDemo: true,
          reviewedAt: a.claimState === "VERIFIED" ? new Date() : null,
        },
      });
    }
  }

  const tokenIdByDemoId = new Map<string, string>();
  const mintByDemoId = new Map<string, string>();

  for (const t of DEMO_TOKENS) {
    const mint = t.mint;
    mintByDemoId.set(t.id, mint);

    const musicItem = await prisma.musicItem.create({
      data: {
        type: "ARTIST",
        title: t.musicTitle,
        imageUrl: t.imageUrl,
        isDemo: true,
        discoveryDisabled: t.discoveryDisabled,
      },
    });

    const spotifyArtistId =
      SPOTIFY_ID_BY_ARTIST_ID[
        DEMO_ARTISTS.find((a) => a.displayName === t.artistNames[0])?.id ?? ""
      ];

    if (spotifyArtistId) {
      await prisma.providerIdentifier.create({
        data: {
          provider: "SPOTIFY",
          entityType: "artist",
          externalId: `${spotifyArtistId}:music`,
          musicItemId: musicItem.id,
          isDemo: true,
        },
      });
    }

    // Link artists by name
    let position = 0;
    for (const name of t.artistNames) {
      const artist = DEMO_ARTISTS.find((a) => a.displayName === name);
      if (!artist) continue;
      await prisma.musicItemArtist.create({
        data: {
          musicItemId: musicItem.id,
          artistId: artist.id,
          role: position === 0 ? "PRIMARY" : "FEATURED",
          shareBps:
            t.artistNames.length === 1
              ? 10_000
              : position === 0
                ? 6000
                : 4000,
          position,
        },
      });
      position += 1;
    }

    const token = await prisma.token.create({
      data: {
        id: t.id,
        mint,
        symbol: t.symbol,
        name: t.name,
        imageUrl: t.imageUrl,
        musicItemId: musicItem.id,
        attributionVersion: t.attributionVersion,
        status: t.discoveryDisabled ? "DISABLED" : "ACTIVE",
        discoveryDisabled: t.discoveryDisabled,
        launchpadSlug: "pumpfun",
        isDemo: true,
      },
    });
    tokenIdByDemoId.set(t.id, token.id);

    position = 0;
    for (const name of t.artistNames) {
      const artist = DEMO_ARTISTS.find((a) => a.displayName === name);
      if (!artist) continue;
      await prisma.tokenArtistAllocation.create({
        data: {
          tokenId: token.id,
          artistId: artist.id,
          shareBps:
            t.artistNames.length === 1
              ? 10_000
              : position === 0
                ? 6000
                : 4000,
          attributionVersion: t.attributionVersion,
          isActive: true,
        },
      });
      position += 1;
    }
  }

  // Fee claims + balances from demo payments
  for (const pay of DEMO_PAYMENTS) {
    const token = DEMO_TOKENS.find((t) => t.symbol === pay.symbol);
    const artist = DEMO_ARTISTS.find((a) => a.displayName === pay.artistName);
    if (!token || !artist) continue;

    const mint = mintByDemoId.get(token.id) ?? token.mint;
    const artistAmount = pay.amount;
    // Demo payments are artist share; protocol = 25% of artist (= 20% of gross at 80/20)
    const protocolAmount = multiply(artistAmount, "0.25");
    const grossAmount = add(artistAmount, protocolAmount);

    const claim = await prisma.feeClaim.create({
      data: {
        idempotencyKey: `demo-fee-${pay.id}`,
        tokenId: token.id,
        mint,
        grossAmount,
        artistBps: 8000,
        protocolBps: 2000,
        artistAmount,
        protocolAmount,
        status: "PROCESSED",
        processedAt: new Date(pay.timestamp),
        isDemo: true,
      },
    });

    await prisma.artistBalance.create({
      data: {
        artistId: artist.id,
        feeClaimId: claim.id,
        amount: artistAmount,
        status: "AVAILABLE",
        isDemo: true,
      },
    });

    await prisma.protocolBalance.create({
      data: {
        feeClaimId: claim.id,
        amount: protocolAmount,
        status: "AVAILABLE",
        isDemo: true,
      },
    });
  }

  for (const trade of DEMO_TRADES) {
    const token = DEMO_TOKENS.find((t) => t.symbol === trade.symbol);
    if (!token) continue;
    const mint = mintByDemoId.get(token.id) ?? token.mint;
    await prisma.trade.create({
      data: {
        id: trade.id,
        tokenId: token.id,
        mint,
        side: trade.side,
        priceUsd: trade.priceUsd,
        amountToken: toMoneyString(
          parseMoney(trade.amountUsd).dividedBy(parseMoney(trade.priceUsd)),
        ),
        amountUsd: trade.amountUsd,
        txSignature: `demo-tx-${trade.id}`,
        tradedAt: new Date(trade.timestamp),
        isDemo: true,
      },
    });
  }

  const bootstrapEmail = (
    process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@spotipaid.demo"
  )
    .trim()
    .toLowerCase();
  const bootstrapPassword =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "SpotipaidAdmin!demo";

  const adminHash = await hashPassword(bootstrapPassword);
  await prisma.adminUser.create({
    data: {
      email: bootstrapEmail,
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      displayName: "Demo Admin",
      isActive: true,
    },
  });

  await prisma.integrationEvent.create({
    data: {
      source: "demo",
      eventType: "seed.completed",
      idempotencyKey: "demo-seed-v1",
      payload: JSON.stringify({ at: new Date().toISOString(), isDemo: true }),
      status: "PROCESSED",
      processedAt: new Date(),
      isDemo: true,
    },
  });

  console.log(
    `Seeded ${DEMO_ARTISTS.length} artists, ${DEMO_TOKENS.length} tokens, ${DEMO_PAYMENTS.length} payments, ${DEMO_TRADES.length} trades.`,
  );
  console.log(
    `Demo admin seeded for ${bootstrapEmail} (password from ADMIN_BOOTSTRAP_PASSWORD / .env.example — never commit real secrets).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
