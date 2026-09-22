"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  truncated?: boolean;
  chars?: number;
}

function truncate(value: string, chars: number) {
  if (value.length <= chars * 2 + 1) return value;
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
}

export function CopyButton({
  value,
  label,
  className,
  truncated = true,
  chars = 6,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be denied */
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onCopy}
      className={cn("font-mono text-xs", className)}
      aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      <span className="max-w-[14rem] truncate">
        {truncated ? truncate(value, chars) : value}
      </span>
    </Button>
  );
}
