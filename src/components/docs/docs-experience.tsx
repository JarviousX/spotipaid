"use client";

import { TrustCallouts } from "@/components/legal/legal-page";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useEffect, useState } from "react";

export type DocsSection = {
  id: string;
  n: number;
  title: string;
};

export const DOC_SECTIONS: DocsSection[] = [
  { id: "overview", n: 1, title: "Overview" },
  { id: "venues", n: 2, title: "Supported venues" },
  { id: "directing", n: 3, title: "Directing fees" },
  { id: "naming", n: 4, title: "Naming the recipient" },
  { id: "split", n: 5, title: "The 80/20 split" },
  { id: "claims", n: 6, title: "How claims work" },
  { id: "getting", n: 7, title: "Getting your fees" },
  { id: "wallet", n: 8, title: "Wallet setup" },
  { id: "unclaimed", n: 9, title: "Pending allocations" },
  { id: "confirmation", n: 10, title: "The public confirmation" },
  { id: "treasury", n: 11, title: "The treasury" },
  { id: "protocol", n: 12, title: "Protocol share" },
  { id: "stopping", n: 13, title: "Stopping payments" },
  { id: "registering", n: 14, title: "If a token is not registering" },
  { id: "glossary", n: 15, title: "Glossary" },
  { id: "disclosures", n: 16, title: "Legal disclosures" },
];

function SectionHeading({
  n,
  id,
  children,
}: {
  n: number;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 text-2xl font-bold tracking-tight text-white"
    >
      <span className="mr-3 font-mono text-lg text-accent">{n}</span>
      {children}
    </h2>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#111] font-mono text-xs font-bold text-accent">
        {n}
      </span>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#8a8a8a]">{children}</p>
      </div>
    </div>
  );
}

function FactRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-[#1a1a1a] py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="text-sm text-[#6b6b6b]">{label}</dt>
      <dd className="text-sm text-[#cfcfcf]">{value}</dd>
    </div>
  );
}

function VenueCard({
  name,
  meta,
  status,
  live,
  children,
}: {
  name: string;
  meta: string;
  status: string;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            live
              ? "bg-accent/15 text-accent"
              : "bg-[#1a1a1a] text-[#8a8a8a]",
          )}
        >
          {status}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#6b6b6b]">{meta}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">{children}</p>
    </div>
  );
}

