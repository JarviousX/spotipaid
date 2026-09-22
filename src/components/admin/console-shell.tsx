"use client";

import { Logo } from "@/components/brand/logo";
import { ADMIN_NAV, roleCan } from "@/components/admin/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/types/domain";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function AdminConsoleShell({
  email,
  role,
  children,
}: {
  email: string;
  role: AdminRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const visible = ADMIN_NAV.filter((item) => roleCan(role, item.permission));

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge tone="neutral">Admin</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-fg-muted">
            {email} · <span className="font-mono text-fg">{role}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <nav
          aria-label="Admin"
          className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col"
        >
          {visible.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-fg text-bg"
                    : "text-fg-muted hover:bg-white/5 hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
