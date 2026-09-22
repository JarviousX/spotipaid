import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="hidden w-full overflow-x-auto rounded-md border border-border md:block">
      <table
        className={cn("w-full min-w-[36rem] border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-border bg-bg-elevated/80 text-fg-muted", className)}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TR({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-white/[0.02]", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-fg", className)} {...props} />;
}

export interface MobileTableCardProps {
  label: string;
  value: ReactNode;
}

export function MobileTable({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-table-mobile=""
      className={cn("grid gap-3 md:hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function MobileTableCard({
  className,
  title,
  rows,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  rows: MobileTableCardProps[];
}) {
  return (
    <div
      className={cn("rounded-md border border-border bg-bg-elevated/50 p-4", className)}
      {...props}
    >
      <div className="mb-3 text-sm font-semibold text-fg">{title}</div>
      <dl className="grid gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <dt className="text-fg-muted">{row.label}</dt>
            <dd className="text-right font-mono text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
