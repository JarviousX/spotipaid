import { LegalPage, TrustCallouts } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Risks",
  description:
    "Material risks of using SpotiPaid and interacting with music-linked tokens.",
};

export default function RisksPage() {
  return (
    <LegalPage eyebrow="Legal" title="Risks">
      <p>
        Interacting with SpotiPaid, music-linked tokens, wallets, and on-chain
        settlement involves significant risk. This summary is not exhaustive and
        is not advice. Also read our <Link href="/disclosures">Disclosures</Link>{" "}
        and <Link href="/terms">Terms</Link>.
      </p>
      <TrustCallouts />

      <h2>Market and liquidity risk</h2>
      <p>
        Token prices can move quickly and without notice. Bid/ask depth may be
        thin or disappear. You may be unable to exit a position at a desired
        price — or at all. Tokens can go to zero.
      </p>

      <h2>Smart contract and infrastructure risk</h2>
      <p>
        Bugs, upgrades, key compromises, oracle failures, RPC outages, or
        launchpad/indexer errors can delay, alter, or prevent settlements.
        SpotiPaid may depend on third-party chains and APIs it does not control.
      </p>

      <h2>Attribution and impersonation risk</h2>
      <p>
        Music metadata can be wrong, stale, or spoofed. Bad actors may launch
        tokens that impersonate artists. Appearance of an artist name is not
        verification. Use claim badges and moderation flags carefully, and
        report abuse via <Link href="/report">/report</Link>.
      </p>

      <h2>Rights and legal risk</h2>
      <p>
        Holding or trading a token does not grant music rights. Launching or
        marketing tokens that misuse names, likenesses, or copyrighted works can
        create liability for the launcher — not “cleared” by SpotiPaid’s UI.
        Rightsholders may pursue opt-out or legal remedies.
      </p>

      <h2>Settlement and operational risk</h2>
      <p>
        Fee claims and payouts can remain pending, fail, or require retry.
        Idempotent keys reduce double-pay risk but do not eliminate chain or
        custody failures. Demo ledgers are not real money movement.
      </p>

      <h2>Data accuracy risk</h2>
      <p>
        Analytics and stats may be delayed or wrong. Never treat SpotiPaid
        charts as Spotify listenership, certified royalty statements, or audited
        financials.
      </p>

      <h2>Regulatory risk</h2>
      <p>
        Digital assets may be regulated differently across jurisdictions.
        Features may be unavailable where restricted. You are responsible for
        compliance with laws that apply to you.
      </p>

      <p className="text-xs">Last updated: September 19, 2026</p>
    </LegalPage>
  );
}
