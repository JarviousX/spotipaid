"use client";

import { PublicCaChip } from "@/components/brand/public-ca-chip";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SIDEBAR_NAV } from "@/components/layout/nav-items";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/cn";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.739L1.25 2.25h7.08l4.263 5.705L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "relative sticky top-0 z-30 flex h-dvh shrink-0 flex-col overflow-visible border-r border-[#1a1a1a] bg-bg transition-[width] duration-200 ease-out",
        collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
        className,
      )}
    >
      {/* Collapse on the border edge — UsePaid style */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className={cn(
          "absolute top-[1.125rem] z-40 flex size-7 items-center justify-center rounded-full",
          "border border-[#2e2e2e] bg-[#0a0a0a] text-[#a3a3a3]",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
          "transition-colors hover:border-[#444] hover:text-white",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "right-0 translate-x-1/2",
        )}
      >
        {collapsed ? (
          <ChevronsRight className="size-3.5" strokeWidth={2.25} aria-hidden />
        ) : (
          <ChevronsLeft className="size-3.5" strokeWidth={2.25} aria-hidden />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Logo
          showWordmark={false}
          markClassName={collapsed ? "size-9" : "size-10"}
        />
      </div>

      {/* Nav — generous spacing, no pill backgrounds */}
      <nav
        aria-label="Primary"
        className={cn(
          "flex flex-1 flex-col",
          collapsed ? "gap-0.5 px-2 pt-2" : "gap-0.5 px-3 pt-2",
        )}
      >
        {SIDEBAR_NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-base font-semibold tracking-tight transition-colors",
                collapsed
                  ? "justify-center px-0 py-3.5"
                  : "gap-3.5 px-3 py-3.5",
                item.accent
                  ? "text-accent hover:text-[#1ed760]"
                  : active
                    ? "text-white"
                    : "text-[#9a9a9a] hover:text-[#e5e5e5]",
              )}
            >
              <Icon
                className="size-5 shrink-0"
                strokeWidth={active || item.accent ? 2.4 : 2.15}
                aria-hidden
              />
              {!collapsed ? <span>{item.label}</span> : null}
              {collapsed ? <span className="sr-only">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer — CA above brand */}
      <div
        className={cn(
          "mt-auto shrink-0 border-t border-[#1a1a1a]",
          collapsed ? "p-2" : "px-3 py-3",
        )}
      >
        <div
          className={cn(
            "flex",
            collapsed ? "justify-center" : "justify-start px-1.5",
          )}
        >
          <PublicCaChip
            compact={collapsed}
            className={cn(
              "mb-2",
              collapsed ? "max-w-full px-1.5" : "w-full justify-center",
            )}
          />
        </div>
        {collapsed ? (
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg p-2 text-[#8a8a8a] hover:text-white"
            title="SpotiPaid"
          >
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[#141414]">
              <LogoMark className="size-5" />
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#141414]">
              <LogoMark className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-white">
                SpotiPaid
              </p>
              <p className="truncate text-xs leading-tight text-[#8a8a8a]">
                @SpotiPaid
              </p>
            </div>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SpotiPaid on X"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:text-white"
            >
              <XIcon className="size-3.5" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
