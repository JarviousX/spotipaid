"use client";

import { cn } from "@/lib/cn";
import type { ActivityItem, ActivityKind } from "@/lib/activity-map";

export type { ActivityItem, ActivityKind };

const kindStyles: Record<ActivityKind, string> = {
  trade: "text-fg",
  mint: "text-accent",
  claim: "text-success",
  launch: "text-warning",
  payment: "text-accent",
};

export interface LiveRailProps {
  items?: ActivityItem[];
  className?: string;
  /** Show a Demo marker when activity is simulated */
  demo?: boolean;
}

export function LiveRail({
  items = [],
  className,
  demo = false,
}: LiveRailProps) {
  const source = items.length > 0 ? items : [];
  if (source.length === 0) {
    return (
      <div
        className={cn(
          "border-y border-border bg-bg-elevated/40 px-4 py-3 text-center text-sm text-fg-muted",
          className,
        )}
      >
        No live activity yet.
      </div>
    );
  }

  const loop = [...source, ...source];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-border bg-bg-elevated/40",
        className,
      )}
      aria-label={demo ? "Demo activity feed" : "Live activity"}
    >
      {demo ? (
        <span className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded border border-warning/30 bg-bg/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-warning">
          Demo
        </span>
      ) : null}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />
      <div className="activity-rail-track flex gap-8 whitespace-nowrap py-3 pl-16">
        {loop.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex items-baseline gap-2 text-sm"
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.12em]",
                kindStyles[item.kind],
              )}
            >
              {item.label}
            </span>
            <span className="text-fg-muted">{item.detail}</span>
            {item.amount ? (
              <span className="font-mono text-fg">{item.amount}</span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
