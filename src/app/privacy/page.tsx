import { LegalPage, TrustCallouts } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SpotiPaid collects and uses information. Not affiliated with Spotify.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy">
      <p>
        This Privacy Policy explains what information SpotiPaid collects, how we
        use it, and the choices available to you. SpotiPaid is not affiliated
        with or endorsed by Spotify. Spotify’s privacy practices are governed by
        Spotify’s own policies.
      </p>
      <TrustCallouts />

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account and admin data</strong> — hashed admin credentials
          (environment passphrase hash and/or admin user password hashes); claim
          evidence URLs/notes you submit.
        </li>
        <li>
          <strong>Wallet and chain data</strong> — public wallet addresses,
          connection/disconnect timestamps, network labels, transaction
          signatures, and fee/payout ledger entries you interact with through
          the Service. We do not collect seed phrases, private keys, or wallet
          secrets. We do not silently fingerprint devices beyond standard
          security metadata (approximate IP / user agent) needed to protect the
          Service.
        </li>
        <li>
          <strong>Usage data</strong> — approximate IP, user agent, and
          rate-limit metadata needed to secure APIs.
        </li>
        <li>
          <strong>Reports and opt-outs</strong> — content of{" "}
          <Link href="/report">reports</Link> and{" "}
          <Link href="/opt-out">opt-out</Link> requests, stored as integration
          / audit events.
        </li>
        <li>
          <strong>Music metadata</strong> — publicly available catalog fields
          (titles, artist names, artwork URLs) from catalog providers when
          configured. We do not collect Spotify listenership or
          private listening history.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Operate fee routing, claims, moderation, and payouts.</li>
        <li>Secure the Service (rate limits, audit logs, abuse response).</li>
        <li>Display protocol analytics based on SpotiPaid / on-chain activity.</li>
        <li>Respond to rightsholder opt-out and removal requests.</li>
        <li>Comply with law and enforce our Terms.</li>
      </ul>

      <h2>3. Sharing</h2>
      <p>
        We do not sell personal information. We may share data with
        infrastructure providers (hosting, databases), chain networks (public by
        design), and advisors or authorities when legally required. Public
        blockchain data is inherently public and outside our control once
        published.
      </p>

      <h2>4. Retention</h2>
      <p>
        Ledger, audit, and moderation records may be retained for operational
        integrity, fraud prevention, and legal compliance. Wallet connection
        activity records (public address, event type, timestamp, optional
        network) are retained for security and operations for up to 24 months,
        then deleted or anonymized unless a longer period is required for an
        active investigation or legal obligation. You may request deletion of
        certain account-linked personal data subject to legitimate retention
        needs (for example, settlement and audit records).
      </p>

      <h2>5. Security</h2>
      <p>
        Admin passphrases and passwords are stored only as strong one-way
        hashes (never in source or client bundles). Session cookies are
        HTTP-only, SameSite=Strict, and short-lived. No method of transmission
        or storage is perfectly secure; use strong unique credentials and
        protect wallet keys.
      </p>

      <h2>6. Your choices</h2>
      <ul>
        <li>
          Rightsholders: submit an <Link href="/opt-out">opt-out / removal</Link>{" "}
          request.
        </li>
        <li>
          Anyone: report abusive or impersonating content via{" "}
          <Link href="/report">/report</Link>.
        </li>
        <li>
          Disable third-party cookies/trackers in your browser as applicable;
          core Service cookies may still be required for admin sessions.
        </li>
      </ul>

      <h2>7. Children</h2>
      <p>
        The Service is not directed to children under 13 (or the minimum age in
        your jurisdiction). We do not knowingly collect children’s personal
        information.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this Policy by posting a new version. Material changes
        will be reflected by the “Last updated” date below.
      </p>

      <p className="text-xs">Last updated: September 19, 2026</p>
    </LegalPage>
  );
}
