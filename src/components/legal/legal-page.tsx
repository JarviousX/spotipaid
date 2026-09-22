import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg">{title}</h1>
      <div className="prose-legal mt-10 space-y-6 text-sm leading-relaxed text-fg-muted [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-fg [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-semibold [&_a]:text-accent [&_a]:hover:underline">
        {children}
      </div>
      <nav
        aria-label="Legal navigation"
        className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-sm"
      >
        {[
          ["/terms", "Terms"],
          ["/privacy", "Privacy"],
          ["/disclosures", "Docs"],
          ["/risks", "Risks"],
          ["/opt-out", "Opt-out"],
          ["/report", "Report"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="text-fg-muted hover:text-fg">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function TrustCallouts() {
  return (
    <aside className="rounded-md border border-warning/40 bg-warning/5 px-4 py-4 text-sm text-fg">
      <p className="font-semibold">Important</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted">
        <li>
          <strong>SpotiPaid is not affiliated with or endorsed by Spotify.</strong>
        </li>
        <li>
          Tokens do <strong>not</strong> represent ownership of music, masters,
          publishing, Spotify royalties, or equity.
        </li>
        <li>
          An artist&apos;s appearance on SpotiPaid does <strong>not</strong>{" "}
          mean endorsement.
        </li>
        <li>
          Receiving an allocation does <strong>not</strong> mean endorsement.
        </li>
        <li>Tokens can lose all value.</li>
        <li>Nothing on SpotiPaid is financial, investment, or legal advice.</li>
        <li>Statistics may be delayed, incomplete, or incorrect.</li>
        <li>
          Spotify and related marks belong to their respective owners.
        </li>
      </ul>
    </aside>
  );
}
