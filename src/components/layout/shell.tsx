"use client";

import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/search/command-palette";
import { SearchProvider } from "@/components/search/search-context";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrivileged =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/adm1n") ||
    pathname === "/maintenance";
  const hideFooter =
    pathname === "/launch" ||
    pathname.startsWith("/adm1n") ||
    pathname.startsWith("/admin") ||
    pathname === "/maintenance";

  if (isPrivileged) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg">
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SearchProvider>
      <SidebarProvider>
        <div className="flex min-h-dvh bg-bg">
          <div className="relative z-30 hidden overflow-visible lg:block">
            <Sidebar />
          </div>
          <div className="relative z-0 flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main id="main" className="flex min-h-0 flex-1 flex-col">
              {children}
            </main>
            {hideFooter ? null : <Footer />}
          </div>
        </div>
        <CommandPalette />
        <div
          id="toaster-region"
          aria-live="polite"
          aria-relevant="additions"
        />
      </SidebarProvider>
    </SearchProvider>
  );
}
