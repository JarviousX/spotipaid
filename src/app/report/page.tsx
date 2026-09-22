import { LegalPage, TrustCallouts } from "@/components/legal/legal-page";
import { ReportForm } from "@/components/legal/report-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Report",
  description:
    "Report impersonation, malicious tokens, or policy violations on SpotiPaid.",
};

export default function ReportPage() {
  return (
    <LegalPage eyebrow="Trust & safety" title="Report content">
      <p>
        Use this form to report suspected impersonation, malicious metadata,
        scam launches, or other policy issues. Submissions go to{" "}
        <code className="font-mono text-fg">/api/report</code> and create a
        moderation queue event for admins.
      </p>
      <TrustCallouts />
      <p>
        Rightsholders seeking removal of their own catalog presence should use{" "}
        <Link href="/opt-out">opt-out</Link>.
      </p>
      <ReportForm />
    </LegalPage>
  );
}
