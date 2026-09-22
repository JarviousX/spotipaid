import { LegalPage, TrustCallouts } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms governing access to SpotiPaid. Not affiliated with Spotify.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Use">
      <p>
        These Terms of Use (“Terms”) govern your access to and use of SpotiPaid
        websites, APIs, and related services (the “Service”). By using the
        Service you agree to these Terms. If you do not agree, do not use the
        Service.
      </p>
      <TrustCallouts />

      <h2>1. Nature of the Service</h2>
      <p>
        SpotiPaid provides tools related to music-linked digital tokens, fee
        routing, artist claim workflows, and protocol analytics. The Service may
        display third-party music metadata (including catalog references that
        may originate from Spotify or other providers) solely for identification
        and attribution. SpotiPaid does not sell Spotify subscriptions, does not
        distribute Spotify royalties, and does not operate Spotify.
      </p>

      <h2>2. No affiliation; trademarks</h2>
      <p>
        SpotiPaid is not affiliated with, endorsed by, sponsored by, or
        partnered with Spotify AB or its affiliates. “Spotify,” the Spotify logo,
        and related marks are trademarks of their respective owners. Any
        reference to Spotify is nominative and descriptive only.
      </p>

      <h2>3. Tokens are not ownership or royalties</h2>
      <p>
        Digital tokens surfaced or launched in connection with SpotiPaid do not
        represent ownership of songs, masters, compositions, publishing rights,
        neighboring rights, Spotify royalties, streaming revenue, equity in any
        artist or company, or any legally enforceable claim to music rights
        unless a separate written instrument expressly says so. Artist
        appearance on the Service, and any fee or protocol allocation an artist
        may receive, does not constitute endorsement of any token, trader, or
        launch.
      </p>

      <h2>4. Eligibility and accounts</h2>
      <p>
        You must be able to form a binding contract in your jurisdiction. Admin
        and claim features may require authentication. You are responsible for
        safeguarding credentials and wallet keys. We may suspend access for
        abuse, fraud, or legal risk.
      </p>

      <h2>5. User conduct</h2>
      <ul>
        <li>No impersonation of artists, labels, or platforms.</li>
        <li>No malicious, fraudulent, or wash-trading schemes.</li>
        <li>No scraping that degrades the Service or violates third-party terms.</li>
        <li>
          No use of the Service to launder funds or violate sanctions or
          securities laws applicable to you.
        </li>
      </ul>

      <h2>6. Artist claims, opt-out, and moderation</h2>
      <p>
        Artists and rightsholders may submit claims, request opt-out or removal
        via the{" "}
        <Link href="/opt-out">opt-out form</Link>, or report abusive content via{" "}
        <Link href="/report">/report</Link>. We may approve, reject, suspend, or
        reverse claim states, disable discovery, or flag tokens based on our
        moderation policies and applicable law. Opt-out requests are processed
        on a commercially reasonable timeline and may not instantly remove
        on-chain records that SpotiPaid does not control.
      </p>

      <h2>7. Fees, payments, and idempotency</h2>
      <p>
        Protocol fee splits, minimum payouts, and settlement status are
        described in-product and may change. Settlements are designed to be
        idempotent by ledger key so duplicate submissions do not create double
        obligations. On-chain confirmations can fail, delay, or reverse
        depending on network conditions. Demo mode data is not live funds.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
        EXTENT PERMITTED BY LAW, SPOTIPAID DISCLAIMS WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
        NON-INFRINGEMENT. We do not warrant that metadata, statistics, balances,
        or charts are accurate, complete, or current.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, SpotiPaid and its operators will
        not be liable for indirect, incidental, special, consequential, or
        punitive damages, or for lost profits, lost data, or token value
        decline, arising from your use of the Service.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms by posting a revised version. Continued use
        after changes constitutes acceptance. For privacy practices see{" "}
        <Link href="/privacy">Privacy</Link>; for risk and disclosure statements
        see <Link href="/risks">Risks</Link> and{" "}
        <Link href="/disclosures">Disclosures</Link>.
      </p>

      <p className="text-xs">Last updated: September 19, 2026</p>
    </LegalPage>
  );
}
