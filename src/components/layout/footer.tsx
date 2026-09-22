"use client";

import { PublicCaChip } from "@/components/brand/public-ca-chip";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useEffect, useState } from "react";

const productLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/payments", label: "Payments" },
  { href: "/analytics", label: "Analytics" },
  { href: "/launch", label: "Launch" },
] as const;

const protocolLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/capital-flow", label: "Capital flow" },
  { href: "/report", label: "Report" },
  { href: "/disclosures", label: "Docs" },
] as const;

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/disclosures#disclosures", label: "Disclosures" },
  { href: "/opt-out", label: "Opt out" },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.739L1.25 2.25h7.08l4.263 5.705L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-[#8a8a8a] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfficialXLink() {
  const [href, setHref] = useState("https://x.com");
  useEffect(() => {
    void fetch("/api/protocol/public")
      .then((r) => r.json())
      .then((data: { xUrl?: string | null }) => {
        if (data.xUrl) setHref(data.xUrl);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="SpotiPaid on X"
      className="mt-4 inline-flex size-8 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:text-white"
    >
      <XIcon className="size-3.5" />
    </a>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t border-[#1a1a1a] bg-bg", className)}>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8 lg:gap-8">
        <div>
          <p className="text-sm font-semibold text-white">SpotiPaid</p>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            © {new Date().getFullYear()} SpotiPaid
          </p>
          <div className="mt-3">
            <PublicCaChip />
          </div>
          <OfficialXLink />
          <p className="mt-4 text-xs leading-relaxed text-[#5a5a5a]">
            Not affiliated with Spotify.
          </p>
        </div>

        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Protocol" links={protocolLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>
    </footer>
  );
}
