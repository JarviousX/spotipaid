import { isDemoMode } from "@/lib/demo";
import { cn } from "@/lib/cn";

export function DemoBanner({ className }: { className?: string }) {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className={cn(
        "sticky top-0 z-40 border-b border-warning/25 bg-warning/10",
        className,
      )}
    >
      <p className="mx-auto flex h-[var(--banner-h)] max-w-7xl items-center justify-center px-4 text-center text-xs font-medium tracking-wide text-warning sm:text-sm">
        Demo Mode — data is simulated and not live.
      </p>
    </div>
  );
}
