import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/** Prefer explicit width/height via className */
export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("skeleton h-4 w-full", className)}
      {...props}
    />
  );
}