export function DocsExperience({
  artistPct,
  protocolPct,
}: {
  artistPct: string;
  protocolPct: string;
}) {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const nodes = DOC_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActive(id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const n of nodes) observer.observe(n);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-3xl bg-[radial-gradient(ellipse_at_top,_rgba(29,185,84,0.12),_transparent_70%)]"
      />

      <header className="relative max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Docs
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          How SpotiPaid works
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#9a9a9a] sm:text-lg">
          SpotiPaid is a fee bridge for music-linked tokens. A token points its
          creator fees at us, we claim them on chain, and {artistPct} is reserved
          for the linked artist. Artists verify once, then withdraw to a Solana
          wallet — tokens never mean Spotify royalties or music ownership.
        </p>
      </header>

      <div className="relative mt-12 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#555]">
            Contents
          </p>
          <nav aria-label="Docs contents" className="mt-4 space-y-0.5">
            {DOC_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "flex items-baseline gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  active === s.id
                    ? "bg-[#121212] text-white"
                    : "text-[#7a7a7a] hover:text-[#cfcfcf]",
                )}
              >
                <span className="w-5 shrink-0 font-mono text-xs text-accent/80">
                  {s.n}
                </span>
                <span>{s.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 space-y-16 text-[15px] leading-relaxed text-[#9a9a9a]">
          {/* 1 */}
          <section className="space-y-5">
            <SectionHeading n={1} id="overview">
              Overview
            </SectionHeading>
            <p>
              SpotiPaid turns a token&apos;s creator fees into an artist
              allocation. A deployer launches on a supported venue, points fees
              at the SpotiPaid treasury, and embeds a music attribution line that
              names who the fees are for. Fees accrue as the token trades,
              SpotiPaid claims them on chain, {artistPct} is reserved for the
              artist, and {protocolPct} funds the rails that keep routing
              reliable. Every claim is ledgered; every payout is receipted in{" "}
              <Link href="/payments" className="font-semibold text-accent hover:underline">
                Payments
              </Link>
              .
            </p>
            <p>
              Artists are not required to launch the token themselves. Someone
              else can point fees at a Spotify-linked identity; the artist
              verifies ownership when they want to withdraw. Control also sits
              with rightsholders who can{" "}
              <Link href="/opt-out" className="font-semibold text-accent hover:underline">
                opt out
              </Link>
              . Section 13 covers stopping payments.
            </p>
            <div className="space-y-5 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5 sm:p-6">
              <Step n={1} title="A token directs its fees">
                The deployer points 100% of creator fees at the SpotiPaid
                treasury, permanently. See section 3.
              </Step>
              <Step n={2} title="The description names the music">
                One attribution line ties the mint to a Spotify identity. See
                section 4.
              </Step>
              <Step n={3} title="The token registers itself">
                The indexer sees the fee direction and attribution on chain and
                registers the token. There is no approval queue.
              </Step>
              <Step n={4} title="Fees are claimed">
                SpotiPaid claims accrued creator fees on a schedule and records
                each claim against its transaction signature.
              </Step>
              <Step n={5} title="The artist is paid">
                After verification, the artist share withdraws to a connected
                Solana wallet — or a staged USD offramp when configured.
              </Step>
            </div>
          </section>

          {/* 2 */}
          <section className="space-y-5">
            <SectionHeading n={2} id="venues">
              Supported venues
            </SectionHeading>
            <p>
              A token can direct fees to SpotiPaid from a supported launchpad.
              Which venue it launched on changes how fees are directed and how
              the direction is made permanent — nothing else. The split, the
              payout path, and the ledger are identical.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <VenueCard
                name="pump.fun"
                meta="Solana"
                status="Live"
                live
              >
                Fees directed after creation via fee sharing. Primary venue for
                SpotiPaid today.
              </VenueCard>
              <VenueCard name="letsbonk" meta="Solana" status="Supported">
                Launch flow available in SpotiPaid. Same attribution and split
                rules once fees point at the treasury.
              </VenueCard>
              <VenueCard name="moonshot" meta="Solana" status="Supported">
                Launch flow available. Confirm fee destination permanence on the
                venue before treating a mint as payable.
              </VenueCard>
              <VenueCard name="Other venues" meta="Exploration" status="Not live">
                Additional launchpads may be explored. Until listed as live here,
                they are unsupported. See{" "}
                <a href="#disclosures" className="font-semibold text-accent hover:underline">
                  disclosures
                </a>
                .
              </VenueCard>
            </div>
          </section>

          {/* 3 */}
          <section className="space-y-5">
            <SectionHeading n={3} id="directing">
              Directing fees
            </SectionHeading>
            <p>
              Every venue ends in the same place: SpotiPaid is the token&apos;s
              fee recipient, permanently, and it cannot be moved afterwards.
            </p>
            <p>
              Two rules hold on every venue. It has to be the{" "}
              <strong className="text-white">whole fee</strong>, because a
              partial share would mean the payout we publish is a fraction of
              what the token earned with no way for the artist to tell which.
              And it has to be <strong className="text-white">permanent</strong>
              , because a fee direction that can still be changed is a promise
              that can still be withdrawn.
            </p>
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5 sm:p-6">
              <h3 className="text-base font-semibold text-white">
                On pump.fun
              </h3>
              <p className="mt-3">
                Directed after the coin is created, not during. Fee sharing is a
                separate screen where a creator can split fees across wallets —
                add the SpotiPaid treasury at <strong className="text-white">100%</strong>{" "}
                and revoke the config&apos;s authority so the direction cannot
                change.
              </p>
              <dl className="mt-4">
                <FactRow label="When" value="After the coin exists, from fee sharing" />
                <FactRow
                  label="What we watch"
                  value="The Pump Fees sharing config, per mint"
                />
                <FactRow
                  label="Made permanent by"
                  value="Revoking the config's authority"
                />
              </dl>
            </div>
            <p>
              On any venue there is no approval step and no queue. A token that
              meets both rules and carries a valid attribution line registers on
              its own.
            </p>
            <p className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3 text-sm text-[#8a8a8a]">
              Directing a token&apos;s creator fees to the SpotiPaid treasury
              constitutes acceptance of the{" "}
              <Link href="/terms" className="font-semibold text-accent hover:underline">
                Terms of Use
              </Link>{" "}
              by the deployer.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-5">
            <SectionHeading n={4} id="naming">
              Naming the recipient
            </SectionHeading>
            <p>
              The artist allocation is tied to a Spotify music identity read from
              the token&apos;s description. Put this attribution line in it —
              SpotiPaid Launch writes it for you when you paste a Spotify URL:
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-4 py-4 font-mono text-[13px] text-accent">
              spotipaid:ref=artist:SPOTIFY_ID;v=1
            </pre>
            <p>
              Use the format exactly. <code className="font-mono text-[#cfcfcf]">artist</code>
              , <code className="font-mono text-[#cfcfcf]">track</code>,{" "}
              <code className="font-mono text-[#cfcfcf]">album</code>, or{" "}
              <code className="font-mono text-[#cfcfcf]">playlist</code> are valid
              types. Write whatever else you like around it — the line is what we
              read.
            </p>
            <p>
              The wording matters. Without a fixed line there is no reliable way
              to tell which catalog identity the fees belong to. If the line is
              missing, registration fails or the mint stays non-payable until
              attribution is corrected.
            </p>
            <p>
              The named artist does not need to agree in advance, launch the
              token, or hold a wallet on day one. They verify when they claim —
              website/DNS, verified social, label/rights evidence, or signed
              wallet proof — then withdraw.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-5">
            <SectionHeading n={5} id="split">
              The {artistPct}/{protocolPct} split
            </SectionHeading>
            <p>
              Every claim divides the same way. There is no discretion in it, no
              schedule to negotiate, and no tier that changes it.
            </p>
            <dl className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-5">
              <FactRow
                label="To the artist"
                value={`${artistPct}, reserved as an on-chain allocation until claimed`}
              />
              <FactRow
                label="Protocol cut"
                value={`${protocolPct}, spent on execution, monitoring, and treasury rails`}
              />
              <FactRow label="Applied" value="Per claim, at claim time" />
              <FactRow
                label="Fees we add"
                value={`None. The ${protocolPct} is the whole of it`}
              />
            </dl>
          </section>

          {/* 6 */}
          <section className="space-y-5">
            <SectionHeading n={6} id="claims">
              How claims work
            </SectionHeading>
            <p>
              Creator fees do not arrive continuously. They accrue to the
              treasury as a token trades and sit there until SpotiPaid claims
              them on a schedule rather than on every trade. Claiming per trade
              would spend more in transaction fees than it collected on a quiet
              token.
            </p>
            <p>
              Each claim is written to the ledger keyed on its own transaction
              signature, so a claim cannot be recorded twice and every
              obligation can be traced back to the on-chain event that created
              it. Artist share and protocol cut are both computed at that moment
              from that claim, and neither is recalculated afterwards.
            </p>
            <p>
              A claim can fail. Chains halt, RPC providers go down, and
              transactions revert. A failed claim creates no obligation and is
              retried; the fees stay accrued in the meantime and are not lost.
            </p>
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
              <h3 className="text-base font-semibold text-white">
                Payout thresholds
              </h3>
              <p className="mt-2">
                Artist allocations build until they clear the configured minimum
                claim / payout thresholds (defaults: $1 min claim, $5 min
                payout). Balances below a threshold keep building; nothing
                expires for a verified artist who has not opted out.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section className="space-y-5">
            <SectionHeading n={7} id="getting">
              Getting your fees
            </SectionHeading>
            <p>
              If a token has named your music identity, the allocation is already
              accruing. You verify once, connect a Solana wallet, and withdraw
              when the balance clears the payout threshold.
            </p>
            <div className="space-y-5 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5 sm:p-6">
              <Step n={1} title="A token names your music">
                Somebody launches a token and points creator fees at your
                Spotify-linked identity via <code className="font-mono text-[#cfcfcf]">spotipaid:ref</code>.
              </Step>
              <Step n={2} title="Fees accrue and are claimed">
                Trading generates creator fees. We claim them on chain on a
                schedule and split each claim.
              </Step>
              <Step n={3} title={`${artistPct} is reserved for you`}>
                Your share stages as an allocation. Verify ownership (social,
                DNS, rights evidence, or signed proof), then withdraw to a
                connected wallet.
              </Step>
              <Step n={4} title="Payments confirms it">
                Settled payouts appear in the public Payments feed with amounts
                and music context.
              </Step>
            </div>
            <p>
              Receiving an allocation does not make you a promoter of the token
              that named you, a SpotiPaid customer by default, or an endorser of
              any marketing claim. Money you receive may be taxable — SpotiPaid
              does not issue tax documents, and nothing here is tax advice.
            </p>
          </section>

          {/* 8 */}
          <section className="space-y-5">
            <SectionHeading n={8} id="wallet">
              Wallet setup
            </SectionHeading>
            <p>
              Payouts settle to a Solana wallet you connect through SpotiPaid
              (Phantom and Solflare are supported). SpotiPaid never asks for a
              seed phrase. Wallet connection is for identity, signing claim
              proofs, and receiving withdrawals.
            </p>
            <p>
              Until an artist is verified, allocations remain staged. Verification
              evidence is reviewed; once approved, withdrawals become available
              subject to minimum payout settings. An optional USD offramp may be
              configured later — until then, balances are on-chain obligations
              with a full audit trail.
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-5">
            <SectionHeading n={9} id="unclaimed">
              Pending allocations
            </SectionHeading>
            <p>
              Any Spotify identity can be named, whether or not the artist has
              claimed on SpotiPaid. Fees still accrue and split. Until
              verification + withdrawal, the artist share sits as a pending
              allocation against that identity.
            </p>
            <dl className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-5">
              <FactRow label="Who can be named" value="Any Spotify-linked music identity" />
              <FactRow
                label="If they verify & withdraw"
                value="The allocation is theirs"
              />
              <FactRow
                label="If they opt out"
                value="New claims stop; see section 13"
              />
              <FactRow
                label="Held balances"
                value="May be withheld under Terms (taxes, reserved rights) until resolved"
              />
            </dl>
          </section>

          {/* 10 */}
          <section className="space-y-5">
            <SectionHeading n={10} id="confirmation">
              The public confirmation
            </SectionHeading>
            <p>
              Settled payouts are visible. The{" "}
              <Link href="/payments" className="font-semibold text-accent hover:underline">
                Payments
              </Link>{" "}
              feed and{" "}
              <Link href="/capital-flow" className="font-semibold text-accent hover:underline">
                Capital flow
              </Link>{" "}
              off-ramp view show amounts, music context, and status so artists
              and audiences can check where money came from.
            </p>
            <p>
              Most artists were not asked before their identity was named, so a
              payout or pending allocation may be the first they hear of a mint.
              Public receipts are how that can be inspected without trusting a
              private message.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-5">
            <SectionHeading n={11} id="treasury">
              The treasury
            </SectionHeading>
            <p>
              A token earns creator fees on Solana at its launchpad. SpotiPaid
              claims those fees into treasury accounting, then splits and stages
              artist allocations. The treasury is where accrued fees, claimed
              funds, and payout obligations meet as separate ledger stages —
              accrued → claimed → allocated → paid.
            </p>
            <p>
              Artist payouts do not invent Spotify royalties. They are
              redistributions of launchpad creator fees that a deployer chose to
              point at SpotiPaid.
            </p>
          </section>

          {/* 12 */}
          <section className="space-y-5">
            <SectionHeading n={12} id="protocol">
              Protocol share
            </SectionHeading>
            <p>
              The {protocolPct} protocol cut funds execution, indexing,
              monitoring, and treasury operations that keep fee routing
              reliable. It is not a discretionary tip and it does not buy
              preferential treatment for any mint or artist.
            </p>
            <p>
              Holding any token — including whatever market traders invent —
              does not change the split, who can launch, or who gets paid.
              Protocol parameters (including bps) may be updated through
              protocol settings; defaults ship at {artistPct}/{protocolPct}.
            </p>
          </section>

          {/* 13 */}
          <section className="space-y-5">
            <SectionHeading n={13} id="stopping">
              Stopping payments
            </SectionHeading>
            <p>
              Rightsholders who want discovery disabled, allocations deactivated,
              or impersonating listings reviewed can submit an{" "}
              <Link href="/opt-out" className="font-semibold text-accent hover:underline">
                opt-out request
              </Link>
              . We review on a commercially reasonable basis.
            </p>
            <p>
              When a removal takes effect: the identity can be taken off
              discovery, added to a do-not-pay posture for new claims, and we
              stop treating newly claimed fees as payable to that identity.
              On-chain history SpotiPaid does not control may remain visible on
              Solana. Already-settled payouts are not clawed back.
            </p>
            <p>
              Anyone can also{" "}
              <Link href="/report" className="font-semibold text-accent hover:underline">
                report
              </Link>{" "}
              suspected impersonation or policy violations.
            </p>
          </section>

          {/* 14 */}
          <section className="space-y-5">
            <SectionHeading n={14} id="registering">
              If a token is not registering
            </SectionHeading>
            <p>
              Registration is automatic, so a token that has not appeared has
              failed one of a short list of conditions. In rough order of how
              often each is the cause:
            </p>
            <dl className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-5">
              <FactRow
                label="Not the whole fee"
                value="Sharing config gives SpotiPaid a partial share. It has to be 100%."
              />
              <FactRow
                label="Not yet permanent"
                value="On pump.fun, the sharing config's authority has not been revoked."
              />
              <FactRow
                label="Wrong treasury address"
                value="Fees point at an address that is not the SpotiPaid treasury."
              />
              <FactRow
                label="No attribution line"
                value="Description is missing a valid spotipaid:ref=…;v=1 line."
              />
              <FactRow
                label="Too recent"
                value="The indexer reads the chain on a schedule. A mint created moments ago may not be seen yet."
              />
            </dl>
          </section>

          {/* 15 */}
          <section className="space-y-5">
            <SectionHeading n={15} id="glossary">
              Glossary
            </SectionHeading>
            <dl className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] px-5">
              <FactRow
                label="Creator fees"
                value="Fees a launchpad pays to a token's creator wallet from trading that token."
              />
              <FactRow
                label="Fee sharing"
                value="pump.fun's screen for splitting creator fees across wallets — where a mint directs fees to SpotiPaid."
              />
              <FactRow
                label="Attribution line"
                value="spotipaid:ref={type}:{id};v=1 in the token description, binding the mint to a Spotify identity."
              />
              <FactRow
                label="Claim"
                value="An on-chain transaction in which SpotiPaid collects accrued creator fees for a registered mint."
              />
              <FactRow
                label="Artist allocation"
                value={`${artistPct} of a claim, reserved for the named music identity until withdrawn.`}
              />
              <FactRow
                label="Protocol cut"
                value={`${protocolPct} of a claim, funding execution rails and treasury operations.`}
              />
              <FactRow
                label="Pending allocation"
                value="Artist share accrued but not yet withdrawn after verification."
              />
              <FactRow
                label="Held balance"
                value="A share withheld under Terms (taxes or reserved rights) until that provision resolves it."
              />
              <FactRow
                label="Treasury"
                value="The address creator fees are directed to, and where claim accounting meets payout obligations."
              />
            </dl>
          </section>

          {/* 16 */}
          <section className="space-y-5">
            <SectionHeading n={16} id="disclosures">
              Legal disclosures
            </SectionHeading>
            <p>
              Read this together with our{" "}
              <Link href="/terms" className="font-semibold text-accent hover:underline">
                Terms
              </Link>
              ,{" "}
              <Link href="/privacy" className="font-semibold text-accent hover:underline">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/risks" className="font-semibold text-accent hover:underline">
                Risks
              </Link>
              .
            </p>
            <TrustCallouts />

            <h3 className="text-lg font-semibold text-white">
              No Spotify affiliation or endorsement
            </h3>
            <p>
              SpotiPaid is an independent project. It is not affiliated with,
              endorsed by, sponsored by, or partnered with Spotify AB or any
              Spotify affiliate. References to Spotify catalog identifiers, URLs,
              or artwork are for music identification only.
            </p>

            <h3 className="text-lg font-semibold text-white">
              Tokens do not represent music ownership or royalties
            </h3>
            <p>
              Tokens associated with tracks, albums, artists, or playlists do{" "}
              <strong className="text-white">not</strong> represent ownership of
              music, masters, compositions, publishing, neighboring rights,
              Spotify royalties, streaming payouts, label contracts, or equity —
              unless a separate legally binding instrument expressly grants such
              rights (which SpotiPaid does not provide by default).
            </p>

            <h3 className="text-lg font-semibold text-white">
              Appearance and allocations are not endorsement
            </h3>
            <p>
              An artist&apos;s name, image, or catalog metadata on SpotiPaid does
              not mean endorsement. Receiving an allocation does not constitute
              partnership, employment, or ratification of any token&apos;s
              marketing claims.
            </p>

            <h3 className="text-lg font-semibold text-white">
              Risk, advice, and statistics
            </h3>
            <p>
              Tokens can lose all value. Nothing on SpotiPaid is financial,
              investment, tax, or legal advice. Protocol statistics may be
              delayed, incomplete, or incorrect. Third-party catalog sources are
              labeled where practicable. SpotiPaid never presents Spotify
              listenership as a SpotiPaid metric.
            </p>

            <h3 className="text-lg font-semibold text-white">Marks</h3>
            <p>
              Spotify and related names, logos, and trade dress are trademarks of
              their respective owners. Nominative references do not imply
              sponsorship.
            </p>

            <p className="text-xs text-[#555]">Last updated: September 19, 2026</p>
          </section>

          <nav
            aria-label="Legal navigation"
            className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#1f1f1f] pt-6 text-sm"
          >
            {[
              ["/terms", "Terms"],
              ["/privacy", "Privacy"],
              ["/disclosures", "Docs"],
              ["/risks", "Risks"],
              ["/opt-out", "Opt-out"],
              ["/report", "Report"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-[#6b6b6b] hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </article>
      </div>
    </div>
  );
}
