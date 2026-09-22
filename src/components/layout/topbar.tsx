"use client";

import { SIDEBAR_NAV } from "@/components/layout/nav-items";
import { useSearch } from "@/components/search/search-context";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { PublicCaChip } from "@/components/brand/public-ca-chip";
import { cn } from "@/lib/cn";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";

export function Topbar() {
  const pathname = usePathname();
  const { setOpen } = useSearch();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[var(--header-h)] items-center gap-3 border-b border-border bg-bg/90 px-3 backdrop-blur-md sm:px-4 lg:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <div className="lg:hidden">
          <Logo showWordmark className="gap-2" markClassName="size-6" />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-keyshortcuts="Meta+K Control+K"
          className={cn(
            "mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 text-left text-sm text-fg-muted transition-colors",
            "hover:border-[#3a3a3a] hover:text-fg sm:flex",
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Search artists, tokens, mints…</span>
          <kbd className="rounded-md border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <PublicCaChip className="hidden md:inline-flex" />
          <Button
            variant="ghost"
            size="sm"
            className="px-2 sm:hidden"
            aria-label="Open search"
            onClick={() => setOpen(true)}
          >
            <Search className="size-4" />
          </Button>

          <Link
            href="/launch"
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-[#0a0a0a] transition-colors",
              "hover:bg-[#1ed760] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          >
            Launch
          </Link>

          <ConnectWalletButton />
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-bg">
            <div className="flex h-[var(--header-h)] items-center px-4">
              <Logo />
            </div>
            <nav aria-label="Mobile" className="flex flex-col gap-0.5 px-2 py-2">
              {SIDEBAR_NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3.5 rounded-lg px-3 py-3.5 text-base font-semibold tracking-tight",
                      "accent" in item && item.accent
                        ? "text-accent"
                        : active
                          ? "text-white"
                          : "text-[#9a9a9a] hover:text-[#e5e5e5]",
                    )}
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={
                        active || ("accent" in item && item.accent) ? 2.4 : 2.15
                      }
                      aria-hidden
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-border p-4">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
