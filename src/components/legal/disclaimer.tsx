import { cn } from "@/lib/cn";

export interface DisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function Disclaimer({ className, compact = false }: DisclaimerProps) {
  if (compact) {
    return (
      <p className={cn("text-xs text-fg-muted", className)}>
        SpotiPaid is not affiliated with or endorsed by Spotify. Tokens do not
        represent music ownership or royalties. Not financial advice.
      </p>
    );
  }

  return (
    <p className={cn("text-sm leading-relaxed text-fg-muted", className)}>
      SpotiPaid is not affiliated with or endorsed by Spotify. Tokens do not
      represent ownership of music, masters, publishing, Spotify royalties, or
      equity. Artist appearance or receiving an allocation is not endorsement.
      Tokens can lose all value. Statistics may be delayed or incorrect. Not
      financial advice. Spotify marks belong to their owners.
    </p>
  );
}
