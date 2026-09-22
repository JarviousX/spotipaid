"use client";

import { cn } from "@/lib/cn";
import { useReducedMotion } from "framer-motion";
import {
  ArrowDownToLine,
  Coins,
  Cpu,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

type FlowFocus = "all" | "artist" | "protocol";

function PumpMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pump-logomark.svg"
      alt=""
      width={22}
      height={22}
      className={cn("size-5 object-contain", className)}
    />
  );
}

function SolMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] text-[9px] font-black text-black",
        className,
      )}
    >
      S
    </span>
  );
}

function FlowNode({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-[7.5rem] flex-col items-center gap-2.5 text-center sm:w-32">
      <div
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full border bg-[#111] transition-shadow duration-500",
          active
            ? "border-accent/60 shadow-[0_0_24px_rgba(29,185,84,0.35)]"
            : "border-[#2a2a2a]",
        )}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-accent/20"
          />
        ) : null}
        <span className="relative z-[1]">{children}</span>
      </div>
      <p className="text-[11px] font-medium leading-snug text-[#9a9a9a]">
        {label}
      </p>
    </div>
  );
}

function PipelineNode({
  x,
  y,
  label,
  hint,
  active,
  dimmed,
  accent = "green",
  onFocus,
  onBlur,
  children,
}: {
  x: number;
  y: number;
  label: string;
  hint?: string;
  active?: boolean;
  dimmed?: boolean;
  accent?: "green" | "amber";
  onFocus?: () => void;
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  const glow =
    accent === "amber"
      ? "border-[#f59e0b]/60 shadow-[0_0_32px_rgba(245,158,11,0.4)]"
      : "border-accent/75 shadow-[0_0_34px_rgba(29,185,84,0.48)]";

  return (
    <button
      type="button"
      aria-label={hint ? `${label}. ${hint}` : label}
      title={hint}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        "group absolute flex w-[9rem] -translate-x-1/2 flex-col items-center text-center transition-opacity duration-300",
        dimmed && "opacity-30",
      )}
      style={{ left: `${(x / 1120) * 100}%`, top: `${(y / 400) * 100}%` }}
    >
      <span
        className={cn(
          "relative -mt-8 flex size-[3.65rem] items-center justify-center rounded-full border bg-[#0a0a0a] transition-[box-shadow,border-color,transform] duration-300",
          active ? glow : "border-[#2c2c2c] group-hover:border-[#444]",
          active && "scale-[1.05]",
        )}
      >
        {active ? (
          <span
            aria-hidden
            className={cn(
              "absolute inset-[-4px] rounded-full capital-flow-ring",
              accent === "amber" ? "bg-[#f59e0b]/12" : "bg-accent/12",
            )}
          />
        ) : null}
        <span className="relative z-[1]">{children}</span>
      </span>
      <span className="mt-3 text-[11px] font-semibold leading-snug tracking-wide text-[#cfcfcf]">
        {label}
      </span>
      {hint ? (
        <span className="mt-1 max-w-[8.75rem] text-[10px] leading-snug text-[#666] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

function PctBadge({
  x,
  y,
  value,
  tone = "green",
  dimmed,
}: {
  x: number;
  y: number;
  value: string;
  tone?: "green" | "amber";
  dimmed?: boolean;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide shadow-lg transition-opacity duration-300",
        tone === "green"
          ? "border-accent/40 bg-[#07140c]/95 text-accent"
          : "border-[#f59e0b]/35 bg-[#1a1208]/95 text-[#fbbf24]",
        dimmed && "opacity-25",
      )}
      style={{ left: `${(x / 1120) * 100}%`, top: `${(y / 400) * 100}%` }}
    >
      {value}
    </span>
  );
}

const STAGE_COPY = [
  "Creator fees accrue on pump.fun against the music-linked mint.",
  "SpotiPaid claims accrued fees into accounting.",
  "Every claim splits — artist allocation vs protocol rails.",
  "Artist share stages for settlement / offramp.",
  "Verified artist receives the distribution.",
] as const;

export function CapitalFlowPipeline({
  artistPct,
  protocolPct,
}: {
  artistPct: string;
  protocolPct: string;
}) {
  const reduceMotion = useReducedMotion();
  const [pulse, setPulse] = useState(0);
  const [focus, setFocus] = useState<FlowFocus>("all");

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setPulse((p) => p + 1), 1600);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const stage = pulse % 5;
  const artistDim = focus === "protocol";
  const protocolDim = focus === "artist";

  const trunk = "M 100 200 H 290";
  const artistFull =
    "M 290 200 C 360 200, 390 100, 470 100 H 680 H 880 H 1020";
  const protocolDown = "M 290 200 C 360 200, 390 300, 470 300 H 620";

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#1f1f1f] bg-[#070707]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_8%_40%,_rgba(29,185,84,0.14),_transparent_50%),radial-gradient(ellipse_at_88%_18%,_rgba(29,185,84,0.05),_transparent_42%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <div className="relative flex items-center justify-between gap-3 border-b border-[#161616] px-5 py-3 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#555]">
          Live fee routing
        </p>
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all" as const, label: "All" },
              { id: "artist" as const, label: artistPct },
              { id: "protocol" as const, label: protocolPct },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFocus(t.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                focus === t.id
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:text-[#aaa]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative hidden px-4 pb-2 pt-6 sm:px-6 lg:block">
        <div className="relative mx-auto aspect-[1120/400] w-full max-w-5xl">
          <svg
            viewBox="0 0 1120 400"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="cfGreen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1DB954" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#1ED760" stopOpacity="1" />
                <stop offset="100%" stopColor="#1DB954" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="cfAmber" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1DB954" stopOpacity="0.35" />
                <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
              </linearGradient>
              <filter id="cfGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="cfBloom"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d={artistFull}
              stroke="#1ED760"
              strokeWidth="14"
              fill="none"
              opacity={artistDim ? 0.02 : 0.08}
              filter="url(#cfBloom)"
            />

            <path
              d={trunk}
              stroke="url(#cfGreen)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              className="capital-flow-draw capital-flow-draw-on"
              style={{ ["--cf-len" as string]: 190 }}
            />
            <path
              d={artistFull}
              stroke="url(#cfGreen)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              opacity={artistDim ? 0.18 : 0.95}
              className="capital-flow-draw capital-flow-draw-on transition-opacity duration-300"
              style={{
                ["--cf-len" as string]: 820,
                animationDelay: "0.2s",
              }}
            />
            <path
              d={protocolDown}
              stroke="url(#cfAmber)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity={protocolDim ? 0.15 : 0.9}
              className="capital-flow-draw capital-flow-draw-on transition-opacity duration-300"
              style={{
                ["--cf-len" as string]: 400,
                animationDelay: "0.35s",
              }}
            />

            {!reduceMotion ? (
              <>
                <path
                  d={trunk}
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  className="capital-flow-dash"
                  opacity="0.5"
                />
                {!artistDim ? (
                  <path
                    d={artistFull}
                    stroke="#1ED760"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    className="capital-flow-dash capital-flow-dash-fast"
                    opacity="0.65"
                  />
                ) : null}
                {!protocolDim ? (
                  <path
                    d={protocolDown}
                    stroke="#fbbf24"
                    strokeWidth="1.75"
                    fill="none"
                    strokeLinecap="round"
                    className="capital-flow-dash capital-flow-dash-slow"
                    opacity="0.6"
                  />
                ) : null}
              </>
            ) : null}

            <circle
              cx="290"
              cy="200"
              r="5"
              fill="#0a0a0a"
              stroke="#1ED760"
              strokeWidth="1.5"
            />
            <circle cx="290" cy="200" r="2.2" fill="#1ED760" />

            {!reduceMotion ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <g key={`t-${i}`}>
                    <circle
                      r="6"
                      fill="#1ED760"
                      opacity="0.18"
                      filter="url(#cfGlow)"
                    >
                      <animateMotion
                        dur="1.8s"
                        repeatCount="indefinite"
                        begin={`${i * 0.45}s`}
                        path={trunk}
                      />
                    </circle>
                    <circle r="2.6" fill="#fff">
                      <animateMotion
                        dur="1.8s"
                        repeatCount="indefinite"
                        begin={`${i * 0.45}s`}
                        path={trunk}
                      />
                    </circle>
                  </g>
                ))}
                {!artistDim
                  ? [0, 1, 2, 3, 4, 5].map((i) => (
                      <g key={`a-${i}`}>
                        <circle
                          r="5.5"
                          fill="#1ED760"
                          opacity="0.2"
                          filter="url(#cfGlow)"
                        >
                          <animateMotion
                            dur="3.2s"
                            repeatCount="indefinite"
                            begin={`${0.3 + i * 0.52}s`}
                            path={artistFull}
                          />
                        </circle>
                        <circle r="2.4" fill="#b8ffd0">
                          <animateMotion
                            dur="3.2s"
                            repeatCount="indefinite"
                            begin={`${0.3 + i * 0.52}s`}
                            path={artistFull}
                          />
                        </circle>
                      </g>
                    ))
                  : null}
                {!protocolDim
                  ? [0, 1, 2].map((i) => (
                      <g key={`p-${i}`}>
                        <circle
                          r="5"
                          fill="#f59e0b"
                          opacity="0.25"
                          filter="url(#cfGlow)"
                        >
                          <animateMotion
                            dur="2.8s"
                            repeatCount="indefinite"
                            begin={`${0.6 + i * 0.9}s`}
                            path={protocolDown}
                          />
                        </circle>
                        <circle r="2.2" fill="#fde68a">
                          <animateMotion
                            dur="2.8s"
                            repeatCount="indefinite"
                            begin={`${0.6 + i * 0.9}s`}
                            path={protocolDown}
                          />
                        </circle>
                      </g>
                    ))
                  : null}
              </>
            ) : null}
          </svg>

          <span
            className={cn(
              "absolute z-[2] flex size-7 items-center justify-center rounded-full border border-[#2775CA]/50 bg-[#071018] text-[10px] font-bold text-[#5eb0ff] shadow-[0_0_16px_rgba(39,117,202,0.35)]",
              !reduceMotion && "capital-flow-float",
            )}
            style={{ left: "33%", top: "36%" }}
          >
            $
          </span>
          <span
            className={cn(
              "absolute z-[2]",
              !reduceMotion && "capital-flow-float",
            )}
            style={{ left: "33%", top: "64%", animationDelay: "0.75s" }}
          >
            <SolMark className="size-7 text-[10px] shadow-[0_0_14px_rgba(153,69,255,0.35)]" />
          </span>

          <PctBadge x={390} y={68} value={artistPct} dimmed={artistDim} />
          <PctBadge
            x={390}
            y={332}
            value={protocolPct}
            tone="amber"
            dimmed={protocolDim}
          />

          <PipelineNode
            x={100}
            y={200}
            label="pump.fun"
            hint="Creator fees accrue here"
            active={stage === 0}
            onFocus={() => setFocus("all")}
            onBlur={() => setFocus("all")}
          >
            <PumpMark />
          </PipelineNode>
          <PipelineNode
            x={290}
            y={200}
            label="Fees claimed"
            hint="Claimed into SpotiPaid accounting"
            active={stage === 1}
            onFocus={() => setFocus("all")}
            onBlur={() => setFocus("all")}
          >
            <ArrowDownToLine className="size-5 text-accent" />
          </PipelineNode>
          <PipelineNode
            x={470}
            y={100}
            label="Artist allocation"
            hint={`${artistPct} reserved on-chain`}
            active={stage === 2 && !artistDim}
            dimmed={artistDim}
            onFocus={() => setFocus("artist")}
            onBlur={() => setFocus("all")}
          >
            <Wallet className="size-5 text-accent" />
          </PipelineNode>
          <PipelineNode
            x={470}
            y={300}
            label="Protocol share"
            hint={`${protocolPct} funds execution rails`}
            active={stage === 2 && !protocolDim}
            dimmed={protocolDim}
            accent="amber"
            onFocus={() => setFocus("protocol")}
            onBlur={() => setFocus("all")}
          >
            <Cpu className="size-5 text-[#f59e0b]" />
          </PipelineNode>
          <PipelineNode
            x={880}
            y={100}
            label="Settlement"
            hint="Staged for wallet / offramp"
            active={stage === 3 && !artistDim}
            dimmed={artistDim}
            onFocus={() => setFocus("artist")}
            onBlur={() => setFocus("all")}
          >
            <Coins className="size-5 text-accent" />
          </PipelineNode>
          <PipelineNode
            x={1020}
            y={100}
            label="Artist receives"
            hint="Payout to connected wallet"
            active={stage === 4 && !artistDim}
            dimmed={artistDim}
            onFocus={() => setFocus("artist")}
            onBlur={() => setFocus("all")}
          >
            <User className="size-5 text-white" />
          </PipelineNode>
        </div>

        <p className="mx-auto mt-1 max-w-5xl px-2 pb-5 text-center text-xs text-[#6b6b6b]">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(29,185,84,0.8)]" />
            {STAGE_COPY[stage]}
          </span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-1 px-4 py-6 lg:hidden">
        {[
          { label: "pump.fun", icon: <PumpMark /> },
          {
            label: "Fees claimed",
            icon: <ArrowDownToLine className="size-5 text-accent" />,
          },
          {
            label: `${artistPct} artist allocation`,
            icon: <Wallet className="size-5 text-accent" />,
          },
          {
            label: `${protocolPct} protocol share`,
            icon: <Cpu className="size-5 text-[#f59e0b]" />,
          },
          {
            label: "Settlement",
            icon: <Coins className="size-5 text-accent" />,
          },
          {
            label: "Artist receives",
            icon: <User className="size-5 text-white" />,
          },
        ].map((n, i) => (
          <div key={n.label} className="flex flex-col items-center">
            <FlowNode label={n.label} active={!reduceMotion && stage === i % 5}>
              {n.icon}
            </FlowNode>
            {i < 5 ? (
              <span className="relative my-1.5 h-8 w-px overflow-hidden bg-gradient-to-b from-accent/55 via-accent/25 to-transparent">
                {!reduceMotion ? (
                  <span className="capital-flow-hop-y absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(29,185,84,0.8)]" />
                ) : null}
              </span>
            ) : null}
          </div>
        ))}
        <p className="mt-4 max-w-xs text-center text-xs text-[#6b6b6b]">
          {STAGE_COPY[stage]}
        </p>
      </div>
    </div>
  );
}
