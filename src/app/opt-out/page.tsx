import { LegalPage, TrustCallouts } from "@/components/legal/legal-page";
import { OptOutForm } from "@/components/legal/opt-out-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Opt-out / removal",
  description:
    "Rightsholder opt-out and removal requests for SpotiPaid discovery and allocations.",
};

export default function OptOutPage() {
  return (
    <LegalPage eyebrow="Legal" title="Opt-out / removal">
      <p>
        Rightsholders can request that SpotiPaid disable discovery for linked
        tokens, deactivate artist allocations where we control them, and review
        listings that misuse names or likenesses. Provide an artist ID/slug
        and/or a contact email. This form posts to{" "}
        <code className="font-mono text-fg">/api/opt-out</code>.
      </p>
      <TrustCallouts />
      <p>
        Opt-out does not erase public blockchain history SpotiPaid does not
        control. For impersonation or malicious tokens, also use{" "}
        <Link href="/report">/report</Link>.
      </p>
      <OptOutForm />
    </LegalPage>
  );
}
