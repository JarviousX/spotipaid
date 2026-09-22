import { cn } from "@/lib/cn";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

export interface ArtworkProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  spotifyUrl?: string;
  attribution?: string;
  priority?: boolean;
}

export function Artwork({
  src,
  alt,
  size = 64,
  className,
  spotifyUrl,
  attribution,
  priority = false,
}: ArtworkProps) {
  const placeholder = (
    <div
      className="flex size-full items-center justify-center bg-bg-elevated text-[10px] font-semibold text-fg-muted"
      aria-hidden
    >
      {alt.slice(0, 1).toUpperCase() || "·"}
    </div>
  );

  const image = src ? (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "size-full object-cover object-center",
        !spotifyUrl && "rounded-md",
      )}
    />
  ) : (
    placeholder
  );

  return (
    <figure className={cn("inline-flex flex-col gap-1.5", className)}>
      {spotifyUrl ? (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block overflow-hidden rounded-md border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ width: size, height: size }}
          aria-label={`Open ${alt} on Spotify`}
        >
          {image}
          <span className="pointer-events-none absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <ExternalLink className="size-3.5 text-white" aria-hidden />
          </span>
        </a>
      ) : (
        <div
          className="overflow-hidden rounded-md border border-border"
          style={{ width: size, height: size }}
        >
          {image}
        </div>
      )}
      {attribution ? (
        <figcaption className="max-w-[12rem] text-[10px] leading-snug text-fg-muted">
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
