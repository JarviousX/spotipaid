import { cn } from "@/lib/cn";
import Image from "next/image";
import Link from "next/link";

export interface LogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  href?: string | null;
}

/** Brand mark from /public/logo.png */
function Mark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={40}
      height={40}
      className={cn("size-10 shrink-0 object-contain", className)}
      priority
    />
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  href = "/",
}: LogoProps) {
  const content = (
    <>
      <Mark className={markClassName} />
      {showWordmark ? (
        <span className="text-lg font-bold tracking-tight text-fg">
          Spoti<span className="text-accent">Paid</span>
        </span>
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href === null) {
    return (
      <span className={classes} aria-label="SpotiPaid">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label="SpotiPaid home">
      {content}
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return <Mark className={className} />;
}
